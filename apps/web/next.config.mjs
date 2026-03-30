import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  experimental: {
    externalDir: true,
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.1.19', '[::1]'],
  turbopack: {},
}

export default withPWA(nextConfig)
