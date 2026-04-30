import withPWAInit from '@ducanh2912/next-pwa'
import type { NextConfig } from 'next'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [

      // ─── 1. Assets statiques Next.js (JS, CSS, fonts) ───────────────
      // Chargés une fois, mis en cache longtemps
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static-assets',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
          },
        },
      },

      // ─── 2. Images Next.js optimisées ───────────────────────────────
      {
        urlPattern: /\/_next\/image\?.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-images',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
          },
        },
      },

      // ─── 3. Images et fichiers Supabase Storage ──────────────────────
      // Logo boutique, photos produits...
      {
        urlPattern: /^https:\/\/wpcqvhtmlibklpgrprig\.supabase\.co\/storage\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'supabase-storage',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
          },
        },
      },

      // ─── 4. API Supabase (données) ───────────────────────────────────
      // NetworkFirst = essaie le réseau, tombe sur le cache si offline
      {
        urlPattern: /^https:\/\/wpcqvhtmlibklpgrprig\.supabase\.co\/rest\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api',
          networkTimeoutSeconds: 5, // bascule sur cache après 5s
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24h max en cache
          },
        },
      },

      // ─── 5. Tes routes API Next.js ──────────────────────────────────
      // NetworkFirst = données fraîches si connecté, cache si offline
      {
        urlPattern: /^\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-routes',
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1h max en cache
          },
        },
      },

      // ─── 6. Pages de l'app ──────────────────────────────────────────
      // StaleWhileRevalidate = affiche le cache, met à jour en arrière-plan
      {
        urlPattern: /^\/(dashboard|products|stock|orders|debts|receipts).*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'app-pages',
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24, // 24h
          },
        },
      },

      // ─── 7. Polices Google Fonts (si utilisées) ──────────────────────
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
          },
        },
      },
    ],
  },
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
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