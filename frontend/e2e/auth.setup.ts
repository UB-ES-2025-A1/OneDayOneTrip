import { test as setup, expect } from '@playwright/test';
import { E2E_TEST_USER } from './fixtures/auth-helpers';
import { waitForPageLoad } from './fixtures/test-fixtures';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  try {
    // Realizar login
    await page.goto('/');
    await waitForPageLoad(page);

    const loginButton = page.locator('button.header-btn.login, button:has-text("Login"), button:has-text("Entrar")').first();
    await loginButton.click();
    
    const loginModal = page.locator('.modal-backdrop, .login-card').first();
    await expect(loginModal).toBeVisible();
    
    await page.locator('input[type="email"]').first().fill(E2E_TEST_USER.email);
    await page.locator('input[type="password"]').first().fill(E2E_TEST_USER.password);
    
    await page.locator('button[type="submit"], button.auth-button').first().click();

    // Esperar a que el login se complete
    const logoutBtn = page.locator('button:has-text("Log out"), button:has-text("Logout"), button:has-text("Tancar"), button.logout').first();
    const errorLocator = page.locator('.text-red-500, .error-message, .auth-error, [class*="error"]').first();

    try {
      await Promise.race([
        logoutBtn.waitFor({ state: 'visible', timeout: 15000 }),
        errorLocator.waitFor({ timeout: 15000 })
      ]);
    } catch {
      // ignore timeout; we'll inspect below
    }

    const hasError = await errorLocator.isVisible().catch(() => false);
    if (hasError) {
      const errorText = (await errorLocator.textContent()) || '';
      console.log('⚠️ Login de setup falló:', errorText.trim());
      if (errorText.toLowerCase().includes('quota')) {
        console.log('⚠️ Firebase quota exceeded. Saltando almacenamiento de sesión.');
      }
      return; // no arrojar para no romper el resto de tests (usarán login manual)
    }

    const isLoggedIn = await logoutBtn.isVisible().catch(() => false);
    if (!isLoggedIn) {
      console.log('⚠️ No se detectó sesión en setup. Se continuará sin storageState.');
      return;
    }

    // Guardar estado de autenticación (cookies, localStorage, etc.)
    await page.context().storageState({ path: authFile });
    console.log('✅ Auth storageState guardado');
  } catch (error) {
    console.log('⚠️ Setup de auth encontró un error y continuará sin storageState:', error);
  }
});

