/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/express/:path*',
        destination: `${process.env.EXPRESS_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
