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
        port: '5001',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    // Remove /api from the end for proxying to /admin
    const baseUrl = apiUrl.replace(/\/api$/, '');
    
    return [
      {
        source: '/admin/:path*',
        destination: `${baseUrl}/admin/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/',
        permanent: true,
      },
    ];
  },
};



module.exports = nextConfig;
