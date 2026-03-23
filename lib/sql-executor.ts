import type { TestCase, TestCaseResult, TableData } from './game-store'

export interface QueryExecutionResult {
  columns: string[]
  rows: (string | number | null)[][]
  error?: string
}

// Singleton SQL.js instance – initialised once and reused across calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sqlJs: any = null

async function getSQLJs() {
  if (_sqlJs) return _sqlJs
  // Dynamically import so it is never executed on the server (SSR)
  const initSqlJs = (await import('sql.js')).default
  _sqlJs = await initSqlJs({
    // Serve the WASM binary from the official CDN so no public-folder copy is needed
    locateFile: (filename: string) =>
      `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${filename}`,
  })
  return _sqlJs
}

// Map generic SQL type strings to SQLite-compatible types
function sqliteType(t: string): string {
  const u = t.toUpperCase()
  if (u.includes('INT')) return 'INTEGER'
  if (
    u.includes('DECIMAL') ||
    u.includes('FLOAT') ||
    u.includes('NUMERIC') ||
    u.includes('REAL') ||
    u.includes('DOUBLE')
  )
    return 'REAL'
  return 'TEXT'
}

// Create an in-memory SQLite database, populate it with the provided TableData,
// then run a query and return columns + rows.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runOnDb(SQL: any, tableData: TableData[], query: string): QueryExecutionResult {
  const db = new SQL.Database()
  try {
    // Create & populate tables
    for (const table of tableData) {
      const colDefs = table.columns
        .map(col => {
          const type = sqliteType(col.type)
          const pk = col.isPrimaryKey ? ' PRIMARY KEY' : ''
          return `"${col.name}" ${type}${pk}`
        })
        .join(', ')
      db.run(`CREATE TABLE IF NOT EXISTS "${table.tableName}" (${colDefs})`)

      const colNames = table.columns.map(c => `"${c.name}"`).join(', ')
      const placeholders = table.columns.map(() => '?').join(', ')
      const stmt = db.prepare(
        `INSERT INTO "${table.tableName}" (${colNames}) VALUES (${placeholders})`
      )
      for (const row of table.rows) {
        stmt.run(row)
      }
      stmt.free()
    }

    // Execute user / correct query
    const results = db.exec(query)
    if (!results || results.length === 0) {
      return { columns: [], rows: [] }
    }
    const { columns, values } = results[0]
    const rows: (string | number | null)[][] = (values as unknown[][]).map(r =>
      r.map(v => {
        if (v === null || v === undefined) return null
        if (typeof v === 'number') return v
        return String(v)
      })
    )
    return { columns: columns as string[], rows }
  } catch (e) {
    return {
      columns: [],
      rows: [],
      error: e instanceof Error ? e.message : 'SQL execution error',
    }
  } finally {
    db.close()
  }
}

function normaliseRow(row: (string | number | null)[]): string {
  return row.map(v => (v === null ? 'NULL' : String(v).trim().toLowerCase())).join('|')
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

// Execute a single query against table data (WASM, browser-side)
export async function executeQueryOnTableData(
  query: string,
  tableData: TableData[]
): Promise<QueryExecutionResult> {
  try {
    const SQL = await getSQLJs()
    return runOnDb(SQL, tableData, query)
  } catch (e) {
    return {
      columns: [],
      rows: [],
      error: e instanceof Error ? e.message : 'WASM init failed',
    }
  }
}

// Run test cases for a challenge (WASM, browser-side, no server fetch)
export async function runTestCasesWithEngine(
  userQuery: string,
  testCases: TestCase[],
  correctQuery?: string
): Promise<TestCaseResult[]> {
  try {
    const SQL = await getSQLJs()
    const orderMatters = userQuery.toLowerCase().includes('order by')
    const results: TestCaseResult[] = []

    for (const tc of testCases) {
      try {
        // Determine expected rows: run correctQuery if provided, else use stored expectedOutput
        let expectedRows: (string | number | null)[][] = tc.expectedOutput ?? []
        if (correctQuery) {
          const expResult = runOnDb(SQL, tc.tableData, correctQuery)
          if (!expResult.error) {
            expectedRows = expResult.rows
          }
        }

        // Run user query
        const actual = runOnDb(SQL, tc.tableData, userQuery)

        if (actual.error) {
          results.push({
            testCaseId: tc.id,
            passed: false,
            actualOutput: null,
            error: actual.error,
          })
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
  } catch (e) {
    return testCases.map(tc => ({
      testCaseId: tc.id,
      passed: false,
      actualOutput: null,
      error: e instanceof Error ? e.message : 'WASM init failed',
    }))
  }
}
