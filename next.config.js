/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Unsplash (default config images)
      { protocol: "https", hostname: "images.unsplash.com" },
      // Any external http/https image (covers uploaded CDN or external URLs)
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // Allow unoptimized local uploads served from /public
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

module.exports = nextConfig;
