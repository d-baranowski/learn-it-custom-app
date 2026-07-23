const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  // Allow parallel E2E workers to use separate build directories via NEXT_DIST_DIR
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: [],
  async rewrites() {
    const otelCollector = process.env.OTEL_COLLECTOR_URL || 'http://localhost:4318';
    return [
      {
        source: '/otel/:path*',
        destination: `${otelCollector}/:path*`,
      },
    ];
  },
  // async headers() {
  //   return [
  //     {
  //       source: '/locales/:path*',
  //       headers: [
  //         {
  //           key: 'Cache-Control',
  //           value: 'no-cache, must-revalidate',
  //         },
  //       ],
  //     },
  //   ];
  // },
  turbopack: {
    moduleIdStrategy: 'deterministic',
  },
  // Only treat these as pages/components for routing; *.cy.* test files won't match
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx'],
};

module.exports = nextConfig;
