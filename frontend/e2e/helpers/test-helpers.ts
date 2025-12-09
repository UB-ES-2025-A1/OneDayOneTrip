import { Page, expect } from '@playwright/test';

/**
 * Helpers para tests e2e
 */

/**
 * Espera a que la página esté completamente cargada
 */
export async function waitForPageLoad(page: Page) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
  } catch {
    // Si networkidle falla, al menos esperar domcontentloaded
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    await page.waitForTimeout(2000); // Dar tiempo adicional
  }
}

/**
 * Verifica que el usuario esté en la página de inicio
 */
export async function verifyHomePage(page: Page) {
  // Verificar URL de forma más flexible (puede terminar en / o ser la raíz)
  const currentUrl = page.url();
  const isHomePage = currentUrl.endsWith('/') || currentUrl.match(/localhost:\d+$/) !== null;
  expect(isHomePage).toBeTruthy();
  
  const logo = page.locator('h1.logo');
  await expect(logo).toBeVisible({ timeout: 10000 });
  await expect(logo).toContainText('OneDayOneTrip', { timeout: 5000 });
}

/**
 * Navega a una ruta específica
 */
export async function navigateToRoute(page: Page, routeId: string) {
  await page.goto(`/ruta/${routeId}`, { waitUntil: 'domcontentloaded' });
  await waitForPageLoad(page);
}

/**
 * Verifica que los elementos principales del header estén visibles
 */
export async function verifyHeaderElements(page: Page) {
  const logo = page.locator('h1.logo');
  await expect(logo).toBeVisible({ timeout: 10000 });
}

/**
 * Espera a que los viajes se carguen en la página
 */
export async function waitForTripsToLoad(page: Page) {
  try {
    // Espera a que el contenedor de viajes aparezca, los items, o un mensaje de estado
    // Usar .masonry-container que es la clase real (no .masonry-grid)
    await page.waitForSelector('.masonry-container, .masonry-item, .no-trips-message, .no-trips-pretty, :has-text("Cargando"), :has-text("Loading")', {
      timeout: 20000,
      state: 'attached',
    });
    // Dar tiempo adicional para que se rendericen
    await page.waitForTimeout(1500);
  } catch {
    // Si no aparece el grid, puede que no haya viajes, pero la página debería estar cargada
    await page.waitForTimeout(2000);
  }
}

/**
 * Busca y hace clic en el botón de login
 */
export async function clickLoginButton(page: Page) {
  // Buscar por clase CSS primero (más confiable)
  const loginButton = page.locator('.header-btn.login, button.login');
  const count = await loginButton.count();
  
  if (count > 0) {
    await loginButton.first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
    return true;
  }
  
  // Fallback: buscar por texto en múltiples idiomas
  const loginButtonText = page.locator('button:has-text("Iniciar sesión"), button:has-text("Iniciar sessió"), button:has-text("Log in"), button:has-text("Login")');
  const countText = await loginButtonText.count();
  
  if (countText > 0) {
    await loginButtonText.first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
    return true;
  }
  
  return false;
}

/**
 * Busca y hace clic en el botón de registro
 */
export async function clickRegisterButton(page: Page) {
  // Buscar por clase CSS primero (más confiable)
  const registerButton = page.locator('.header-btn.register, button.register');
  const count = await registerButton.count();
  
  if (count > 0) {
    await registerButton.first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
    return true;
  }
  
  // Fallback: buscar por texto en múltiples idiomas
  const registerButtonText = page.locator('button:has-text("Registrarse"), button:has-text("Registrar-se"), button:has-text("Sign Up"), button:has-text("Register")');
  const countText = await registerButtonText.count();
  
  if (countText > 0) {
    await registerButtonText.first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
    return true;
  }
  
  return false;
}

/**
 * Verifica que un modal está visible
 */
export async function verifyModalVisible(page: Page, modalSelector: string = '[role="dialog"], .modal, .modal-backdrop') {
  const modal = page.locator(modalSelector);
  const count = await modal.count();
  if (count > 0) {
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
    return true;
  }
  return false;
}

/**
 * Cierra un modal haciendo clic en el botón de cerrar
 */
