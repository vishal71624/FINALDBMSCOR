import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent better-sqlite3 native bindings from being bundled on the server
      config.externals = [...(config.externals ?? []), 'better-sqlite3']
    }

    // Stub out alasql and its broken react-native transitive dependencies
    // so they are never bundled (alasql is a leftover in node_modules)
    const stub = path.resolve(__dirname, 'lib/empty-module.js')
    config.resolve.alias = {
      ...config.resolve.alias,
      alasql: stub,
      'react-native': stub,
      'react-native-fs': stub,
      'react-native-fetch-blob': stub,
    }

    // Allow sql.js dynamic WASM fetch on the client
    config.experiments = { ...config.experiments, asyncWebAssembly: true }
    return config
  },
}

export default nextConfig
