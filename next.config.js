/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'biznetworks.s3.ap-south-1.amazonaws.com', // Replace with your S3 hostname if needed
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
              hostname: 'i.ytimg.com', // Add YouTube image hostname
              port: '',
              pathname: '/vi/**', // Specify a more specific path if possible
          },
      ],
  },
};

module.exports = nextConfig;