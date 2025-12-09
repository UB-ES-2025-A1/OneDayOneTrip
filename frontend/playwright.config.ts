import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests e2e
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Ejecutar tests en paralelo */
  fullyParallel: true,
  /* Fallar el build en CI si accidentalmente dejaste test.only en el código */
  forbidOnly: !!process.env.CI,
  /* Reintentar en CI */
  retries: process.env.CI ? 2 : 0,
  /* Opciones para workers */
  workers: process.env.CI ? 1 : undefined,
  /* Configuración del reporter */
  reporter: 'html',
  /* Configuración compartida para todos los proyectos */
  use: {
    /* URL base para usar en acciones como `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',
    /* Recopilar trace cuando se repite un test fallido. */
    trace: 'on-first-retry',
    /* Screenshot solo en fallos */
    screenshot: 'only-on-failure',
  },

  /* Configurar proyectos para múltiples navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Ejecutar el servidor de desarrollo local antes de iniciar los tests */
  /* Descomentar para iniciar servidor automáticamente (puede ser lento) */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutos
    stdout: 'ignore',
    stderr: 'pipe',
  },
});

