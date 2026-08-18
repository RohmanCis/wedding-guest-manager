/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // postgres.js resolves dynamically at require-time; bundling it breaks
    // module evaluation in RSC chunks (page render hangs before executing).
    serverComponentsExternalPackages: ["postgres"]
  }
};

export default nextConfig;
