import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Revalidation toutes les 30s pour les Server Components
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
}

export default nextConfig
