const nextConfig = {
  // Using webpack bundler explicitly to avoid Turbopack issues
  // If you want to use Turbopack later, run: npm run dev -- --turbo
  webpack: (config, { isServer }) => {
    // Ignore test files from node_modules (these are just warnings)
    config.ignoreWarnings = [
      { module: /node_modules\/thread-stream\/test/ },
      { module: /node_modules\/.*\/test\// },
    ];
    return config;
  },
  turbopack: {},
};

export default nextConfig;