export async function closeModal(page: Page) {
  const closeButton = page.locator('button.close-btn-login, button.close-btn-reg, button:has-text("×")');
  if (await closeButton.count() > 0) {
    await closeButton.first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

/**
 * Hace clic en el logo para navegar a home
 */
export async function clickLogo(page: Page) {
  const logo = page.locator('h1.logo');
  await expect(logo).toBeVisible({ timeout: 10000 });
  await logo.click({ timeout: 5000 });
  await waitForPageLoad(page);
  await verifyHomePage(page);
  return true;
}

/**
 * Hace clic en el botón de perfil
 */
export async function clickProfileButton(page: Page) {
  const profileButton = page.locator('.profile-btn, button[title*="profile" i], button[title*="perfil" i]');
  if (await profileButton.count() > 0) {
    await profileButton.first().click({ timeout: 5000 });
    await waitForPageLoad(page);
    return true;
  }
  return false;
}

/**
 * Hace clic en el botón de volver
 */
export async function clickBackButton(page: Page) {
  const backButton = page.locator('.back-btn-header, button:has-text("Volver"), button:has-text("Tornar"), button:has-text("Go Back"), button:has-text("Back")');
  if (await backButton.count() > 0) {
    await backButton.first().click({ timeout: 5000 });
    await waitForPageLoad(page);
    return true;
  }
  return false;
}

/**
 * Verifica que estamos en la página de perfil
 */
export async function verifyProfilePage(page: Page) {
  await expect(page).toHaveURL(/\/perfil/, { timeout: 10000 });
}

/**
 * Verifica que estamos en la página de detalle de ruta
 */
export async function verifyRouteDetailPage(page: Page, routeId?: string) {
  if (routeId) {
    await expect(page).toHaveURL(new RegExp(`/ruta/${routeId}`), { timeout: 10000 });
  } else {
    await expect(page).toHaveURL(/\/ruta\/.+/, { timeout: 10000 });
  }
}

/**
 * Busca un viaje en el grid y hace clic en él
 */
export async function clickOnTrip(page: Page, tripIndex: number = 0) {
  const trips = page.locator('.masonry-item');
  const count = await trips.count();
  if (count > tripIndex) {
    await trips.nth(tripIndex).click({ timeout: 5000 });
    await waitForPageLoad(page);
    return true;
  }
  return false;
}

/**
 * Escribe en un input de búsqueda
 */
export async function typeInSearch(page: Page, text: string) {
  const searchInput = page.locator('input[type="search"]');
  if (await searchInput.count() > 0) {
    await searchInput.first().fill(text, { timeout: 5000 });
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

/**
 * Cambia el filtro de búsqueda
 */
export async function changeSearchFilter(page: Page, filter: string) {
  // Buscar filtro en múltiples idiomas
  const filterButton = page.locator(`button:has-text("${filter}"), [data-filter="${filter}"]`);
  if (await filterButton.count() > 0) {
    await filterButton.first().click({ timeout: 5000 });
    await page.waitForTimeout(300);
    return true;
  }
  return false;
}

/**
 * Cambia entre tabs (following/recommended)
 */
export async function switchTab(page: Page, tabName: 'following' | 'recommended') {
  // Buscar tab en múltiples idiomas
  let tabButton;
  if (tabName === 'following') {
    tabButton = page.locator('.tab-btn:has-text("Following"), .tab-btn:has-text("Siguiendo"), .tab-btn:has-text("seguint"), button:has-text("Following")');
  } else {
    tabButton = page.locator('.tab-btn:has-text("Recommended"), .tab-btn:has-text("Recomendados"), .tab-btn:has-text("recomanats"), button:has-text("Recommended")');
  }
  
  if (await tabButton.count() > 0) {
    await tabButton.first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

/**
 * Rellena el formulario de login
 */
export async function fillLoginForm(page: Page, email: string, password: string) {
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  
  if (await emailInput.count() > 0) {
    await emailInput.first().fill(email, { timeout: 5000 });
  }
  if (await passwordInput.count() > 0) {
    await passwordInput.first().fill(password, { timeout: 5000 });
  }
  return true;
}

/**
 * Rellena el formulario de registro
 */
export async function fillRegisterForm(page: Page, data: { username?: string; fullName?: string; email?: string; password?: string; confirmPassword?: string }) {
  if (data.username) {
    const usernameInput = page.locator('input[placeholder*="username" i], input[placeholder*="usuario" i]');
    if (await usernameInput.count() > 0) {
      await usernameInput.first().fill(data.username, { timeout: 5000 });
    }
  }
  if (data.fullName) {
    const fullNameInput = page.locator('input[placeholder*="name" i], input[placeholder*="nombre" i]');
    if (await fullNameInput.count() > 0) {
      await fullNameInput.first().fill(data.fullName, { timeout: 5000 });
    }
  }
  if (data.email) {
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill(data.email, { timeout: 5000 });
    }
  }
  if (data.password) {
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    if (count > 0) {
      await passwordInputs.first().fill(data.password, { timeout: 5000 });
    }
  }
  if (data.confirmPassword) {
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();
    if (count > 1) {
      await passwordInputs.nth(1).fill(data.confirmPassword, { timeout: 5000 });
    }
  }
  return true;
}

/**
 * Envía un formulario
 */
export async function submitForm(page: Page) {
  const submitButton = page.locator('button[type="submit"]');
  if (await submitButton.count() > 0) {
    await submitButton.first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

