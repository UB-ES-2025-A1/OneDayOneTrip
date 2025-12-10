// @ts-nocheck
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Declaración mínima para usar process.env en tests (no hace falta instalar @types/node aquí)
declare const process: { env: Record<string, string | undefined> };

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
  email: process.env.E2E_TEST_EMAIL || 'testuser@testuser.com',
  password: process.env.E2E_TEST_PASSWORD || 'testuser',
};

// Marca para evitar reintentos cuando Firebase limita las peticiones
let LOGIN_RATE_LIMITED = false;

const API_URL = process.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Verifica que el usuario existe en el backend (ya debería estar creado por el global-setup)
 */
async function createBackendUser(uid: string, page: Page): Promise<void> {
  try {
    console.log('🔍 Verificando si usuario existe en backend...');
    
    // Simplemente verificar que el usuario existe (sin auth, puede dar 401 pero está OK)
    const response = await fetch(`${API_URL}/users/${uid}`, {
      method: 'GET',
    }).catch(() => null);
    
    if (response && response.status === 200) {
      console.log('✅ Usuario existe en backend');
      return;
    }
    
    // Si no existe, intentar crearlo con token de Firebase
    console.log('⚠️ Usuario no encontrado en backend, intentando crearlo...');
    
    const firebaseIdToken = await getFirebaseIdTokenDirect();
    if (firebaseIdToken) {
      console.log('✅ idToken obtenido para creación');
      await createUserInBackend(uid, firebaseIdToken);
    } else {
      console.log('⚠️ No se pudo obtener token - el usuario debe existir del global-setup');
    }
  } catch (error) {
    console.log('⚠️ Error verificando usuario:', error);
  }
}

/**
 * Obtiene el idToken usando Firebase REST API
 */
async function getFirebaseIdTokenDirect(): Promise<string | null> {
  try {
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: E2E_TEST_USER.email,
          password: E2E_TEST_USER.password,
          returnSecureToken: true
        })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.idToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo token REST:', error);
    return null;
  }
}

/**
 * Crea el usuario en el backend con el idToken
 */
