/** @type {import('next').NextConfig} */
const path = require("path");
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig = {
  reactStrictMode: true,

  // Next 16 enables Turbopack by default. Configure aliases here.
  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname),
    },
  },
};

module.exports = withNextIntl(nextConfig);
