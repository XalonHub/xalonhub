/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
       {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      },
    ],
  },
};

module.exports = nextConfig;
