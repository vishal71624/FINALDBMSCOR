/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle WASM for PGlite
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    
    // Ensure WASM files are properly handled
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })
    
    // Fallback for Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    
    return config
  },
}

export default nextConfig
