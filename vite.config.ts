import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['**/*.{js,mjs,css,html,ico,png,svg,json,webmanifest,bin,weights,onnx,wasm}'],
      manifest: {
        short_name: 'AcuSound',
        name: 'AcuSound – AI Respiratory Detection',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        start_url: '/',
        display: 'standalone',
        theme_color: '#1E88E5',
        background_color: '#F5F7FA',
      },
      workbox: {
        globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,json,bin,onnx,wasm}'],
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(models\/.*\.onnx|ort\/.*\.(mjs|wasm)|ort-.*\.wasm)/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ai-models',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    https: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
