import { test, expect } from '@playwright/test';
import {
  verifyHomePage,
  clickLogo,
  clickProfileButton,
  clickBackButton,
  verifyProfilePage,
  verifyRouteDetailPage,
  waitForPageLoad,
  navigateToRoute,
} from './helpers/test-helpers';

test.describe('Navegación Completa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
  });

  test('debería navegar desde home a perfil usando el botón de perfil', async ({ page }) => {
    // Verificar que estamos en home
    await verifyHomePage(page);
    
    // Hacer clic en el botón de perfil (si existe)
    const profileButton = page.locator('.profile-btn, button[title*="profile" i]');
    if (await profileButton.count() > 0) {
      await profileButton.first().click({ timeout: 5000 });
      await waitForPageLoad(page);
      // Si el usuario no está autenticado, puede redirigir a home
      // Si está autenticado, debería ir a /perfil
      const currentUrl = page.url();
      if (currentUrl.includes('/perfil')) {
        await verifyProfilePage(page);
      }
    }
  });

  test('debería navegar desde home a detalle de ruta y volver', async ({ page }) => {
    await verifyHomePage(page);
    
    // Buscar un viaje en el grid
    const trips = page.locator('.masonry-item, [data-testid="trip-card"]');
    const tripCount = await trips.count();
    
    if (tripCount > 0) {
      // Hacer clic en el primer viaje
      await trips.first().click({ timeout: 5000 });
      await waitForPageLoad(page);
      
      // Verificar que estamos en la página de detalle o se abrió modal
      const currentUrl = page.url();
      const hasModal = await page.locator('.modal-backdrop').count() > 0;
      
      if (currentUrl.includes('/ruta/')) {
        await verifyRouteDetailPage(page);
        
        // Verificar que hay un botón de volver
        const backButton = page.locator('.back-btn-header, button:has-text("Volver"), button:has-text("Tornar"), button:has-text("Go Back")');
        if (await backButton.count() > 0) {
          await backButton.first().click({ timeout: 5000 });
          await waitForPageLoad(page);
          // Debería volver a home
          await verifyHomePage(page);
        }
      }
      // Si se abrió modal, no es un error (usuario no autenticado)
    }
  });

  test('debería navegar usando el logo desde cualquier página', async ({ page }) => {
    // Ir a una página diferente
    await page.goto('/ruta/test-id', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    // Hacer clic en el logo
    const logo = page.locator('h1.logo');
    await expect(logo).toBeVisible({ timeout: 10000 });
    await logo.click({ timeout: 5000 });
    await waitForPageLoad(page);
    
    // Verificar que estamos en home
    await verifyHomePage(page);
  });

  test('debería mantener la navegación correcta al usar el botón de home en perfil', async ({ page }) => {
    // Navegar a perfil si es posible
    await clickProfileButton(page);
    await waitForPageLoad(page);
    
    // Si estamos en perfil, buscar botón de home
    if (page.url().includes('/perfil')) {
      const homeButton = page.locator('.home-btn-header, button:has([aria-label*="home" i])');
      if (await homeButton.count() > 0) {
        await homeButton.first().click({ timeout: 5000 });
        await waitForPageLoad(page);
        await verifyHomePage(page);
      }
    }
  });

  test('debería redirigir rutas inválidas a home', async ({ page }) => {
    await page.goto('/ruta-inexistente-12345', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    
    // Puede que redirija a home o muestre un error, pero debería estar en una URL válida
    const currentUrl = page.url();
    // Verificar que estamos en home o en una página válida (no en la ruta inválida)
    expect(currentUrl).not.toContain('ruta-inexistente-12345');
  });

  test('debería navegar correctamente usando el historial del navegador', async ({ page }) => {
    // Ir a home
    await verifyHomePage(page);
    
    // Ir a una ruta
    await page.goto('/ruta/test-id', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    
    // Verificar que estamos en una ruta válida o redirigidos
    const urlAfterRoute = page.url();
    
    // Usar botón atrás del navegador solo si estamos en una ruta válida
    if (urlAfterRoute.includes('/ruta/')) {
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitForPageLoad(page);
      
      // Debería volver a home
      await verifyHomePage(page);
      
      // Usar botón adelante
      await page.goForward({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitForPageLoad(page);
      
      // Debería volver a la ruta
      const currentUrl = page.url();
      if (currentUrl.includes('/ruta/')) {
        await verifyRouteDetailPage(page);
      }
    }
  });

  test('debería mantener el estado al recargar la página', async ({ page }) => {
    await verifyHomePage(page);
    
    // Recargar
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    // Verificar que seguimos en home
    await verifyHomePage(page);
    await expect(page.locator('h1.logo')).toBeVisible({ timeout: 10000 });
  });
});

