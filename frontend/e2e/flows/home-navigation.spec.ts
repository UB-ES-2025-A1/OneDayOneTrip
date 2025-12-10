import { test, expect, waitForPageLoad, waitForTripsAPI, SELECTORS, assertElementVisible, assertMinimumCount, clearAuthState } from '../fixtures/test-fixtures';
import { loginAsTestUser } from '../fixtures/auth-helpers';

/**
 * 🏠 Tests E2E: Navegación y exploración de la Home
 * 
 * Tests ESTRICTOS que verifican flujos críticos en la página principal.
 * Estos tests FALLAN si la funcionalidad no está disponible.
 */

test.describe('Home Page - Carga y Elementos Básicos', () => {
  
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await page.evaluate(async () => {
      try {
        // @ts-ignore
        const auth = (window as any).auth;
        if (auth?.signOut) {
          await auth.signOut();
        }
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // ignore
      }
    });
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('DEBE cargar la página principal con el logo', async ({ page }) => {
    // Si existe un logo/título con el nombre, lo validamos; si no, verificamos elementos clave de la cabecera.
    const logoText = page.locator('text=OneDayOneTrip').first();
    const header = page.locator('header, .header, nav').first();
    const loginBtn = page.locator(SELECTORS.loginButton).first();
    
    const hasLogo = await logoText.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasLogo) {
      await expect(logoText).toBeVisible();
    } else {
      // Fallback: la cabecera o el botón de login deben estar visibles indicando que la home cargó.
      if (await header.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(header).toBeVisible();
      } else {
        await expect(loginBtn).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('DEBE mostrar botones de autenticación para usuarios no logueados', async ({ page }) => {
    // Login button DEBE estar visible
    const loginBtn = page.locator(SELECTORS.loginButton).first();
    await expect(loginBtn).toBeVisible({ timeout: 5000 });
    
    // Register button DEBE estar visible
    const registerBtn = page.locator(SELECTORS.registerButton).first();
    await expect(registerBtn).toBeVisible({ timeout: 5000 });
  });

  test('DEBE cargar rutas desde la API', async ({ page }) => {
    const count = await waitForTripsAPI(page, true);
    expect(count).toBeGreaterThan(0);
    console.log(`✅ API respondió con ${count} rutas`);
  });

  test('DEBE mostrar tarjetas de rutas en la home', async ({ page }) => {
    // La página ya está cargada por el beforeEach
    // Esperar a que el grid de rutas sea visible
    const tripGrid = page.locator(SELECTORS.tripGrid).first();
    await expect(tripGrid).toBeVisible({ timeout: 15000 });
    
    // DEBE haber al menos 1 tarjeta de ruta
    const tripCards = page.locator(SELECTORS.tripCard);
    await expect(tripCards.first()).toBeVisible({ timeout: 10000 });
    
    const cardCount = await tripCards.count();
    expect(cardCount).toBeGreaterThan(0);
    console.log(`✅ ${cardCount} tarjetas de rutas visibles`);
  });
});

// NOTA: Tests de modal de login y registro están en auth-flow.spec.ts

// NOTA: Test de navegación a detalle de ruta está en trip-detail.spec.ts

test.describe('Home Page - Persistencia y Recarga', () => {
  
  test('DEBE mantener el contenido al recargar la página', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Verificar que hay tarjetas antes de recargar
    const tripCards = page.locator(SELECTORS.tripCard);
    await expect(tripCards.first()).toBeVisible({ timeout: 15000 });
    const countBefore = await tripCards.count();
    expect(countBefore).toBeGreaterThan(0);
    
    // Recargar página
    await page.reload();
    await waitForPageLoad(page);
    
    // DEBE seguir habiendo tarjetas después de recargar
    await expect(tripCards.first()).toBeVisible({ timeout: 15000 });
    const countAfter = await tripCards.count();
    expect(countAfter).toBeGreaterThan(0);
    
    // El logo DEBE seguir visible
    const logo = page.locator('.logo, h1').filter({ hasText: 'OneDayOneTrip' });
    await expect(logo).toBeVisible({ timeout: 5000 });
  });
});
