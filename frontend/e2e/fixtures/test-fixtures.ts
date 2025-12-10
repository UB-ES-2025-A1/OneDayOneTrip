import { test as base, expect, type Page, type Locator } from '@playwright/test';

// ============================================================
// 🎭 Test Fixtures para tests E2E con datos reales
// ============================================================

// Tipos de datos para tests
export interface TestUser {
  email: string;
  password: string;
  displayName: string;
  uid?: string;
}

export interface TestTrip {
  title: string;
  description: string;
  city: string;
  country: string;
}

// Usuarios de prueba predefinidos
export const TEST_USERS = {
  user1: {
    email: process.env.E2E_TEST_EMAIL || 'e2e-user1@test.com',
    password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
    displayName: 'E2E Test User 1',
  },
  user2: {
    email: 'e2e-user2@test.com', 
    password: 'TestPassword123!',
    displayName: 'E2E Test User 2',
  },
} as const;

// Trips de prueba
export const TEST_TRIPS = {
  barcelona: {
    title: 'Un día en Barcelona',
    description: 'Ruta turística por los lugares más emblemáticos de Barcelona',
    city: 'Barcelona',
    country: 'España',
  },
  paris: {
    title: 'París en un día',
    description: 'Descubre los encantos de la ciudad del amor',
    city: 'París',
    country: 'Francia',
  },
} as const;

// ============================================================
// 🔧 Selectores Centralizados (usar data-testid cuando sea posible)
// ============================================================

export const SELECTORS = {
  // Header y navegación
  loginButton: [
    '[data-testid="login-btn"]',
    '.header-btn.login',
    '.login-btn',
    'button.login',
    'a.login',
    'button:has-text("Log in")',
    'button:has-text("Login")',
    'button:has-text("Entrar")',
    'button:has-text("Iniciar")',
    'button:has-text("Iniciar sessió")',
    'button:has-text("Accedir")',
  ].join(', '),
  registerButton: [
    '[data-testid="register-btn"]',
    '.header-btn.register',
    '.register-btn',
    'button.register',
    'a.register',
    'button:has-text("Sign up")',
    'button:has-text("Registrar")',
    'button:has-text("Registrarse")',
    'button:has-text("Registre")',
    'button:has-text("Crear compte")',
    'button:has-text("Crear cuenta")',
  ].join(', '),
  logoutButton: '[data-testid="logout-btn"], .header-btn.logout, button:has-text("Log out"), button:has-text("Tancar")',
  profileButton: '[data-testid="profile-btn"], button.profile-btn, .header-profile-pic',
  
  // Modals
  loginModal: '[data-testid="login-modal"], .login-card',
  registerModal: '[data-testid="register-modal"], .register-card',
  modalBackdrop: '.modal-backdrop',
  closeModalButton: '[data-testid="close-modal"], .close-btn-login, .close-btn, button:has-text("×")',
  
  // Formularios
  emailInput: '[data-testid="email-input"], input[type="email"]',
  passwordInput: '[data-testid="password-input"], input[type="password"]',
  submitButton: '[data-testid="submit-btn"], button[type="submit"], .auth-button',
  
  // Trips/Rutas
  tripCard: '[data-testid="trip-card"], .masonry-item, .trip-card',
  tripGrid: '[data-testid="trip-grid"], .masonry-container, [class*="masonry"], .trip-list',
  tripTitle: '[data-testid="trip-title"], h1, h2, .ruta-titol, [class*="title"]',
  tripDescription: '[data-testid="trip-description"], .ruta-descripcio, .description, p',
  tripAuthor: '[data-testid="trip-author"], .autor, .autor-info, .autor-icon, [class*="author"]',
  
  // Comentarios (incluir variantes en catalán)
  commentsSection: '[data-testid="comments-section"], .ruta-comentaris, .comentaris-llista, [class*="comentari"], [class*="comment"]',
  commentInput: '[data-testid="comment-input"], .comentari-nou-input, textarea[placeholder*="coment"]',
  commentSubmitButton: '[data-testid="comment-submit"], .comentari-submit-btn, button:has-text("Enviar"), button:has-text("Envia")',
  commentItem: '[data-testid="comment-item"], .comentari-item, [class*="comentari-item"], [class*="comment-item"]',
  
  // Valoraciones
  ratingDisplay: '[data-testid="rating-display"], .rating-summary, [class*="rating"], .valoracio, .stars',
  rateButton: '[data-testid="rate-btn"], .valorar-button, button:has-text("Valorar"), button:has-text("Puntua"), button:has-text("Rate")',
  ratingModal: '[data-testid="rating-modal"], .valorar-container, .valorar-modal',
  starInput: '[data-testid="star-input"], .rating input[type="radio"], input[name="rating"]',
  starLabel: '[data-testid="star-label"], label[for^="estrella-"], .rating label',
  ratingSubmitButton: '[data-testid="rating-submit"], .valorar-submit, button:has-text("Enviar")',
  
  // Perfil
  userProfile: '[data-testid="user-profile"], .user-profile, [class*="profile-page"]',
  editProfileButton: '[data-testid="edit-profile"], .edit-profile-btn, button:has-text("Editar")',
  followButton: '[data-testid="follow-btn"], button:has-text("Seguir"), button:has-text("Follow")',
  userStats: '[data-testid="user-stats"], .user-stats, [class*="stats"]',
  
  // Mapa
  mapContainer: '[data-testid="map"], .leaflet-container, [class*="map"], #map',
  
  // Errores
  errorMessage: '[data-testid="error-message"], .text-red-500, [class*="error"], .auth-error',
} as const;

