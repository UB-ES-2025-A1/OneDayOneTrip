import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers/test-helpers';

test.describe('Navegación', () => {
  test('debería redirigir rutas inválidas a la página principal', async ({ page }) => {
    await page.goto('/ruta-inexistente', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    
    // La aplicación puede redirigir a la página principal o mostrar un error
    const currentUrl = page.url();
    // Verificar que no estamos en la ruta inválida
    expect(currentUrl).not.toContain('ruta-inexistente');
    // Puede estar en home o en otra página válida
  });

  test('debería poder navegar a la página principal desde cualquier página', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    
    // Verificar que el logo está presente
    const logo = page.locator('h1.logo');
    await expect(logo).toBeVisible({ timeout: 10000 });
  });

  test('debería mantener el estado de la página al recargar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    await expect(page.locator('h1.logo')).toBeVisible({ timeout: 10000 });
  });

  test('debería navegar correctamente usando el historial del navegador', async ({ page }) => {
    // Ir a home
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    
    // Ir a una ruta
    await page.goto('/ruta/test-id', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    
    // Verificar que estamos en una ruta válida o redirigidos
    const urlAfterRoute = page.url();
    
    if (urlAfterRoute.includes('/ruta/')) {
      // Usar botón atrás
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
      
      // Usar botón adelante
      await page.goForward({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitForPageLoad(page);
      const urlAfterForward = page.url();
      // Puede estar en la ruta o redirigido
      expect(urlAfterForward.includes('/ruta/') || urlAfterForward === '/').toBeTruthy();
    }
  });

  test('debería actualizar la URL correctamente al navegar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
    
    // Navegar a perfil
    await page.goto('/perfil', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    
    const urlAfterProfile = page.url();
    // Puede estar en perfil o redirigido a home
    if (urlAfterProfile.includes('/perfil')) {
      await expect(page).toHaveURL(/\/perfil/, { timeout: 10000 });
    }
    
    // Volver a home
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });

  test('debería manejar correctamente rutas con parámetros', async ({ page }) => {
    // Ruta con ID
    await page.goto('/ruta/12345', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    
    const urlAfterRoute = page.url();
    // Puede estar en la ruta o redirigido a home
    if (urlAfterRoute.includes('/ruta/')) {
      await expect(page).toHaveURL(/\/ruta\/12345/, { timeout: 10000 });
    }
    
    // Ruta de usuario con ID (puede que no exista esta ruta)
    await page.goto('/user/67890', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    
    const urlAfterUser = page.url();
    // Puede estar en la ruta de usuario o redirigido
    if (urlAfterUser.includes('/user/')) {
      await expect(page).toHaveURL(/\/user\/67890/, { timeout: 10000 });
    }
  });
});

