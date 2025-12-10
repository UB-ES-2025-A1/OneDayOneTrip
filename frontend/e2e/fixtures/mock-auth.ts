import { type Page, type BrowserContext } from '@playwright/test';

/**
 * 🔐 Mock de Autenticación para Tests E2E
 * 
 * Este helper simula un usuario autenticado inyectando datos en localStorage
 * y mockeando las respuestas de la API. NO modifica el código de producción.
 */

// Usuario mock para tests
export const MOCK_USER = {
  uid: 'e2e-mock-user-12345',
  email: 'e2e-mock@test.com',
  displayName: 'E2E Test User',
  photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=e2e-test',
};

// Datos del usuario en el backend
export const MOCK_BACKEND_USER = {
  userId: MOCK_USER.uid,
  username: 'e2e_tester',
  fullName: MOCK_USER.displayName,
  email: MOCK_USER.email,
  profilePicture: MOCK_USER.photoURL,
  bio: 'Usuario de prueba E2E',
  llista_seguidors: [],
  llista_seguits: [],
  publicacions: [],
  guardades: [],
  llista_bloquejats: [],
  llista_bloquejadors: [],
};

/**
 * Configura mocks de autenticación ANTES de navegar a la página
 * Esto intercepta las llamadas a la API y simula un usuario autenticado
 */
export async function setupAuthMocks(page: Page): Promise<void> {
  const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';
  
  // Interceptar llamadas al backend para el usuario
  await page.route(`${API_URL}/users/${MOCK_USER.uid}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_BACKEND_USER),
    });
  });
  
  // Interceptar llamadas de registro (para evitar errores)
  await page.route(`${API_URL}/users/register`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

/**
 * Inyecta el estado de autenticación en localStorage
 * Debe llamarse DESPUÉS de navegar a la página
 */
export async function injectAuthState(page: Page): Promise<void> {
  await page.evaluate((mockUser) => {
    // Guardar uid en localStorage (lo que hace el frontend real)
    localStorage.setItem('uid', mockUser.uid);
    
    // Simular datos de Firebase Auth en localStorage
    // Firebase usa IndexedDB principalmente, pero algunos datos van a localStorage
    const firebaseKey = `firebase:authUser:${mockUser.uid}`;
    localStorage.setItem(firebaseKey, JSON.stringify({
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      photoURL: mockUser.photoURL,
      emailVerified: true,
    }));
  }, MOCK_USER);
}

/**
 * Limpia el estado de autenticación
 */
export async function clearAuthMocks(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('uid');
    // Limpiar cualquier clave de Firebase
    Object.keys(localStorage)
      .filter(key => key.startsWith('firebase:'))
      .forEach(key => localStorage.removeItem(key));
  });
}

/**
 * Configura un contexto de navegador con autenticación mock persistente
 * Útil para tests que necesitan mantener la sesión entre páginas
 */
export async function createAuthenticatedContext(
  browser: any
): Promise<BrowserContext> {
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:5173',
          localStorage: [
            { name: 'uid', value: MOCK_USER.uid },
          ],
        },
      ],
    },
  });
  
  return context;
}

/**
 * Helper completo: configura mocks, navega y verifica autenticación
 */
export async function loginWithMock(page: Page, url = '/'): Promise<boolean> {
  try {
    // 1. Configurar interceptores de API
    await setupAuthMocks(page);
    
    // 2. Navegar a la página
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    
    // 3. Inyectar estado de autenticación
    await injectAuthState(page);
    
    // 4. Recargar para que el frontend detecte la "sesión"
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 5. Esperar un momento para que Firebase procese
    await page.waitForTimeout(1000);
    
    return true;
  } catch (error) {
    console.error('❌ Error configurando mock de auth:', error);
    return false;
  }
}

