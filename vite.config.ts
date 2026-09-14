import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'QR Studio 2.0',
        short_name: 'QR Studio',
        description: 'Professional QR code generator and scanner with advanced styling',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-72x72.svg',
            sizes: '72x72',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-96x96.svg',
            sizes: '96x96',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-128x128.svg',
            sizes: '128x128',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-144x144.svg',
            sizes: '144x144',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-152x152.svg',
            sizes: '152x152',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-384x384.svg',
            sizes: '384x384',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable any'
          }
        ],
        shortcuts: [
          {
            name: 'Generate QR',
            short_name: 'Generate',
            description: 'Create a new QR code',
            url: '/',
            icons: [{ src: '/icons/generate-icon.svg', sizes: '96x96', type: 'image/svg+xml' }]
          },
          {
            name: 'Scan QR',
            short_name: 'Scan',
            description: 'Scan a QR code',
            url: '/scanner',
            icons: [{ src: '/icons/scan-icon.svg', sizes: '96x96', type: 'image/svg+xml' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@store': path.resolve(__dirname, './src/store'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          qr: ['qr-code-styling', 'html5-qrcode'],
          export: ['jszip', 'jspdf', 'papaparse'],
          table: ['@tanstack/react-table', 'react-window'],
          store: ['zustand', 'idb']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});