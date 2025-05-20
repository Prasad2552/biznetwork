/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "biznetworks.s3.ap-south-1.amazonaws.com"],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.pdf$/,
      type: "asset/resource",
    });


    // Add fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      process: false,
      module: false,
      canvas: false,
    };

    if (isServer) {
        config.externals.push('pdfjs-dist');
      }


    return config;
  },
  output: 'standalone',
}

module.exports = nextConfig