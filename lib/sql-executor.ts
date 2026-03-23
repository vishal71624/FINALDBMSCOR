import type { TestCase, TestCaseResult, TableData } from './game-store'

export interface QueryExecutionResult {
  columns: string[]
  rows: (string | number | null)[][]
  error?: string
}

// Dynamically import alasql only on the client to avoid SSR issues.
// alasql is pure JS — no WASM, no CDN fetch, no native bindings.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _alasql: any = null
async function getAlasql() {
  if (_alasql) return _alasql
  if (typeof window === 'undefined') throw new Error('alasql must run in the browser')
  const mod = await import('alasql')
  _alasql = mod.default ?? mod
  return _alasql
}

function normaliseRow(row: (string | number | null)[]): string {
  return row.map(v => (v === null || v === undefined ? 'NULL' : String(v).trim().toLowerCase())).join('|')
}

function compareResults(
  actual: (string | number | null)[][],
  expected: (string | number | null)[][],
  orderMatters: boolean
): boolean {
  if (actual.length !== expected.length) return false
  const a = actual.map(normaliseRow)
  const e = expected.map(normaliseRow)
  if (orderMatters) return a.every((r, i) => r === e[i])
  return [...a].sort().every((r, i) => r === [...e].sort()[i])
}

// Convert an array-of-objects result from alasql into columns + rows arrays
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAlasqlResult(result: any[]): { columns: string[]; rows: (string | number | null)[][] } {
  if (!result || result.length === 0) return { columns: [], rows: [] }
  const columns = Object.keys(result[0])
  const rows = result.map(r => columns.map(c => {
    const v = r[c]
    if (v === null || v === undefined) return null
    if (typeof v === 'number') return v
    return String(v)
  }))
  return { columns, rows }
}

// Populate alasql in-memory tables from TableData and run a query.
// Each call uses a fresh set of uniquely-named tables to avoid collisions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runOnAlasql(tableData: TableData[], query: string): Promise<QueryExecutionResult> {
  const alasql = await getAlasql()

  // Give each run a unique session prefix to keep tables isolated
  const sessionId = Math.random().toString(36).slice(2, 8)
  const nameMap: Record<string, string> = {}

  try {
    // Create and populate each table
    for (const table of tableData) {
      const sessionName = `${table.tableName}_${sessionId}`
      nameMap[table.tableName] = sessionName

      const colDefs = table.columns
        .map(col => {
          const pk = col.isPrimaryKey ? ' PRIMARY KEY' : ''
          return `\`${col.name}\` ${col.type}${pk}`
        })
        .join(', ')
      alasql(`CREATE TABLE IF NOT EXISTS \`${sessionName}\` (${colDefs})`)

      if (table.rows.length > 0) {
        const colNames = table.columns.map(c => `\`${c.name}\``).join(', ')
        const placeholders = table.columns.map(() => '?').join(', ')
        for (const row of table.rows) {
          alasql(`INSERT INTO \`${sessionName}\` (${colNames}) VALUES (${placeholders})`, row)
        }
      }
    }

    // Rewrite query to use session-prefixed table names
    let rewrittenQuery = query
    for (const [original, session] of Object.entries(nameMap)) {
      // Replace whole-word occurrences of the table name (case-insensitive)
      rewrittenQuery = rewrittenQuery.replace(
        new RegExp(`\\b${original}\\b`, 'gi'),
        `\`${session}\``
      )
    }

    const result = alasql(rewrittenQuery)
    const { columns, rows } = parseAlasqlResult(Array.isArray(result) ? result : [])
    return { columns, rows }
  } catch (e) {
    return {
      columns: [],
      rows: [],
      error: e instanceof Error ? e.message : 'SQL execution error',
    }
  } finally {
    // Drop session tables to free memory
    for (const sessionName of Object.values(nameMap)) {
      try { alasql(`DROP TABLE IF EXISTS \`${sessionName}\``) } catch { /* ignore */ }
    }
  }
}

// Execute a single query against table data (pure JS, browser-side)
export async function executeQueryOnTableData(
  query: string,
  tableData: TableData[]
): Promise<QueryExecutionResult> {
  try {
    return await runOnAlasql(tableData, query)
  } catch (e) {
    return {
      columns: [],
      rows: [],
      error: e instanceof Error ? e.message : 'SQL executor failed',
    }
  }
}

// Run test cases for a challenge (pure JS, browser-side, no server fetch)
export async function runTestCasesWithEngine(
  userQuery: string,
  testCases: TestCase[],
  correctQuery?: string
): Promise<TestCaseResult[]> {
  const orderMatters = userQuery.toLowerCase().includes('order by')
  const results: TestCaseResult[] = []

  for (const tc of testCases) {
    try {
      // Determine expected rows
      let expectedRows: (string | number | null)[][] = tc.expectedOutput ?? []
      if (correctQuery) {
        const expResult = await runOnAlasql(tc.tableData, correctQuery)
        if (!expResult.error) expectedRows = expResult.rows
      }

      // Run user query
      const actual = await runOnAlasql(tc.tableData, userQuery)

      if (actual.error) {
        results.push({ testCaseId: tc.id, passed: false, actualOutput: null, error: actual.error })
      } else {
        const passed = compareResults(actual.rows, expectedRows, orderMatters)
        results.push({
          testCaseId: tc.id,
          passed,
          actualOutput: actual.rows,
          error: passed ? undefined : 'Output does not match expected result',
        })
      }
    } catch (e) {
      results.push({
        testCaseId: tc.id,
        passed: false,
        actualOutput: null,
        error: e instanceof Error ? e.message : 'Execution error',
      })
    }
  }

  return results
}
