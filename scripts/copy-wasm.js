import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

// Absolute path to the project root in the v0 sandbox
const root = '/vercel/share/v0-project'

// Locate sql.js wasm file relative to project root
const wasmSrc = resolve(root, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')

const publicDir = resolve(root, 'public')
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })

const wasmDest = resolve(publicDir, 'sql-wasm.wasm')
copyFileSync(wasmSrc, wasmDest)
console.log(`Copied sql-wasm.wasm to ${wasmDest}`)
