import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Resolve the sql.js package directory
const sqlJsPkg = require.resolve('sql.js/dist/sql-wasm.wasm')

const dest = resolve(__dirname, '../public/sql-wasm.wasm')

mkdirSync(resolve(__dirname, '../public'), { recursive: true })

if (existsSync(sqlJsPkg)) {
  copyFileSync(sqlJsPkg, dest)
  console.log(`Copied sql-wasm.wasm to public/`)
} else {
  console.error('sql-wasm.wasm not found in sql.js package')
  process.exit(1)
}
