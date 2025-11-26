// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'node:path';

export default defineConfig({
  
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    css: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),    // 👈 asegúrate que @ apunta a /src
      'leaflet/dist/leaflet.css': path.resolve(__dirname, 'src/__mocks__/leaflet.css'),
    },
  },
})