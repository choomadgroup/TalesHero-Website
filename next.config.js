/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['*.replit.dev', '*.sisko.replit.dev', '127.0.0.1', 'localhost'],
  sassOptions: {
    includePaths: ['./src'],
    silenceDeprecations: ['import'],
  },
  async rewrites() {
    return [
      { source: '/',                destination: '/Public/Index' },
      { source: '/daftar',          destination: '/Public/Daftar' },
      { source: '/api/contact',     destination: '/Api/Contact' },
      { source: '/api/leaderboard', destination: '/Api/Leaderboard' },
    ];
  },
};

module.exports = nextConfig;
