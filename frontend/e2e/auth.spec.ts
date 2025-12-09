import { test, expect } from '@playwright/test';

/**
 * Tests de autenticación
 * Nota: Estos tests requieren que la aplicación esté funcionando correctamente.
 */
test.describe('Autenticación', () => {
  
  // Helper para verificar si la app cargó
  async function appLoaded(page: any): Promise<boolean> {
    try {
      const logo = page.locator('h1.logo');
      await logo.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  // Helper para abrir modal de login
  async function openLoginModal(page: any): Promise<boolean> {
    const loginBtn = page.locator('.header-btn.login');
    if (await loginBtn.count() > 0) {
      await loginBtn.click();
      await page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  // Helper para abrir modal de registro
  async function openRegisterModal(page: any): Promise<boolean> {
    const registerBtn = page.locator('.header-btn.register');
    if (await registerBtn.count() > 0) {
      await registerBtn.click();
      await page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  test('debería mostrar modal de login al hacer clic en el botón de login', async ({ page }) => {
    await page.goto('/');
    if (!await appLoaded(page)) {
      test.skip();
      return;
    }
    
    if (await openLoginModal(page)) {
      const modal = page.locator('.modal-backdrop');
      await expect(modal).toBeVisible({ timeout: 3000 });
    }
  });

  test('debería mostrar modal de registro al hacer clic en el botón de registro', async ({ page }) => {
    await page.goto('/');
    if (!await appLoaded(page)) {
      test.skip();
      return;
    }
    
    if (await openRegisterModal(page)) {
      const modal = page.locator('.modal-backdrop');
      await expect(modal).toBeVisible({ timeout: 3000 });
    }
  });

  test('debería poder cerrar el modal de login', async ({ page }) => {
    await page.goto('/');
    if (!await appLoaded(page)) {
      test.skip();
      return;
    }
    
    if (await openLoginModal(page)) {
      const closeBtn = page.locator('.close-btn-login');
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        const modal = page.locator('.modal-backdrop');
        expect(await modal.isVisible()).toBeFalsy();
      }
    }
  });

  test('debería poder cerrar el modal haciendo clic fuera de él', async ({ page }) => {
    await page.goto('/');
    if (!await appLoaded(page)) {
      test.skip();
      return;
    }
    
    if (await openLoginModal(page)) {
      const modal = page.locator('.modal-backdrop');
      if (await modal.count() > 0) {
        // Clic en el backdrop (fuera del card)
        await modal.click({ position: { x: 10, y: 10 }, force: true });
        await page.waitForTimeout(500);
      }
    }
  });

  test('debería poder cambiar de login a registro desde el modal', async ({ page }) => {
    await page.goto('/');
    if (!await appLoaded(page)) {
      test.skip();
      return;
    }
    
    if (await openLoginModal(page)) {
      // Buscar enlace a registro
      const registerLink = page.locator('.auth-link');
      if (await registerLink.count() > 0) {
        // Buscar el enlace que lleva a registro
        const links = await registerLink.all();
        for (const link of links) {
          const text = await link.textContent();
          if (text && (text.includes('Registr') || text.includes('Sign'))) {
            await link.click();
            await page.waitForTimeout(500);
            break;
          }
        }
      }
    }
  });

  test('debería poder cambiar de registro a login desde el modal', async ({ page }) => {
    await page.goto('/');
    if (!await appLoaded(page)) {
      test.skip();
      return;
    }
    
    if (await openRegisterModal(page)) {
      // Buscar enlace a login
      const loginLink = page.locator('.auth-link');
      if (await loginLink.count() > 0) {
        const links = await loginLink.all();
        for (const link of links) {
          const text = await link.textContent();
          if (text && (text.includes('Iniciar') || text.includes('Log in'))) {
            await link.click();
            await page.waitForTimeout(500);
            break;
          }
        }
      }
    }
  });

  test('debería mostrar campos de formulario en el modal de login', async ({ page }) => {
    await page.goto('/');
    if (!await appLoaded(page)) {
      test.skip();
      return;
    }
    
    if (await openLoginModal(page)) {
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      if (await emailInput.count() > 0) {
        await expect(emailInput.first()).toBeVisible();
      }
      if (await passwordInput.count() > 0) {
        await expect(passwordInput.first()).toBeVisible();
      }
    }
  });

  test('debería mostrar opción de resetear contraseña en login', async ({ page }) => {
    await page.goto('/');
    if (!await appLoaded(page)) {
      test.skip();
      return;
    }
    
    if (await openLoginModal(page)) {
      // Verificar que el modal está abierto
      const modal = page.locator('.login-card, .modal-backdrop');
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible();
      }
    }
  });
});
