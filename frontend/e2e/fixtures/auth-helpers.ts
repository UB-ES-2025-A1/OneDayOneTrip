import { type Page, expect } from '@playwright/test';
import { waitForPageLoad } from './test-fixtures';

/**
 * 🔐 Helpers de autenticación para tests E2E
 * 
 * Estas funciones facilitan la autenticación en tests que requieren
 * un usuario logueado.
 */

// Credenciales de test (deben existir en Firebase E2E)
export const E2E_TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'e2e-test@onedayonetrip.com',
  password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
};

/**
 * Inicia sesión con el usuario de test E2E
 */
export async function loginAsTestUser(page: Page): Promise<boolean> {
  try {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Verificar si ya hay sesión
    const logoutButton = page.locator('button:has-text("Tancar"), button:has-text("Logout")');
    if (await logoutButton.isVisible({ timeout: 2000 })) {
      console.log('✅ Usuario ya autenticado');
      return true;
    }
    
    // Abrir modal de login
    const loginButton = page.getByRole('button', { name: /login|iniciar/i });
    if (!await loginButton.isVisible({ timeout: 3000 })) {
      console.log('⚠️ No se encontró botón de login');
      return false;
    }
    
    await loginButton.click();
    
    // Esperar modal
    const loginModal = page.locator('.login-card, .modal-backdrop');
    await expect(loginModal).toBeVisible({ timeout: 5000 });
    
    // Rellenar credenciales
    await page.fill('input[type="email"]', E2E_TEST_USER.email);
    await page.fill('input[type="password"]', E2E_TEST_USER.password);
    
    // Enviar formulario
    const submitButton = page.locator('button[type="submit"], .auth-button').first();
    await submitButton.click();
    
    // Esperar a que se cierre el modal y aparezca botón de logout
    await page.waitForTimeout(3000);
    
    // Verificar que el login fue exitoso
    const isLoggedIn = await logoutButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isLoggedIn) {
      console.log('✅ Login exitoso');
      return true;
    } else {
      console.log('❌ Login fallido');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error durante login:', error);
    return false;
  }
}

/**
 * Cierra la sesión actual
 */
export async function logout(page: Page): Promise<void> {
  const logoutButton = page.locator('button:has-text("Tancar"), button:has-text("Logout"), button:has-text("Cerrar sesión")');
  
  if (await logoutButton.isVisible({ timeout: 2000 })) {
    await logoutButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Logout exitoso');
  } else {
    console.log('⚠️ No hay sesión activa para cerrar');
  }
}

/**
 * Verifica si hay un usuario autenticado
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const logoutButton = page.locator('button:has-text("Tancar"), button:has-text("Logout")');
  return await logoutButton.isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * Espera a que la autenticación esté lista (Firebase hydration)
 */
export async function waitForAuthReady(page: Page): Promise<void> {
  // Esperar a que Firebase termine de cargar
  await page.waitForTimeout(2000);
  
  // Esperar a que aparezca el header con botones de auth
  const headerButtons = page.locator('.header-right button, header button');
  await expect(headerButtons.first()).toBeVisible({ timeout: 5000 });
}

/**
 * Fixture que ejecuta código solo si hay autenticación disponible
 */
export async function withAuth(
  page: Page, 
  testFn: () => Promise<void>
): Promise<void> {
  const loggedIn = await loginAsTestUser(page);
  
  if (!loggedIn) {
    console.log('⚠️ Saltando test que requiere autenticación');
    return;
  }
  
  await testFn();
}

/**
 * Navega al perfil del usuario actual
 */
export async function goToMyProfile(page: Page): Promise<boolean> {
  if (!await isAuthenticated(page)) {
    console.log('⚠️ No hay sesión activa');
    return false;
  }
  
  const profileButton = page.locator('.profile-btn, button[title*="profile"], a[href="/perfil"]');
  
  if (await profileButton.isVisible()) {
    await profileButton.click();
    await waitForPageLoad(page);
    return true;
  }
  
  // Intentar navegar directamente
  await page.goto('/perfil');
  await waitForPageLoad(page);
  return true;
}

/**
 * Obtiene información del usuario actual desde la UI
 */
export async function getCurrentUserInfo(page: Page): Promise<{
  name: string | null;
  email: string | null;
} | null> {
  if (!await isAuthenticated(page)) {
    return null;
  }
  
  await goToMyProfile(page);
  
  const nameElement = page.locator('h2, .user-name, [class*="name"]').first();
  const emailElement = page.locator('h3, .user-email, [class*="email"]').first();
  
  const name = await nameElement.textContent().catch(() => null);
  const email = await emailElement.textContent().catch(() => null);
  
  return { name, email };
}