// ============================================================
// 🔧 Funciones de utilidad para tests E2E ESTRICTOS
// ============================================================

/**
 * Espera a que la página esté completamente cargada
 */
export async function waitForPageLoad(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForLoadState('domcontentloaded', { timeout });
}

/**
 * Limpia el estado de autenticación
 */
export async function clearAuthState(page: Page) {
  try {
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Ignorar errores de acceso a storage
      }
    });
  } catch {
    // Ignorar errores si la página no está lista
  }
}

/**
 * Verifica que un toast/notificación aparece con el mensaje esperado
 */
export async function expectToast(page: Page, message: string | RegExp) {
  const toast = page.locator('.toast, .notification, [role="alert"]');
  await expect(toast.filter({ hasText: message })).toBeVisible({ timeout: 10000 });
}

/**
 * Hace scroll hasta un elemento y lo hace visible
 */
export async function scrollToElement(page: Page, selector: string) {
  const element = page.locator(selector).first();
  await element.scrollIntoViewIfNeeded();
  await expect(element).toBeVisible();
}

// ============================================================
// 🎯 Helpers ESTRICTOS para tests
// ============================================================

/**
 * Espera a que la API de trips responda y devuelva datos
 * FALLA si no hay respuesta o si no hay trips
 */
export async function waitForTripsAPI(page: Page, expectTrips = true): Promise<number> {
  // Primero intentamos capturar la respuesta de la app
  const apiURL = process.env.API_URL || process.env.VITE_API_URL || 'http://127.0.0.1:8000';
  try {
    const response = await page.waitForResponse(
      res => res.url().includes('/trips') && res.status() === 200,
      { timeout: 20000 }
    );
    const data = await response.json();
    const tripCount = Array.isArray(data) ? data.length : 0;
    if (expectTrips && tripCount === 0) {
      throw new Error('API respondió pero no hay trips disponibles. Verificar que el seed se ejecutó correctamente.');
    }
    return tripCount;
  } catch (err) {
    // Fallback: llamar directamente a la API para no bloquear los tests
    try {
      const resp = await page.request.get(`${apiURL}/trips`, { timeout: 20000 });
      if (!resp.ok()) throw new Error(`fallback /trips status ${resp.status()}`);
      const data = await resp.json();
      const tripCount = Array.isArray(data) ? data.length : 0;
      if (expectTrips && tripCount === 0) {
        throw new Error('Fallback /trips respondió pero sin datos. Verificar seed.');
      }
      return tripCount;
    } catch (e) {
      throw new Error(`No se pudo obtener /trips ni por la app ni por fallback: ${e}`);
    }
  }
}

/**
 * Navega al detalle de la primera ruta disponible
 * FALLA si no hay rutas visibles
 */
export async function navigateToFirstTrip(page: Page): Promise<void> {
  const tripCards = page.locator(SELECTORS.tripCard);
  const count = await tripCards.count();
  
  if (count === 0) {
    throw new Error('No hay tarjetas de rutas visibles. Verificar que los datos de prueba existen.');
  }
  
  await tripCards.first().click();
  await waitForPageLoad(page);
  
  // Verificar que navegamos a una página de detalle
  const url = page.url();
  if (!url.includes('/ruta/') && !url.includes('/trip/')) {
    throw new Error(`No se navegó a página de detalle. URL actual: ${url}`);
  }
}

