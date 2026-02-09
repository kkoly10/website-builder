/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,

  // Next 16 enables Turbopack by default. Configure aliases here.
  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname),
    },
  },
};

module.exports = nextConfig;
