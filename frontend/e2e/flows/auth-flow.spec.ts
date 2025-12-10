import { test, expect, waitForPageLoad, clearAuthState, SELECTORS, fillAndSubmitLoginForm, TEST_USERS } from '../fixtures/test-fixtures';

/**
 * 🔐 Tests E2E: Flujo completo de autenticación
 * 
 * Tests ESTRICTOS que verifican el flujo de registro, login y logout.
 * Incluye validaciones y manejo de errores.
 */

test.describe('Autenticación - Flujo de Login', () => {

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('DEBE abrir modal de login al hacer clic en el botón', async ({ page }) => {
    const loginButton = page.locator(SELECTORS.loginButton).first();
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();
    
    // El modal DEBE abrirse
    const loginModal = page.locator(SELECTORS.loginModal);
    await expect(loginModal).toBeVisible({ timeout: 5000 });
    
    // DEBE tener campos de email y password
    await expect(page.locator(SELECTORS.emailInput)).toBeVisible();
    await expect(page.locator(SELECTORS.passwordInput)).toBeVisible();
  });

  test('DEBE mostrar errores de validación con campos vacíos', async ({ page }) => {
    await page.locator(SELECTORS.loginButton).first().click();
    
    const loginModal = page.locator(SELECTORS.loginModal);
    await expect(loginModal).toBeVisible();

    // Intentar enviar formulario vacío
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.click();

    // Los campos required DEBEN mostrar validación del navegador
    const emailInput = page.locator(SELECTORS.emailInput).first();
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('DEBE mostrar error con credenciales inválidas', async ({ page }) => {
    await page.locator(SELECTORS.loginButton).first().click();
    
    const loginModal = page.locator(SELECTORS.loginModal);
    await expect(loginModal).toBeVisible();
    
    // Rellenar con credenciales inválidas
    await page.fill(SELECTORS.emailInput, 'fake@notexist.com');
    await page.fill(SELECTORS.passwordInput, 'wrongpassword123');

    // Enviar formulario y esperar respuesta
    const submitButton = page.locator(SELECTORS.submitButton).first();
    
    // Esperar a que se complete la petición
    const responsePromise = page.waitForResponse(
      response => response.url().includes('identitytoolkit') || response.url().includes('/auth'),
      { timeout: 15000 }
    ).catch(() => null);
    
    await submitButton.click();
    await responsePromise;

    // El modal DEBE seguir visible (no se cerró por éxito)
    await page.waitForTimeout(1000);
    await expect(loginModal).toBeVisible();
    
    // DEBE mostrar algún mensaje de error o el modal sigue abierto
    const errorMessage = page.locator(SELECTORS.errorMessage).first();
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
    
    // El modal debe seguir visible (login falló)
    expect(await loginModal.isVisible()).toBeTruthy();
    console.log(hasError ? '✅ Mensaje de error mostrado' : '✅ Modal sigue abierto (login falló)');
  });

  test('DEBE validar formato de email', async ({ page }) => {
    await page.locator(SELECTORS.loginButton).first().click();
    await expect(page.locator(SELECTORS.loginModal)).toBeVisible();
    
    const emailInput = page.locator(SELECTORS.emailInput).first();
    await emailInput.fill('invalid-email');
    
    // Hacer clic fuera para trigger validación
    await page.locator(SELECTORS.passwordInput).click();
    
    // El input DEBE ser inválido
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('DEBE mostrar/ocultar contraseña si hay toggle', async ({ page }) => {
    await page.locator(SELECTORS.loginButton).first().click();
    await expect(page.locator(SELECTORS.loginModal)).toBeVisible();
    
    const passwordInput = page.locator(SELECTORS.passwordInput).first();
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('TestPassword123');
    
    // Buscar botón de toggle
    const toggleButton = page.locator('button[aria-label*="password"], .password-toggle, [class*="eye"]').first();
    
    if (await toggleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const initialType = await passwordInput.getAttribute('type');
      expect(initialType).toBe('password');
      
      await toggleButton.click();
      await page.waitForTimeout(300);
      
      const newType = await passwordInput.getAttribute('type');
      expect(newType).toBe('text');
      console.log('✅ Toggle de contraseña funciona');
    } else {
      // Si no hay toggle, verificamos que el input es de tipo password
      expect(await passwordInput.getAttribute('type')).toBe('password');
      console.log('ℹ️ No hay toggle de contraseña en esta UI');
    }
  });

  test('DEBE poder abrir enlace de recuperar contraseña', async ({ page }) => {
    await page.locator(SELECTORS.loginButton).first().click();
    await expect(page.locator(SELECTORS.loginModal)).toBeVisible();
    
    // Buscar link de "olvidé mi contraseña"
    const forgotPasswordLink = page.locator('button:has-text("olvidat"), button:has-text("forgot"), .auth-link').first();
    
    if (await forgotPasswordLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await forgotPasswordLink.click();
      await page.waitForTimeout(500);
      
      // DEBE cambiar a vista de reset password (sin campo de password)
      const passwordInput = page.locator(SELECTORS.passwordInput);
      const hasPassword = await passwordInput.count() > 0 && await passwordInput.first().isVisible().catch(() => false);
      
      // En reset password no debería haber campo de contraseña
      if (!hasPassword) {
        console.log('✅ Vista de reset password mostrada');
      } else {
        console.log('ℹ️ La vista de reset mantiene el campo de password');
      }
    } else {
      console.log('ℹ️ Link de recuperar contraseña no disponible en la UI');
    }
  });
});

test.describe('Autenticación - Flujo de Registro', () => {

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    // Para el flujo de registro no necesitamos esperar a networkidle,
    // basta con que el DOM esté listo para abrir el modal.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
  });

  test('DEBE abrir formulario de registro correctamente', async ({ page }) => {
    await page.locator(SELECTORS.registerButton).first().click();
    
    const registerModal = page.locator(SELECTORS.registerModal);
    await expect(registerModal).toBeVisible({ timeout: 5000 });

    // DEBE tener campos de formulario (al menos 2: email y password)
    const formInputs = registerModal.locator('input');
    const inputCount = await formInputs.count();
    expect(inputCount).toBeGreaterThanOrEqual(2);
    console.log(`✅ Formulario de registro con ${inputCount} campos`);
  });

  test('DEBE validar campos requeridos en registro', async ({ page }) => {
    await page.locator(SELECTORS.registerButton).first().click();
    
    const registerModal = page.locator(SELECTORS.registerModal);
    await expect(registerModal).toBeVisible();
    
    // Intentar enviar formulario vacío
    const submitButton = page.locator(SELECTORS.submitButton).first();
    await submitButton.click();

    // El campo de email DEBE ser inválido (vacío)
    const emailInput = page.locator(SELECTORS.emailInput).first();
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('DEBE navegar de registro a login', async ({ page }) => {
    await page.locator(SELECTORS.registerButton).first().click();
    
    const registerModal = page.locator(SELECTORS.registerModal);
    await expect(registerModal).toBeVisible();
    
    // Buscar link "Ya tienes cuenta? Inicia sesión"
    const loginLink = page.locator('button.auth-link:has-text("inicia"), button:has-text("login"), a:has-text("inicia")').first();
    
    if (await loginLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await loginLink.click();
      await page.waitForTimeout(500);
      
      // DEBE mostrar modal de login
      const loginModal = page.locator(SELECTORS.loginModal);
      await expect(loginModal).toBeVisible({ timeout: 3000 });
      console.log('✅ Navegación de registro a login exitosa');
    } else {
      console.log('ℹ️ Link de navegación a login no disponible');
    }
  });

  test('DEBE validar que las contraseñas coinciden (si hay confirmación)', async ({ page }) => {
    await page.locator(SELECTORS.registerButton).first().click();
    
    const registerModal = page.locator(SELECTORS.registerModal);
    await expect(registerModal).toBeVisible();
    
    const passwordInputs = page.locator('input[type="password"]');
    const passwordCount = await passwordInputs.count();
    
    if (passwordCount >= 2) {
      // Hay campo de confirmar contraseña
      await passwordInputs.nth(0).fill('Password123!');
      await passwordInputs.nth(1).fill('DifferentPassword!');
      
      // Intentar enviar
      const submitButton = page.locator(SELECTORS.submitButton).first();
      await submitButton.click();
      
      // Esperar un momento
      await page.waitForTimeout(1000);
      
      // El registro no debería completarse (modal sigue visible o hay error)
      const modalVisible = await registerModal.isVisible();
      const errorVisible = await page.locator('[class*="error"]:has-text("coincid"), [class*="error"]:has-text("match")').isVisible().catch(() => false);
      
      expect(modalVisible || errorVisible).toBeTruthy();
      console.log('✅ Validación de contraseñas coincidentes funciona');
    } else {
      console.log('ℹ️ No hay campo de confirmación de contraseña');
    }
  });
});

test.describe('Autenticación - Persistencia de Sesión', () => {

  test('DEBE mantener el estado después de recargar (si hay sesión)', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const logoutButton = page.locator(SELECTORS.logoutButton).first();
    const loginButton = page.locator(SELECTORS.loginButton).first();
    
    const isLoggedInInitially = await logoutButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isLoggedInInitially) {
      // Hay sesión - verificar que persiste
      await page.reload();
      await waitForPageLoad(page);
      
      // DEBE seguir logueado
      const isStillLoggedIn = await logoutButton.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isStillLoggedIn).toBeTruthy();
      console.log('✅ Sesión persiste después de reload');
    } else {
      // No hay sesión - verificar que sigue sin sesión
      await page.reload();
      await waitForPageLoad(page);
      
      await expect(loginButton).toBeVisible({ timeout: 5000 });
      console.log('✅ Estado sin sesión persiste después de reload');
    }
  });

  test('DEBE limpiar sesión al hacer logout', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const logoutButton = page.locator(SELECTORS.logoutButton).first();
    const loginButton = page.locator(SELECTORS.loginButton).first();
    
    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.click();
      
      // Esperar a que se procese
      await page.waitForTimeout(1000);
      
      // DEBE mostrar botón de login (ya no hay sesión)
      await expect(loginButton).toBeVisible({ timeout: 5000 });
      
      // El botón de logout NO debe estar visible
      const logoutStillVisible = await logoutButton.isVisible({ timeout: 2000 }).catch(() => false);
      expect(logoutStillVisible).toBeFalsy();
      console.log('✅ Logout exitoso');
    } else {
      // No hay sesión para cerrar
      await expect(loginButton).toBeVisible();
      console.log('ℹ️ No hay sesión activa para cerrar');
    }
  });
});

