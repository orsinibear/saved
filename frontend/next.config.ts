const nextConfig = {
  // Disable React Strict Mode to avoid double rendering in development
  reactStrictMode: false,
  
  // Configure webpack to handle module resolution issues
  webpack: (config, { isServer }) => {
    // Ignore test files and other problematic modules (warnings only)
    config.ignoreWarnings = [
      { module: /node_modules\/thread-stream/ },
      { module: /node_modules\/.*\/test\// },
      { module: /node_modules\/.*\/node_modules\/thread-stream/ },
    ];

    // Completely ignore thread-stream test files so they are never bundled
    config.module.rules.push({
      test: /thread-stream[\\/](test|pkg)[\\/].*\.(js|mjs|ts|tsx)$/,
      use: 'ignore-loader',
    });

    // Stub out tap/tape/why-is-node-running used only in those tests
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      tap: false,
      tape: false,
      'why-is-node-running': false,
    };

    // Add fallbacks for Node.js core modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        path: false,
      };
    }

    return config;
  },
  
  // Disable Turbopack for now due to compatibility issues
  experimental: {
    turbo: false,
  },
  
  // Add support for static exports if needed
  output: 'standalone',
  
  // Configure TypeScript to ignore build errors for now
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configure ESLint to ignore during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