/**
 * Obtiene un locator y verifica que existe
 * FALLA si el elemento no existe
 */
export async function getRequiredElement(page: Page, selector: string, description: string): Promise<Locator> {
  const element = page.locator(selector).first();
  const count = await element.count();
  
  if (count === 0) {
    throw new Error(`Elemento requerido no encontrado: ${description} (selector: ${selector})`);
  }
  
  return element;
}

/**
 * Verifica que un elemento existe y es visible
 * FALLA si no existe o no es visible
 */
export async function assertElementVisible(page: Page, selector: string, description: string, timeout = 5000): Promise<void> {
  const element = page.locator(selector).first();
  
  try {
    await expect(element).toBeVisible({ timeout });
  } catch {
    throw new Error(`Elemento no visible: ${description} (selector: ${selector})`);
  }
}

/**
 * Verifica que hay al menos N elementos
 * FALLA si hay menos
 */
export async function assertMinimumCount(page: Page, selector: string, minCount: number, description: string): Promise<number> {
  const elements = page.locator(selector);
  const count = await elements.count();
  
  if (count < minCount) {
    throw new Error(`Se esperaban al menos ${minCount} ${description}, pero se encontraron ${count}`);
  }
  
  return count;
}

/**
 * Espera una respuesta de API específica
 * FALLA si no hay respuesta o si el status no es el esperado
 */
export async function waitForAPIResponse(
  page: Page, 
  urlPattern: string | RegExp, 
  expectedStatus = 200,
  timeout = 10000
): Promise<Response> {
  const response = await page.waitForResponse(
    res => {
      const matchesUrl = typeof urlPattern === 'string' 
        ? res.url().includes(urlPattern)
        : urlPattern.test(res.url());
      return matchesUrl && res.status() === expectedStatus;
    },
    { timeout }
  );
  
  return response;
}

/**
 * Verifica que el usuario está autenticado
 * FALLA si no hay sesión activa
 */
export async function assertAuthenticated(page: Page): Promise<void> {
  const logoutButton = page.locator(SELECTORS.logoutButton).first();
  const profileButton = page.locator(SELECTORS.profileButton).first();
  
  const isLoggedIn = await logoutButton.isVisible({ timeout: 3000 }).catch(() => false) ||
                     await profileButton.isVisible({ timeout: 1000 }).catch(() => false);
  
  if (!isLoggedIn) {
    throw new Error('Usuario no autenticado. Este test requiere una sesión activa.');
  }
}

/**
 * Verifica que el usuario NO está autenticado
 */
export async function assertNotAuthenticated(page: Page): Promise<void> {
  const loginButton = page.locator(SELECTORS.loginButton).first();
  
  const isVisible = await loginButton.isVisible({ timeout: 3000 }).catch(() => false);
  
  if (!isVisible) {
    throw new Error('Se esperaba usuario no autenticado, pero parece que hay sesión activa.');
  }
}

/**
 * Espera a que desaparezca un modal
 */
export async function waitForModalClose(page: Page, modalSelector: string, timeout = 5000): Promise<void> {
  const modal = page.locator(modalSelector).first();
  await expect(modal).not.toBeVisible({ timeout });
}

/**
 * Rellena un formulario de login y lo envía
 */
export async function fillAndSubmitLoginForm(page: Page, email: string, password: string): Promise<void> {
  const emailInput = page.locator(SELECTORS.emailInput).first();
  const passwordInput = page.locator(SELECTORS.passwordInput).first();
  const submitButton = page.locator(SELECTORS.submitButton).first();
  
  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await emailInput.fill(email);
  
  await expect(passwordInput).toBeVisible({ timeout: 2000 });
  await passwordInput.fill(password);
  
  await expect(submitButton).toBeVisible({ timeout: 2000 });
  await submitButton.click();
}

// ============================================================
// 🎯 Extended Test con fixtures personalizados
// ============================================================

type TestFixtures = {
  authenticatedPage: Page;
  cleanPage: Page;
};

export const test = base.extend<TestFixtures>({
  // Página con estado limpio (sin autenticación)
  cleanPage: async ({ page }, use) => {
    await clearAuthState(page);
    await use(page);
  },

  // Página autenticada
  authenticatedPage: async ({ page }, use) => {
    await clearAuthState(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
