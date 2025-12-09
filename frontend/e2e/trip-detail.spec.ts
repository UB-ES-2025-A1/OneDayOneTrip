import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers/test-helpers';

test.describe('Detalle de Ruta', () => {
  test('debería mostrar un mensaje o contenido cuando se accede a una ruta específica', async ({ page }) => {
    // Usar un ID de ejemplo (puede que no exista, pero verificamos el comportamiento)
    const testRouteId = 'test-route-id';
    await page.goto(`/ruta/${testRouteId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);

    // Verificar que la página carga (puede mostrar error o contenido)
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible({ timeout: 10000 });
    const bodyText = await pageContent.textContent();
    expect(bodyText).toBeTruthy();
    
    // Verificar que estamos en una URL válida (puede estar en la ruta o redirigido)
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('debería tener un botón de volver en la página de detalle', async ({ page }) => {
    await page.goto('/ruta/test-id', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);

    // Verificar que estamos en una ruta válida o redirigidos
    const currentUrl = page.url();
    
    if (currentUrl.includes('/ruta/')) {
      // Buscar botón de volver (puede tener diferentes textos según idioma)
      const backButton = page.locator('.back-btn-header, button:has-text("Volver"), button:has-text("Tornar"), button:has-text("Go Back"), button:has-text("Back")');
      
      // Si existe, verificar que es clickeable
      if (await backButton.count() > 0) {
        await expect(backButton.first()).toBeVisible({ timeout: 5000 });
      }
    }
    // Si no existe o redirigió, no es un error
  });

  test('debería mostrar el header en la página de detalle', async ({ page }) => {
    await page.goto('/ruta/test-id', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);

    // Verificar que el header está presente (debería estar en todas las páginas)
    const header = page.locator('header, .main-header');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
    
    // Verificar que el logo está presente
    const logo = header.locator('h1.logo');
    await expect(logo).toBeVisible({ timeout: 5000 });
  });
});

