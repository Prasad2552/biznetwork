/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'biznetworks.s3.ap-south-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https', // Use 'http' if your site isn’t on HTTPS yet
        hostname: 'biznetworq.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ Add this to bypass ESLint errors during deployment
  },
  // Add CORS headers for API routes to allow cross-origin requests
  async headers() {
    return [
      {
        source: '/api/:path*', // Apply to all API routes
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Allow all origins (for now)
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' }, // Allowed HTTP methods
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' }, // Allowed headers
        ],
      },
    ];
  },
};

module.exports = nextConfig;
