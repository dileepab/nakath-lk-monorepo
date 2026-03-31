import path from "node:path"
import { fileURLToPath } from "node:url"
import withPWAInit from "@ducanh2912/next-pwa"

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

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
  transpilePackages: ["@acme/core"],
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  experimental: {
    externalDir: true,
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost', '192.168.1.19', '[::1]'],
  turbopack: {
    root: workspaceRoot,
  },
}

export default withPWA(nextConfig)
