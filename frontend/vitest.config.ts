// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'node:path';

export default defineConfig({
  
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    css: true,
    testTimeout: 10000, // Aumentar timeout para tests async
    exclude: ['e2e/**', '**/node_modules/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),    // 👈 asegúrate que @ apunta a /src
    },
  },
})