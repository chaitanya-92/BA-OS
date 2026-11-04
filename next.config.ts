import type { NextConfig } from "next";
const nextConfig: NextConfig = { reactStrictMode: true, poweredByHeader: false, experimental: { optimizePackageImports: ["@heroicons/react"] } };
export default nextConfig;
