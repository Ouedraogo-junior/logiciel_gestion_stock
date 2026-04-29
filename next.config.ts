import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/wpcqvhtmlibklpgrprig\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-images',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
  ],
})

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  allowedDevOrigins: ['192.168.1.81'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wpcqvhtmlibklpgrprig.supabase.co',
      },
    ],
  },
}

export default withPWA(nextConfig)