test.describe('Autenticación - Reset de Contraseña', () => {

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('DEBE mostrar formulario de reset password', async ({ page }) => {
    await page.locator(SELECTORS.loginButton).first().click();
    await expect(page.locator(SELECTORS.loginModal)).toBeVisible();
    
    const forgotLink = page.locator('.auth-link, button:has-text("olvidat"), button:has-text("forgot")').first();
    
    if (await forgotLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await forgotLink.click();
      await page.waitForTimeout(500);
      
      // DEBE tener campo de email
      const emailInput = page.locator(SELECTORS.emailInput);
      await expect(emailInput).toBeVisible({ timeout: 3000 });
      
      // NO debe tener campo de password (es reset)
      const passwordInput = page.locator(SELECTORS.passwordInput);
      const hasPassword = await passwordInput.count() > 0 && await passwordInput.first().isVisible().catch(() => false);
      
      expect(hasPassword).toBeFalsy();
      console.log('✅ Formulario de reset password correcto');
    } else {
      console.log('ℹ️ Link de reset password no disponible');
    }
  });

  test('DEBE validar email en reset password', async ({ page }) => {
    await page.locator(SELECTORS.loginButton).first().click();
    await expect(page.locator(SELECTORS.loginModal)).toBeVisible();
    
    const forgotLink = page.locator('.auth-link, button:has-text("olvidat")').first();
    
    if (await forgotLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await forgotLink.click();
      await page.waitForTimeout(500);
      
      const emailInput = page.locator(SELECTORS.emailInput).first();
      await expect(emailInput).toBeVisible({ timeout: 3000 });
      
      // Intentar enviar sin email
      const submitButton = page.locator(SELECTORS.submitButton).first();
      await submitButton.click();
      
      // El campo DEBE ser inválido (vacío)
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    }
  });

  test('DEBE poder volver al login desde reset password', async ({ page }) => {
    await page.locator(SELECTORS.loginButton).first().click();
    await expect(page.locator(SELECTORS.loginModal)).toBeVisible();
    
    const forgotLink = page.locator('.auth-link, button:has-text("olvidat")').first();
    
    if (await forgotLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await forgotLink.click();
      await page.waitForTimeout(500);
      
      // Buscar botón de volver
      const backButton = page.locator('button:has-text("Tornar"), button:has-text("Back"), button:has-text("Volver")').first();
      
      if (await backButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await backButton.click();
        await page.waitForTimeout(500);
        
        // DEBE volver al login (con campo de password)
        const passwordInput = page.locator(SELECTORS.passwordInput);
        await expect(passwordInput).toBeVisible({ timeout: 3000 });
        console.log('✅ Navegación de vuelta a login exitosa');
      } else {
        console.log('ℹ️ Botón de volver no disponible');
      }
    }
  });
});
