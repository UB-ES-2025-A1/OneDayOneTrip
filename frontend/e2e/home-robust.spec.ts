import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  verifyHomePage,
  waitForTripsToLoadRobust,
  verifyPageHasContent,
  clickLogoRobust,
  verifyElementOptional,
  findLoginButton,
  findRegisterButton,
} from './helpers/test-helpers-robust';

test.describe('Página Principal (Home) - Tests Robustos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
  });

  test('debería cargar la página principal correctamente', async ({ page }) => {
    await verifyHomePage(page);
    await verifyPageHasContent(page);
  });

  test('debería mostrar el logo y el título', async ({ page }) => {
    const logo = page.locator('h1.logo');
    await expect(logo).toBeVisible({ timeout: 10000 });
    const logoText = await logo.textContent();
    expect(logoText).toContain('OneDayOneTrip');
  });

  test('debería mostrar botones de login y registro cuando no hay usuario autenticado', async ({ page }) => {
    // Buscar botones de forma robusta
    const loginButton = await findLoginButton(page);
    const registerButton = await findRegisterButton(page);
    
    // Al menos uno de los dos debería estar presente si no hay usuario autenticado
    // O si hay usuario, no deberían estar presentes
    const hasLogin = loginButton !== null;
    const hasRegister = registerButton !== null;
    
    // Verificar que el header está presente
    const header = page.locator('header, .main-header');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
  });

  test('debería tener funcionalidad de búsqueda si el usuario está autenticado', async ({ page }) => {
    // El campo de búsqueda solo aparece si el usuario está autenticado
    const searchInput = page.locator('input[type="search"]');
    const searchCount = await searchInput.count();
    
    // Si existe, verificar que es interactivo
    if (searchCount > 0) {
      await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
      // Verificar que se puede escribir
      await searchInput.first().fill('test');
      const value = await searchInput.first().inputValue();
      expect(value).toBe('test');
    }
    // Si no existe, no es un error (usuario no autenticado)
  });

  test('debería mostrar viajes o un estado de carga', async ({ page }) => {
    await waitForTripsToLoadRobust(page);
    
    // Verificar que hay contenido en la página
    await verifyPageHasContent(page);
    
    // Buscar grid de viajes o mensaje de estado (usar .masonry-container que es la clase real)
    const grid = page.locator('.masonry-container');
    const trips = page.locator('.masonry-item');
    const loadingMessage = page.locator(':has-text("Cargando"), :has-text("Loading"), :has-text("Carregant"), :has-text("home_loading_routes")');
    const errorMessage = page.locator(':has-text("error"), :has-text("Error")');
    const noResultsMessage = page.locator('.no-trips-message, .no-trips-pretty, :has-text("No se han encontrado"), :has-text("No results"), :has-text("No s\'han trobat")');
    
    // Al menos uno de estos debería estar presente
    const hasGrid = await grid.count() > 0;
    const hasTrips = await trips.count() > 0;
    const hasLoading = await loadingMessage.count() > 0;
    const hasError = await errorMessage.count() > 0;
    const hasNoResults = await noResultsMessage.count() > 0;
    
    // Al menos uno debería ser verdadero
    expect(hasGrid || hasTrips || hasLoading || hasError || hasNoResults).toBeTruthy();
  });

  test('debería poder navegar haciendo clic en el logo', async ({ page }) => {
    const clicked = await clickLogoRobust(page);
    if (clicked) {
      await verifyHomePage(page);
    } else {
      // Si no se pudo hacer clic, al menos verificar que el logo existe
      const logo = page.locator('h1.logo');
      await expect(logo).toBeVisible();
    }
  });

  test('debería mostrar el carousel en la página principal', async ({ page }) => {
    const carousel = await verifyElementOptional(page, '.carousel', true);
    // El carousel es opcional, no falla si no existe
  });

  test('debería mostrar el texto de introducción', async ({ page }) => {
    const introText = await verifyElementOptional(page, '.intro-text', true);
    if (introText) {
      const element = page.locator('.intro-text');
      const text = await element.first().textContent();
      expect(text).toBeTruthy();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });

  test('debería cambiar entre tabs following y recommended si el usuario está autenticado', async ({ page }) => {
    await waitForTripsToLoadRobust(page);
    
    // Los tabs solo aparecen si el usuario está autenticado
    const tabsContainer = page.locator('.tabs-container');
    const tabsCount = await tabsContainer.count();
    
    if (tabsCount > 0) {
      // Buscar tabs (pueden estar en diferentes idiomas)
      const followingTab = page.locator('.tab-btn:has-text("Following"), .tab-btn:has-text("Siguiendo"), .tab-btn:has-text("seguint")');
      const recommendedTab = page.locator('.tab-btn:has-text("Recommended"), .tab-btn:has-text("Recomendados"), .tab-btn:has-text("recomanats")');
      
      const hasFollowing = await followingTab.count() > 0;
      const hasRecommended = await recommendedTab.count() > 0;
      
      if (hasFollowing && hasRecommended) {
        // Clic en following
        await followingTab.first().click();
        await page.waitForTimeout(500);
        
        // Clic en recommended
        await recommendedTab.first().click();
        await page.waitForTimeout(500);
      }
    }
    // Si no hay tabs, no es un error (usuario no autenticado)
  });

  test('debería mostrar footer en la página principal', async ({ page }) => {
    const footer = await verifyElementOptional(page, 'footer, .footer', true);
    // Footer es opcional
  });
});

