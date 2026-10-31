/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // postgres.js resolves dynamically at require-time; bundling it breaks
    // module evaluation in RSC chunks (page render hangs before executing).
    serverComponentsExternalPackages: ["postgres"],
    // Dynamic pages carry no client Router Cache: a mutation followed by a
    // revisit must not serve a stale RSC payload (30s default).
    staleTimes: { dynamic: 0 }
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Content-Security-Policy",
            // Minimal: Next injects inline scripts, so no script-src yet.
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
