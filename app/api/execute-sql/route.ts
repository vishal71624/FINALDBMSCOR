import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import type { TableData } from '@/lib/game-store'

export interface ExecuteSQLRequest {
  query: string
  tableData: TableData[]
}

export interface ExecuteSQLResponse {
  columns: string[]
  rows: (string | number | null)[][]
  error?: string
}

function buildSession(db: InstanceType<typeof Database>, tables: TableData[], prefix: string) {
  const created: string[] = []
  for (const table of tables) {
    const tName = `${prefix}_${table.tableName}`
    created.push(tName)

    const colDefs = table.columns
      .map(col => {
        const pkStr = col.isPrimaryKey ? ' PRIMARY KEY' : ''
        return `"${col.name}" ${col.type}${pkStr}`
      })
      .join(', ')

    db.exec(`CREATE TABLE IF NOT EXISTS "${tName}" (${colDefs})`)

    const colNames = table.columns.map(c => `"${c.name}"`).join(', ')
    const placeholders = table.columns.map(() => '?').join(', ')
    const insert = db.prepare(`INSERT INTO "${tName}" (${colNames}) VALUES (${placeholders})`)

    for (const row of table.rows) {
      insert.run(...row.map(v => (v === null || v === undefined ? null : v)))
    }
  }
  return created
}

function rewriteQuery(query: string, tables: TableData[], prefix: string): string {
  let out = query
  for (const table of tables) {
    const regex = new RegExp(`\\b${escapeRegex(table.tableName)}\\b`, 'gi')
    out = out.replace(regex, `${prefix}_${table.tableName}`)
  }
  return out
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function runQuery(
  db: InstanceType<typeof Database>,
  query: string,
  tables: TableData[],
  prefix: string
): ExecuteSQLResponse {
  const created = buildSession(db, tables, prefix)
  try {
    const rewritten = rewriteQuery(query, tables, prefix)
    const stmt = db.prepare(rewritten)
    const raw = stmt.all() as Record<string, unknown>[]

    if (!raw || raw.length === 0) {
      return { columns: [], rows: [] }
    }

    const columns = Object.keys(raw[0])
    const rows: (string | number | null)[][] = raw.map(row =>
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
    for (const tName of created) {
      try { db.exec(`DROP TABLE IF EXISTS "${tName}"`) } catch { /* ignore */ }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ExecuteSQLRequest & {
      mode?: 'single' | 'testcases'
      testCases?: Array<{ id: number; tableData: TableData[]; expectedOutput?: (string | number | null)[][] }>
      correctQuery?: string
    }

    const db = new Database(':memory:')
    db.pragma('journal_mode = WAL')

    if (body.mode === 'testcases') {
      const { query, testCases = [], correctQuery } = body
      const results = []

      for (const tc of testCases) {
        const prefix = `s${Math.random().toString(36).slice(2, 8)}`

        // Determine expected output
        let expectedOutput = tc.expectedOutput ?? []
        if (correctQuery && expectedOutput.length === 0) {
          const expResult = runQuery(db, correctQuery, tc.tableData, `exp_${prefix}`)
          expectedOutput = expResult.rows
        }

        // Run user query
        const userResult = runQuery(db, query, tc.tableData, `usr_${prefix}`)

        if (userResult.error) {
          results.push({ testCaseId: tc.id, passed: false, actualOutput: null, error: userResult.error })
          continue
        }

        const orderMatters = query.toLowerCase().includes('order by')
        const passed = compareResults(userResult.rows, expectedOutput, orderMatters)
        results.push({
          testCaseId: tc.id,
          passed,
          actualOutput: userResult.rows,
          error: passed ? undefined : 'Output does not match expected result',
        })
      }

      db.close()
      return NextResponse.json({ results })
    }

    // Single query mode
    const prefix = `s${Math.random().toString(36).slice(2, 8)}`
    const result = runQuery(db, body.query, body.tableData, prefix)
    db.close()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { columns: [], rows: [], error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

function compareResults(
  actual: (string | number | null)[][],
  expected: (string | number | null)[][],
  orderMatters: boolean
): boolean {
  if (actual.length !== expected.length) return false
  const normalize = (row: (string | number | null)[]) =>
    row.map(v => (v === null ? 'NULL' : String(v).toLowerCase())).join('|')
  const a = actual.map(normalize)
  const e = expected.map(normalize)
  if (orderMatters) return a.every((r, i) => r === e[i])
  return [...a].sort().every((r, i) => r === [...e].sort()[i])
}
