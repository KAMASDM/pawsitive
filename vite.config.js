import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const buildId = process.env.DEPLOY_ID || `${Date.now().toString(36)}`;

export default defineConfig({
  define: { __APP_BUILD__: JSON.stringify(buildId) },
  plugins: [
    {
      name: 'pawppy-release-version',
      generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ buildId }) }); },
    },
    react({
      include: '**/*.{jsx,js}',
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: false, // PWAUpdateProvider owns the single registration.
      includeAssets: ['paw-icon.svg', 'favicon-v2.png', 'apple-touch-icon-v2.png', 'paw-icon-v2-192.png', 'paw-icon-v2-512.png', 'paw-icon-maskable-v2-512.png', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'Pawppy - Pet Parent Operating System',
        short_name: 'Pawppy',
        description: 'Daily routines, shared care, and pet records in one place.',
        theme_color: '#f6f5f2',
        background_color: '#f6f5f2',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'paw-icon-v2-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'paw-icon-v2-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'paw-icon-maskable-v2-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Dog Resources',
            short_name: 'Dog',
            description: 'Access Dog resources directly',
            url: '/resource?category=dog',
            icons: [
              {
                src: 'paw-icon-v2-192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'Cat Resources',
            short_name: 'Cat',
            description: 'Access Cat resources directly',
            url: '/resource?category=cat',
            icons: [
              {
                src: 'paw-icon-v2-192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        globIgnores: ['**/document-reader/**', '**/pdf.worker*.mjs'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