async function createUserInBackend(uid: string, idToken: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/users/${uid}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${idToken}` },
    });
    
    if (response.ok) {
      console.log('✅ Usuario ya existe en backend');
      return;
    }
    
    // El usuario no existe, crearlo
    console.log('🔧 Creando usuario en backend...');
    const registerResponse = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        userId: uid,
        username: 'testuser',
        fullName: 'Test User',
        email: E2E_TEST_USER.email,
        bio: 'Usuario de prueba para tests E2E',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser'
      })
    });
    
    if (registerResponse.ok) {
      console.log('✅ Usuario creado en backend');
    } else {
      const errorText = await registerResponse.text();
      console.log('⚠️ No se pudo crear usuario en backend:', registerResponse.status, errorText);
    }
  } catch (error) {
    console.log('⚠️ Error en createUserInBackend:', error);
  }
}

/**
 * Inicia sesión con el usuario de test E2E usando la UI del frontend
 * (Simula el comportamiento de un usuario real)
 */
export async function loginAsTestUser(page: Page): Promise<boolean> {
  try {
    if (LOGIN_RATE_LIMITED) {
      console.log('⚠️ Login deshabilitado temporalmente (quota exceeded)');
      return false;
    }
    
    // Primero verificar localStorage (storageState puede tener uid guardado)
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Verificar localStorage primero (más rápido y confiable que UI)
    const uid = await page.evaluate(() => localStorage.getItem('uid'));
    if (uid && uid !== 'null' && uid !== 'undefined') {
      // Verificar que la UI también muestra sesión activa
      const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Logout"), button:has-text("Tancar"), button.logout').first();
      const profileButton = page.locator('button.profile-btn, .header-profile-pic').first();
      
      const hasUISession = await logoutButton.isVisible({ timeout: 2000 }).catch(() => false) ||
                            await profileButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasUISession) {
        console.log('✅ Usuario ya autenticado (vía storageState/localStorage)');
        return true;
      }
      
      // Si hay uid pero no UI, esperar un poco más para que Firebase hydrate
      await page.waitForTimeout(1000);
      const hasUISessionAfterWait = await logoutButton.isVisible({ timeout: 2000 }).catch(() => false) ||
                                     await profileButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasUISessionAfterWait) {
        console.log('✅ Usuario ya autenticado (vía storageState/localStorage - después de espera)');
        return true;
      }
    }

    // Verificar si ya hay sesión en la UI (por si acaso no hay localStorage pero sí sesión)
    const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Logout"), button:has-text("Tancar"), button.logout').first();
    const profileButton = page.locator('button.profile-btn, .header-profile-pic').first();

    if (await logoutButton.isVisible({ timeout: 1000 }).catch(() => false) ||
        await profileButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('✅ Usuario ya autenticado (vía UI)');
      return true;
    }

    console.log('⚠️ No se detectó sesión activa, intentando login manual...');

    // Si no, hacer login manual (fallback)
    const loginButton = page.locator('button.header-btn.login, button:has-text("Login"), button:has-text("Entrar")').first();
    
    if (!await loginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('⚠️ Botón de login no encontrado');
      return false;
    }
    
    console.log('🔘 Haciendo clic en botón de login');
    await loginButton.click();
    
    // Esperar a que aparezca el modal de login
    const loginModal = page.locator('.modal-backdrop, .login-card').first();
    await expect(loginModal).toBeVisible({ timeout: 5000 });
    console.log('✅ Modal de login abierto');
    
    // Rellenar email
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 3000 });
    await emailInput.fill(E2E_TEST_USER.email);
    console.log('📧 Email rellenado:', E2E_TEST_USER.email);
    
    // Rellenar password
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 3000 });
    await passwordInput.fill(E2E_TEST_USER.password);
    console.log('🔑 Password rellenado');
    
    // Hacer clic en el botón de submit
    const submitButton = page.locator('button[type="submit"], button.auth-button').first();
    await expect(submitButton).toBeVisible({ timeout: 2000 });
    await submitButton.click();
    console.log('✅ Formulario enviado');

    // Esperar eficientemente a que el login se complete
    console.log('⏳ Esperando respuesta de Firebase...');

    // Esperar a que el modal se cierre O aparezca un error - lo que ocurra primero
    try {
      await Promise.race([
        // Esperar a que el modal se cierre (login exitoso)
        page.locator('.modal-backdrop, .login-card').first().waitFor({ state: 'hidden', timeout: 10000 }),
        // O esperar a que aparezca un error
        page.locator('.text-red-500, .error-message, .auth-error, [class*="error"]').first().waitFor({ timeout: 10000 })
      ]);
    } catch {
      // Timeout - continuar verificando manualmente
    }

    // Verificar si hay mensaje de error (timeout reducido)
    const errorLocator = page.locator('.text-red-500, .error-message, .auth-error, [class*="error"]').first();
    const hasError = await errorLocator.isVisible().catch(() => false);

    if (hasError) {
      const errorText = await errorLocator.textContent();
      console.log('❌ Error de login detectado:', errorText);
      
       // Si Firebase devuelve quota exceeded, evitar más intentos para no saturar
      if (errorText?.toLowerCase().includes('quota') || errorText?.toLowerCase().includes('too many')) {
        LOGIN_RATE_LIMITED = true;
      }
      await page.screenshot({ path: 'test-results/login-error.png', fullPage: true });
      return false;
    }

    // Verificar si el modal se cerró (login exitoso)
    const modalVisible = await loginModal.isVisible().catch(() => true);
    if (!modalVisible) {
      console.log('✅ Modal de login cerrado - login exitoso');

      // Verificar que aparezca el botón de logout o perfil (timeout reducido)
      const logoutBtn = page.locator('button:has-text("Log out"), button:has-text("Logout"), button.logout').first();
      const profileBtn = page.locator('button.profile-btn, .header-profile-pic').first();

      const isLoggedIn = await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false) ||
                         await profileBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (isLoggedIn) {
        console.log('✅ Sesión activa detectada');
        return true;
      }
    }

    // Verificar localStorage como último recurso
    const uid = await page.evaluate(() => localStorage.getItem('uid'));
    if (uid) {
      console.log('✅ Sesión activa en localStorage');
      return true;
    }

    console.log('❌ Login falló - no se pudo verificar sesión');
    await page.screenshot({ path: 'test-results/login-failed.png', fullPage: true });
    return false;
    
  } catch (error) {
    console.error('❌ Excepción durante login:', error);
    if (String(error).toLowerCase().includes('quota')) {
      LOGIN_RATE_LIMITED = true;
    }
    return false;
  }
}

/**
 * Inicia sesión y navega a una URL específica
 */
export async function loginAndNavigate(page: Page, url = '/'): Promise<boolean> {
  const loggedIn = await loginAsTestUser(page);
  if (!loggedIn) return false;
  
  if (url !== '/' && !page.url().includes(url)) {
    await page.goto(url);
    await waitForPageLoad(page);
  }
  
  return true;
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
  
  expect(loggedIn).toBeTruthy();
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


