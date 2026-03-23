import { PGlite } from '@electric-sql/pglite'
import type { TestCase, TestCaseResult, TableData } from './game-store'

// Result type for executing a query and getting output
export interface QueryExecutionResult {
  columns: string[]
  rows: (string | number | null)[][]
  error?: string
}

// Create table DDL from TableData
function buildCreateTableSQL(table: TableData): string {
  const colDefs = table.columns.map(col => {
    let type = 'TEXT'
    switch (col.type.toUpperCase()) {
      case 'INT':
      case 'INTEGER':
        type = 'INTEGER'
        break
      case 'DECIMAL':
      case 'FLOAT':
      case 'DOUBLE':
      case 'NUMERIC':
        type = 'NUMERIC'
        break
      case 'DATE':
        type = 'DATE'
        break
      case 'BOOLEAN':
        type = 'BOOLEAN'
        break
      default:
        type = 'TEXT'
    }
    const pk = col.isPrimaryKey ? ' PRIMARY KEY' : ''
    return `"${col.name}" ${type}${pk}`
  })
  return `CREATE TABLE "${table.tableName}" (${colDefs.join(', ')})`
}

// Build INSERT statements for table data
function buildInsertSQL(table: TableData): string[] {
  if (table.rows.length === 0) return []
  
  const statements: string[] = []
  const colNames = table.columns.map(c => `"${c.name}"`).join(', ')
  
  for (const row of table.rows) {
    const values = row.map(val => {
      if (val === null) return 'NULL'
      if (typeof val === 'number') return String(val)
      // Escape single quotes in strings
      return `'${String(val).replace(/'/g, "''")}'`
    }).join(', ')
    statements.push(`INSERT INTO "${table.tableName}" (${colNames}) VALUES (${values})`)
  }
  
  return statements
}

// Execute a query against table data and return the result (columns + rows)
// Used to compute expected output from the correct query
export async function executeQueryOnTableData(
  query: string,
  tableData: TableData[]
): Promise<QueryExecutionResult> {
  const db = new PGlite()
  
  try {
    // Set up tables
    for (const table of tableData) {
      const createSQL = buildCreateTableSQL(table)
      await db.exec(createSQL)
      
      const insertStatements = buildInsertSQL(table)
      for (const stmt of insertStatements) {
        await db.exec(stmt)
      }
    }
    
    // Execute the query
    const queryResult = await db.query(query)
    
    // Extract column names from the result
    const columns = queryResult.fields?.map(f => f.name) || []
    
    // Extract rows from result
    const rows: (string | number | null)[][] = queryResult.rows.map(row => {
      const rowObj = row as Record<string, unknown>
      return columns.map(colName => {
        const v = rowObj[colName]
        if (v === null || v === undefined) return null
        if (typeof v === 'number') return v
        return String(v)
      })
    })
    
    return { columns, rows }
  } catch (e) {
    return {
      columns: [],
      rows: [],
      error: e instanceof Error ? e.message : 'SQL execution error'
    }
  } finally {
    await db.close()
  }
}

// Compare results (order-insensitive unless query has ORDER BY)
function compareResults(
  actual: (string | number | null)[][],
  expected: (string | number | null)[][],
  orderMatters: boolean
): boolean {
  if (actual.length !== expected.length) return false
  
  const normalizeRow = (row: (string | number | null)[]) =>
    row.map(v => v === null ? 'NULL' : String(v).toLowerCase()).join('|')
  
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
  correctQuery?: string // Optional: if provided, use this to compute expected output dynamically
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = []
  
  for (const testCase of testCases) {
    // Create a fresh in-memory PGlite instance for each test case
    const db = new PGlite()
    
    try {
      // Set up tables
      for (const table of testCase.tableData) {
        const createSQL = buildCreateTableSQL(table)
        await db.exec(createSQL)
        
        const insertStatements = buildInsertSQL(table)
        for (const stmt of insertStatements) {
          await db.exec(stmt)
        }
      }
      
      // Determine expected output: either use stored expectedOutput or compute dynamically from correctQuery
      let expectedOutput = testCase.expectedOutput
      
      if (correctQuery && (!expectedOutput || expectedOutput.length === 0)) {
        // Compute expected output dynamically by running the correct query
        try {
          const correctResult = await db.query(correctQuery)
          expectedOutput = correctResult.rows.map(row => {
            const rowObj = row as Record<string, unknown>
            return Object.values(rowObj).map(v => {
              if (v === null || v === undefined) return null
              if (typeof v === 'number') return v
              return String(v)
            })
          })
        } catch {
          // If correct query fails, fall back to stored expectedOutput
          expectedOutput = testCase.expectedOutput
        }
      }
      
      // Execute user's query
      const queryResult = await db.query(userQuery)
      
      // Extract rows from result
      const actualRows: (string | number | null)[][] = queryResult.rows.map(row => {
        // PGlite returns rows as objects, convert to array in column order
        const rowObj = row as Record<string, unknown>
        return Object.values(rowObj).map(v => {
          if (v === null || v === undefined) return null
          if (typeof v === 'number') return v
          return String(v)
        })
      })
      
      // Compare with expected output
      const orderMatters = userQuery.toLowerCase().includes('order by')
      const passed = compareResults(actualRows, expectedOutput, orderMatters)
      
      results.push({
        testCaseId: testCase.id,
        passed,
        actualOutput: actualRows,
        error: passed ? undefined : 'Output does not match expected result'
      })
    } catch (e) {
      results.push({
        testCaseId: testCase.id,
        passed: false,
        actualOutput: null,
        error: e instanceof Error ? e.message : 'SQL execution error'
      })
    } finally {
      // Clean up - close the database
      await db.close()
    }
  }
  
  return results
}
