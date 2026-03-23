import type { TestCase, TestCaseResult, TableData } from './game-store'

// Result type for executing a query and getting output
export interface QueryExecutionResult {
  columns: string[]
  rows: (string | number | null)[][]
  error?: string
}

// Lazy-load alasql (pure JS, no WASM, no fetch)
async function getAlasql() {
  const mod = await import('alasql')
  return mod.default as (query: string, params?: unknown[]) => unknown
}

// Run SQL against an isolated alasql database instance
// alasql uses a global namespace for tables, so we prefix table names with a
// session id to avoid collisions between concurrent calls.
function makeSessionId() {
  return `_s${Math.random().toString(36).slice(2, 10)}`
}

function prefixedTableName(session: string, name: string) {
  return `${session}_${name}`
}

// Execute a query against table data and return the result (columns + rows)
export async function executeQueryOnTableData(
  query: string,
  tableData: TableData[]
): Promise<QueryExecutionResult> {
  const alasql = await getAlasql()
  const session = makeSessionId()
  const createdTables: string[] = []

  try {
    // Create tables
    for (const table of tableData) {
      const tName = prefixedTableName(session, table.tableName)
      createdTables.push(tName)

      const colDefs = table.columns
        .map(col => {
          const pk = col.isPrimaryKey ? ' PRIMARY KEY' : ''
          return `[${col.name}] ${col.type}${pk}`
        })
        .join(', ')
      alasql(`CREATE TABLE [${tName}] (${colDefs})`)

      for (const row of table.rows) {
        const params: unknown[] = []
        const placeholders = row
          .map(v => {
            params.push(v)
            return '?'
          })
          .join(', ')
        const colNames = table.columns.map(c => `[${c.name}]`).join(', ')
        alasql(
          `INSERT INTO [${tName}] (${colNames}) VALUES (${placeholders})`,
          params
        )
      }
    }

    // Rewrite table names in the user query to the prefixed versions
    let rewrittenQuery = query
    for (const table of tableData) {
      const regex = new RegExp(
        `\\b${escapeRegex(table.tableName)}\\b`,
        'gi'
      )
      rewrittenQuery = rewrittenQuery.replace(
        regex,
        prefixedTableName(session, table.tableName)
      )
    }

    const rawResults = alasql(rewrittenQuery) as Record<string, unknown>[]

    if (!rawResults || rawResults.length === 0) {
      return { columns: [], rows: [] }
    }

    const columns = Object.keys(rawResults[0])
    const rows: (string | number | null)[][] = rawResults.map(row =>
      columns.map(col => {
        const v = row[col]
        if (v === null || v === undefined) return null
        if (typeof v === 'number') return v
        return String(v)
      })
    )

    return { columns, rows }
  } catch (e) {
    return {
      columns: [],
      rows: [],
      error: e instanceof Error ? e.message : 'SQL execution error',
    }
  } finally {
    // Drop all created tables to clean up
    for (const tName of createdTables) {
      try {
        alasql(`DROP TABLE IF EXISTS [${tName}]`)
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Compare results (order-insensitive unless query has ORDER BY)
function compareResults(
  actual: (string | number | null)[][],
  expected: (string | number | null)[][],
  orderMatters: boolean
): boolean {
  if (actual.length !== expected.length) return false

  const normalizeRow = (row: (string | number | null)[]) =>
    row
      .map(v => (v === null ? 'NULL' : String(v).toLowerCase()))
      .join('|')

  const actualNormalized = actual.map(normalizeRow)
  const expectedNormalized = expected.map(normalizeRow)

  if (orderMatters) {
    return actualNormalized.every((row, i) => row === expectedNormalized[i])
  } else {
    const actualSorted = [...actualNormalized].sort()
    const expectedSorted = [...expectedNormalized].sort()
    return actualSorted.every((row, i) => row === expectedSorted[i])
  }
}

export async function runTestCasesWithEngine(
  userQuery: string,
  testCases: TestCase[],
  correctQuery?: string
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = []
  const alasql = await getAlasql()

  for (const testCase of testCases) {
    const session = makeSessionId()
    const createdTables: string[] = []

    try {
      // Create tables for this test case
      for (const table of testCase.tableData) {
        const tName = prefixedTableName(session, table.tableName)
        createdTables.push(tName)

        const colDefs = table.columns
          .map(col => {
            const pk = col.isPrimaryKey ? ' PRIMARY KEY' : ''
            return `[${col.name}] ${col.type}${pk}`
          })
          .join(', ')
        alasql(`CREATE TABLE [${tName}] (${colDefs})`)

        for (const row of table.rows) {
          const params: unknown[] = []
          const placeholders = row
            .map(v => {
              params.push(v)
              return '?'
            })
            .join(', ')
          const colNames = table.columns.map(c => `[${c.name}]`).join(', ')
          alasql(
            `INSERT INTO [${tName}] (${colNames}) VALUES (${placeholders})`,
            params
          )
        }
      }

      // Helper to rewrite table names in a query
      const rewrite = (q: string) => {
        let out = q
        for (const table of testCase.tableData) {
          const regex = new RegExp(
            `\\b${escapeRegex(table.tableName)}\\b`,
            'gi'
          )
          out = out.replace(
            regex,
            prefixedTableName(session, table.tableName)
          )
        }
        return out
      }

      // Determine expected output
      let expectedOutput = testCase.expectedOutput

      if (correctQuery && (!expectedOutput || expectedOutput.length === 0)) {
        try {
          const correctRaw = alasql(rewrite(correctQuery)) as Record<
            string,
            unknown
          >[]
          if (correctRaw && correctRaw.length > 0) {
            const cols = Object.keys(correctRaw[0])
            expectedOutput = correctRaw.map(row =>
              cols.map(col => {
                const v = row[col]
                if (v === null || v === undefined) return null
                if (typeof v === 'number') return v
                return String(v)
              })
            )
          }
        } catch {
          expectedOutput = testCase.expectedOutput
        }
      }

      // Execute user's query
      let actualRows: (string | number | null)[][] = []
      try {
        const userRaw = alasql(rewrite(userQuery)) as Record<
          string,
          unknown
        >[]
        if (userRaw && userRaw.length > 0) {
          const cols = Object.keys(userRaw[0])
          actualRows = userRaw.map(row =>
            cols.map(col => {
              const v = row[col]
              if (v === null || v === undefined) return null
              if (typeof v === 'number') return v
              return String(v)
            })
          )
        }
      } catch (e) {
        results.push({
          testCaseId: testCase.id,
          passed: false,
          actualOutput: null,
          error: e instanceof Error ? e.message : 'SQL execution error',
        })
        continue
      }

      const orderMatters = userQuery.toLowerCase().includes('order by')
      const passed = compareResults(actualRows, expectedOutput, orderMatters)

      results.push({
        testCaseId: testCase.id,
        passed,
        actualOutput: actualRows,
        error: passed ? undefined : 'Output does not match expected result',
      })
    } catch (e) {
      results.push({
        testCaseId: testCase.id,
        passed: false,
        actualOutput: null,
        error: e instanceof Error ? e.message : 'SQL execution error',
      })
    } finally {
      for (const tName of createdTables) {
        try {
          alasql(`DROP TABLE IF EXISTS [${tName}]`)
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }

  return results
}
