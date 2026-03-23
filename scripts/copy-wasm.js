import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, createRequire } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Locate sql.js package directory
const sqlJsDir = dirname(require.resolve('sql.js/package.json'))
const wasmSrc = resolve(sqlJsDir, 'dist', 'sql-wasm.wasm')

const publicDir = resolve(__dirname, '..', 'public')
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })

const wasmDest = resolve(publicDir, 'sql-wasm.wasm')
copyFileSync(wasmSrc, wasmDest)
console.log(`Copied sql-wasm.wasm to ${wasmDest}`)
