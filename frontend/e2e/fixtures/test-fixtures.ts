import { test as base, expect, type Page } from '@playwright/test';

// ============================================================
// 🎭 Test Fixtures para tests E2E con datos reales
// ============================================================

// Tipos de datos para tests
export interface TestUser {
  email: string;
  password: string;
  displayName: string;
  uid?: string;
}

export interface TestTrip {
  title: string;
  description: string;
  city: string;
  country: string;
}

// Usuarios de prueba predefinidos
export const TEST_USERS = {
  user1: {
    email: process.env.E2E_TEST_EMAIL || 'e2e-user1@test.com',
    password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
    displayName: 'E2E Test User 1',
  },
  user2: {
    email: 'e2e-user2@test.com', 
    password: 'TestPassword123!',
    displayName: 'E2E Test User 2',
  },
} as const;

// Trips de prueba
export const TEST_TRIPS = {
  barcelona: {
    title: 'Un día en Barcelona',
    description: 'Ruta turística por los lugares más emblemáticos de Barcelona',
    city: 'Barcelona',
    country: 'España',
  },
  paris: {
    title: 'París en un día',
    description: 'Descubre los encantos de la ciudad del amor',
    city: 'París',
    country: 'Francia',
  },
} as const;

// ============================================================
// 🔧 Funciones de utilidad para tests E2E
// ============================================================

/**
 * Espera a que la página esté completamente cargada
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Limpia el estado de autenticación
 */
export async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Verifica que un toast/notificación aparece con el mensaje esperado
 */
export async function expectToast(page: Page, message: string | RegExp) {
  const toast = page.locator('.toast, .notification, [role="alert"]');
  await expect(toast.filter({ hasText: message })).toBeVisible({ timeout: 10000 });
}

/**
 * Hace scroll hasta un elemento y lo hace visible
 */
export async function scrollToElement(page: Page, selector: string) {
  const element = page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
  await expect(element).toBeVisible();
}

// ============================================================
// 🎯 Extended Test con fixtures personalizados
// ============================================================

type TestFixtures = {
  authenticatedPage: Page;
  cleanPage: Page;
};

export const test = base.extend<TestFixtures>({
  // Página con estado limpio (sin autenticación)
  cleanPage: async ({ page }, use) => {
    await clearAuthState(page);
    await use(page);
  },

  // Página autenticada (TODO: implementar cuando se configure Firebase E2E)
  authenticatedPage: async ({ page }, use) => {
    // Por ahora solo limpia el estado, la autenticación se hará en los tests
    await clearAuthState(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';

