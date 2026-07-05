import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  // Note: no CORS headers on /api/* on purpose — these routes are called
  // same-origin by our own frontend only. A previous `Allow-Origin: *` +
  // `Allow-Credentials: true` combo here let any website call them.
};

export default withNextIntl(nextConfig);
