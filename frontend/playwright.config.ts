import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests E2E
 * 
 * Estos tests están diseñados para ejecutarse contra:
 * - Backend API real con MongoDB (via Docker o local)
 * - Frontend de desarrollo
 * 
 * @see https://playwright.dev/docs/test-configuration
 */

// URL del backend (puede ser override via env)
// Usamos 127.0.0.1 en lugar de localhost para evitar problemas con IPv6
const API_URL =
  process.env.API_URL ||
  process.env.VITE_API_URL ||
  'http://127.0.0.1:8000';
const FRONTEND_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  
  /* Global Setup - crea datos de prueba antes de los tests */
  globalSetup: './e2e/global-setup.ts',
  
  /* Global Teardown - limpia datos de prueba después de los tests */
  globalTeardown: './e2e/global-teardown.ts',
  
  /* Configuración general */
  fullyParallel: true, // Habilitar paralelismo completo
  forbidOnly: !!process.env.CI,
  retries: 0, // Sin retries para detección rápida de fallos
  // Reducir workers en CI para evitar quota exceeded de Firebase
  workers: process.env.CI ? 2 : 8,
  
  /* Timeouts */
  timeout: 60 * 1000, // 60 segundos por test
  expect: {
    timeout: 10 * 1000, // 10 segundos para assertions
  },

  /* Reporters */
  reporter: process.env.CI 
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  /* Configuración compartida para todos los proyectos */
  use: {
    /* URL base */
    baseURL: FRONTEND_URL,
    
    /* Traces y screenshots */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    
    /* Acciones más lentas para debugging */
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    
    /* Headers adicionales deshabilitados - causan problemas con reCAPTCHA */
    // extraHTTPHeaders: {
    //   'X-E2E-Test': 'true',
    // },
  },

  /* Proyectos de navegadores */
  projects: [
    // Setup project para autenticación
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Tests que requieren autenticación (usan storageState del setup)
    {
      name: 'chromium-authenticated',
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /.*auth-flow\.spec\.ts$/,
      use: { 
        ...devices['Desktop Chrome'],
        // Viewport consistente para tests
        viewport: { width: 1280, height: 720 },
        // Usar estado de autenticación guardado
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Tests que NO requieren autenticación (como auth-flow.spec.ts)
    {
      name: 'chromium-unauthenticated',
      testMatch: /.*auth-flow\.spec\.ts$/,
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        // NO usar storageState - estos tests necesitan empezar sin sesión
      },
    },
    // Descomentar para probar en más navegadores
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Servidor de desarrollo */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: FRONTEND_URL,
    reuseExistingServer: true,
    timeout: 180 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      VITE_DISABLE_APP_CHECK: 'true',
    },
  },

  /* Output de tests */
  outputDir: 'test-results/',
});

