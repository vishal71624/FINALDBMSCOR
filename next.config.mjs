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
      // Prevent better-sqlite3 native bindings from bundling on the server
      config.externals = [
        ...(config.externals ?? []),
        'better-sqlite3',
      ]
    }

    // Stub out react-native transitive deps that alasql pulls in on BOTH
    // server and client bundles (alasql.fs.js has a top-level require())
    const stub = path.resolve(__dirname, 'lib/empty-module.js')
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-native': stub,
      'react-native-fs': stub,
      'react-native-fetch-blob': stub,
      // Also stub sql.js so any leftover import references don't resolve
      'sql.js': stub,
    }

    return config
  },
}

export default nextConfig
