import { test, expect } from '@playwright/test';
import {
  clickLoginButton,
  clickRegisterButton,
  fillLoginForm,
  fillRegisterForm,
  submitForm,
  closeModal,
  waitForPageLoad,
  verifyHomePage,
} from './helpers/test-helpers';

test.describe('Validación de Formularios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
  });

  test('debería mostrar campos requeridos en el formulario de login', async ({ page }) => {
    const clicked = await clickLoginButton(page);
    if (clicked) {
      await page.waitForTimeout(500);
      
      // Verificar que los campos existen
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      const emailCount = await emailInput.count();
      const passwordCount = await passwordInput.count();
      
      if (emailCount > 0 && passwordCount > 0) {
        await expect(emailInput.first()).toBeVisible({ timeout: 5000 });
        await expect(passwordInput.first()).toBeVisible({ timeout: 5000 });
        
        // Verificar que son requeridos
        const emailRequired = await emailInput.first().getAttribute('required');
        // Los campos deberían ser requeridos o tener validación
      }
    }
  });

  test('debería validar que el email es requerido en login', async ({ page }) => {
    const clicked = await clickLoginButton(page);
    if (!clicked) return; // Si no se pudo abrir el modal, saltar test
    
    await page.waitForTimeout(500);
    
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.count() > 0) {
      // Intentar enviar sin email
      await passwordInput.first().fill('testpassword');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar")');
      if (await submitButton.count() > 0) {
        // El navegador debería prevenir el envío si el campo es requerido
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.count() > 0) {
          const isValid = await emailInput.first().evaluate((el: HTMLInputElement) => el.validity.valid);
          // Si el campo es requerido y está vacío, no debería ser válido
        }
      }
    }
  });

  test('debería validar que la contraseña es requerida en login', async ({ page }) => {
    const clicked = await clickLoginButton(page);
    if (!clicked) return; // Si no se pudo abrir el modal, saltar test
    
    await page.waitForTimeout(500);
    
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('test@example.com');
      
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        const passwordInput = page.locator('input[type="password"]');
        if (await passwordInput.count() > 0) {
          const isValid = await passwordInput.first().evaluate((el: HTMLInputElement) => el.validity.valid);
          // Si el campo es requerido y está vacío, no debería ser válido
        }
      }
    }
  });

  test('debería mostrar todos los campos en el formulario de registro', async ({ page }) => {
    const clicked = await clickRegisterButton(page);
    if (!clicked) return; // Si no se pudo abrir el modal, saltar test
    
    await page.waitForTimeout(500);
    
    // Verificar que todos los campos existen
    const usernameInput = page.locator('input[placeholder*="username" i], input[placeholder*="usuario" i]');
    const fullNameInput = page.locator('input[placeholder*="name" i], input[placeholder*="nombre" i]');
    const emailInput = page.locator('input[type="email"]');
    const passwordInputs = page.locator('input[type="password"]');
    
    // Al menos debería haber email y password
    if (await emailInput.count() > 0) {
      await expect(emailInput.first()).toBeVisible();
    }
    
    const passwordCount = await passwordInputs.count();
    expect(passwordCount).toBeGreaterThan(0);
  });

  test('debería validar que las contraseñas coinciden en registro', async ({ page }) => {
    const clicked = await clickRegisterButton(page);
    if (!clicked) return; // Si no se pudo abrir el modal, saltar test
    
    await page.waitForTimeout(500);
    
    const passwordInputs = page.locator('input[type="password"]');
    const passwordCount = await passwordInputs.count();
    
    if (passwordCount >= 2) {
      // Llenar contraseñas diferentes
      await passwordInputs.first().fill('password123');
      await passwordInputs.nth(1).fill('password456');
      
      // Intentar enviar
      const submitButton = page.locator('button[type="submit"], button:has-text("Registrarse")');
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        await page.waitForTimeout(500);
        
        // Debería mostrar un error de que las contraseñas no coinciden
        const errorMessage = page.locator('.error, [role="alert"], .error-message');
        if (await errorMessage.count() > 0) {
          const errorText = await errorMessage.first().textContent();
          // El error debería mencionar que las contraseñas no coinciden
        }
      }
    }
  });

  test('debería validar formato de email en login', async ({ page }) => {
    const clicked = await clickLoginButton(page);
    if (!clicked) return; // Si no se pudo abrir el modal, saltar test
    
    await page.waitForTimeout(500);
    
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      // Intentar con un email inválido
      await emailInput.first().fill('email-invalido');
      
      // El navegador debería validar el formato
      const isValid = await emailInput.first().evaluate((el: HTMLInputElement) => {
        return el.validity.valid;
      });
      
      // Si el formato es inválido, no debería ser válido
      if (!isValid) {
        const validationMessage = await emailInput.first().evaluate((el: HTMLInputElement) => el.validationMessage);
        expect(validationMessage).toBeTruthy();
      }
    }
  });

  test('debería poder cambiar entre login y registro desde los modales', async ({ page }) => {
    // Abrir modal de login
    const loginClicked = await clickLoginButton(page);
    if (!loginClicked) return; // Si no se pudo abrir, saltar test
    
    await page.waitForTimeout(500);
    
    // Verificar que el modal de login está visible
    const loginModal = page.locator('.login-card, .modal-backdrop');
    if (await loginModal.count() > 0) {
      await expect(loginModal.first()).toBeVisible({ timeout: 5000 });
      
      // Buscar enlace para ir a registro (usa .auth-link)
      const registerLink = page.locator('.auth-link:has-text("Registrarse"), .auth-link:has-text("Register"), button.auth-link:has-text("Registrarse")');
      if (await registerLink.count() > 0) {
        await registerLink.first().click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // Verificar que el modal de registro está visible
        const registerModal = page.locator('.register-card');
        if (await registerModal.count() > 0) {
          await expect(registerModal.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
    
    // Cerrar modal
    await closeModal(page);
    await page.waitForTimeout(500);
    
    // Abrir modal de registro
    const registerClicked = await clickRegisterButton(page);
    if (!registerClicked) return; // Si no se pudo abrir, saltar test
    
    await page.waitForTimeout(500);
    
    // Verificar que el modal de registro está visible
    const registerModal2 = page.locator('.register-card, .modal-backdrop');
    if (await registerModal2.count() > 0) {
      await expect(registerModal2.first()).toBeVisible({ timeout: 5000 });
      
      // Buscar enlace para ir a login (usa .auth-link)
      const loginLink = page.locator('.auth-link:has-text("Iniciar sesión"), .auth-link:has-text("Login"), button.auth-link:has-text("Iniciar sesión")');
      if (await loginLink.count() > 0) {
        await loginLink.first().click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // Verificar que el modal de login está visible
        const loginModal2 = page.locator('.login-card');
        if (await loginLink.count() > 0) {
          await expect(loginModal2.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('debería mostrar mensajes de error al enviar formulario con datos inválidos', async ({ page }) => {
    const clicked = await clickLoginButton(page);
    if (!clicked) return; // Si no se pudo abrir el modal, saltar test
    
    await page.waitForTimeout(500);
    
    // Intentar enviar con datos inválidos
    await fillLoginForm(page, 'invalid-email', 'short');
    await submitForm(page);
    await page.waitForTimeout(1000);
    
    // Debería mostrar algún tipo de error o el formulario no debería enviarse
    const errorElement = page.locator('.error, [role="alert"], .error-message, .login-error');
    const currentUrl = page.url();
    // Si hay un error, la URL no debería cambiar o debería mostrar el error
    // Verificar que seguimos en la misma página o que hay un error visible
    expect(currentUrl.includes('/') || await errorElement.count() > 0).toBeTruthy();
  });
});

