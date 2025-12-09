import { Page, expect } from '@playwright/test';

/**
 * Helpers robustos para tests e2e que manejan mejor los casos edge
 */

/**
 * Espera a que la página esté completamente cargada con timeout más largo
 */
export async function waitForPageLoad(page: Page, timeout: number = 30000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // Si networkidle falla, esperar al menos domcontentloaded
    await page.waitForLoadState('domcontentloaded', { timeout });
  }
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
}

/**
 * Verifica que el usuario esté en la página de inicio
 */
export async function verifyHomePage(page: Page) {
  await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  // El logo debería estar presente
  const logo = page.locator('h1.logo');
  await expect(logo).toBeVisible({ timeout: 10000 });
}

/**
 * Busca un elemento de forma robusta, probando múltiples selectores
 */
export async function findElementRobust(page: Page, selectors: string[], timeout: number = 5000) {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector);
      const count = await element.count();
      if (count > 0 && await element.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        return element.first();
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Busca botón de login de forma robusta (por clase CSS principalmente)
 */
export async function findLoginButton(page: Page) {
  return findElementRobust(page, [
    '.header-btn.login',
    'button.login',
    'button:has-text("Iniciar sesión")',
    'button:has-text("Iniciar sessió")',
    'button:has-text("Login")',
  ]);
}

/**
 * Busca botón de registro de forma robusta
 */
export async function findRegisterButton(page: Page) {
  return findElementRobust(page, [
    '.header-btn.register',
    'button.register',
    'button:has-text("Registrarse")',
    'button:has-text("Registrar-se")',
    'button:has-text("Register")',
  ]);
}

/**
 * Busca modal de forma robusta
 */
export async function findModal(page: Page) {
  return findElementRobust(page, [
    '.modal-backdrop',
    '.login-card',
    '.register-card',
    '[role="dialog"]',
  ]);
}

/**
 * Hace clic en botón de login de forma robusta
 */
export async function clickLoginButtonRobust(page: Page) {
  const button = await findLoginButton(page);
  if (button) {
    await button.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    return true;
  }
  return false;
}

/**
 * Hace clic en botón de registro de forma robusta
 */
export async function clickRegisterButtonRobust(page: Page) {
  const button = await findRegisterButton(page);
  if (button) {
    await button.click({ timeout: 5000 });
    await page.waitForTimeout(300);
    return true;
  }
  return false;
}

/**
 * Verifica que un modal está visible de forma robusta
 */
export async function verifyModalVisibleRobust(page: Page) {
  const modal = await findModal(page);
  if (modal) {
    await expect(modal).toBeVisible({ timeout: 3000 });
    return true;
  }
  return false;
}

/**
 * Cierra un modal de forma robusta
 */
export async function closeModalRobust(page: Page) {
  const closeSelectors = [
    'button.close-btn-login',
    'button.close-btn-reg',
    'button:has-text("×")',
    'button[aria-label*="close" i]',
    'button[aria-label*="cerrar" i]',
  ];
  
  for (const selector of closeSelectors) {
    const closeButton = page.locator(selector);
    if (await closeButton.count() > 0) {
      try {
        await closeButton.first().click({ timeout: 2000 });
        await page.waitForTimeout(300);
        return true;
      } catch {
        continue;
      }
    }
  }
  return false;
}

/**
 * Espera a que los viajes se carguen de forma robusta
 */
export async function waitForTripsToLoadRobust(page: Page, timeout: number = 15000) {
  try {
    // Esperar a que aparezca el grid o algún indicador
    await page.waitForSelector('.masonry-grid, .masonry-container, .masonry-item', {
      timeout,
      state: 'attached',
    });
    // Dar un poco más de tiempo para que se rendericen
    await page.waitForTimeout(1000);
  } catch {
    // Si no aparece, puede que no haya viajes, pero la página debería estar cargada
    await page.waitForTimeout(2000);
  }
}

/**
 * Verifica que hay contenido en la página (no está vacía)
 */
export async function verifyPageHasContent(page: Page) {
  const body = page.locator('body');
  const text = await body.textContent();
  expect(text).toBeTruthy();
  expect(text!.trim().length).toBeGreaterThan(0);
}

/**
 * Hace clic en el logo de forma robusta
 */
export async function clickLogoRobust(page: Page) {
  const logo = page.locator('h1.logo');
  if (await logo.isVisible({ timeout: 5000 }).catch(() => false)) {
    await logo.click({ timeout: 5000 });
    await waitForPageLoad(page);
    return true;
  }
  return false;
}

/**
 * Verifica que estamos en una página de detalle de ruta
 */
export async function verifyRouteDetailPageRobust(page: Page) {
  await expect(page).toHaveURL(/\/ruta\/.+/, { timeout: 10000 });
  // Verificar que hay contenido
  await verifyPageHasContent(page);
}

/**
 * Busca y hace clic en un viaje del grid de forma robusta
 */
export async function clickOnTripRobust(page: Page, tripIndex: number = 0) {
  const trips = page.locator('.masonry-item');
  const count = await trips.count();
  
  if (count > tripIndex) {
    try {
      await trips.nth(tripIndex).click({ timeout: 5000 });
      await waitForPageLoad(page);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Verifica que un elemento existe pero no falla si no está visible (opcional)
 */
export async function verifyElementOptional(page: Page, selector: string, shouldBeVisible: boolean = false) {
  const element = page.locator(selector);
  const count = await element.count();
  
  if (count > 0) {
    if (shouldBeVisible) {
      await expect(element.first()).toBeVisible({ timeout: 5000 });
    }
    return true;
  }
  return false;
}

/**
 * Espera a que un elemento aparezca o timeout sin fallar
 */
export async function waitForElementOptional(page: Page, selector: string, timeout: number = 5000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'attached' });
    return true;
  } catch {
    return false;
  }
}

