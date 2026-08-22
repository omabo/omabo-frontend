const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Local dev only: tenant booking sites are reached via a subdomain
  // (e.g. demo.book.omabo.local), which Next's dev-server cross-origin
  // guard blocks by default — without this, JS chunks 403 and the page
  // never hydrates (buttons look present but do nothing).
  allowedDevOrigins: ["**.book.omabo.local"],
};

module.exports = withNextIntl(nextConfig);
