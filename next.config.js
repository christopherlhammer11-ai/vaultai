/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverComponentsExternalPackages: [
      'pdf-parse',
      '@napi-rs/canvas',
      'pdfjs-dist',
      '@prisma/client',
    ],
  },
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle native modules — they need to load from node_modules at runtime
      config.externals = [...(config.externals || []), {
        'pdf-parse': 'commonjs pdf-parse',
        '@napi-rs/canvas': 'commonjs @napi-rs/canvas',
      }];
    }
    return config;
  },
};

export default nextConfig;
