/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    },
    serverComponentsExternalPackages: ['pdfjs-dist']
  }
}

module.exports = nextConfig
