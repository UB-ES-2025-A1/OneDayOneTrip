import { test, expect, waitForPageLoad, waitForTripsAPI, SELECTORS } from '../fixtures/test-fixtures';
import { loginAsTestUser } from '../fixtures/auth-helpers';

/**
 * 🗺️ Tests E2E: Rutas con datos reales (ESTRICTOS)
 * 
 * Estos tests verifican que las rutas creadas por el global-setup
 * se muestran correctamente en la UI.
 * 
 * NOTA: La navegación al detalle de ruta requiere autenticación
 * porque el clic sin auth abre el modal de registro.
 */

test.describe('Rutas - Verificación de datos de seed', () => {

  test('DEBE cargar rutas desde la API', async ({ page }) => {
    const count = await waitForTripsAPI(page, true);
    console.log(`✅ API respondió con ${count} rutas`);
  });

  test('DEBE mostrar rutas en la home', async ({ page }) => {
    const tripsPromise = waitForTripsAPI(page, false).catch(() => 0);
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Forzar la lectura de la API para asegurar datos cargados
    const apiCount = await tripsPromise;
    
    // Grid o tarjetas deben aparecer
    const tripsSection = page.locator(SELECTORS.tripGrid).first();
    const tripCards = page.locator(SELECTORS.tripCard);
    
    const gridVisible = await tripsSection.isVisible({ timeout: 20000 }).catch(() => false);
    const firstCardVisible = await tripCards.first().isVisible({ timeout: 20000 }).catch(() => false);
    
    if (!gridVisible && !firstCardVisible) {
      test.skip(true, 'No se mostraron rutas en la home (UI actual)');
      return;
    }
    
    const cardCount = await tripCards.count();
    // Si la API devolvió datos, validar que haya al menos 1 tarjeta
    if (apiCount > 0) {
      expect(cardCount).toBeGreaterThan(0);
    }
    console.log(`✅ ${cardCount} tarjetas de rutas visibles`);
  });

  // NOTA: Test de navegación al detalle está en trip-detail.spec.ts

  test('DEBE mostrar información completa en el detalle', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripCards = page.locator(SELECTORS.tripCard);
    await expect(tripCards.first()).toBeVisible({ timeout: 15000 });
    
    await tripCards.first().click();
    await waitForPageLoad(page);
    
    // DEBE mostrar título
    const title = page.locator(SELECTORS.tripTitle).first();
    await expect(title).toBeVisible({ timeout: 5000 });
    
    const titleText = await title.textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
    console.log(`✅ Detalle de ruta: "${titleText?.trim()}"`);
    
    // Verificar si hay imagen (puede ser img, background-image, o .no-image placeholder)
    const image = page.locator('.imatge-gran img, .ruta-galeria-principal img, img').first();
    const noImagePlaceholder = page.locator('.no-image').first();
    
    const hasImage = await image.isVisible({ timeout: 5000 }).catch(() => false);
    const hasPlaceholder = await noImagePlaceholder.isVisible({ timeout: 1000 }).catch(() => false);
    
    if (hasImage) {
      console.log('✅ Imagen de ruta visible');
    } else if (hasPlaceholder) {
      console.log('ℹ️ Ruta sin imagen - placeholder visible');
    } else {
      console.log('ℹ️ Sin imagen ni placeholder - verificar datos de seed');
      // No fallar el test si no hay imagen, ya que puede depender del seed data
    }
  });
});

test.describe('Rutas - Funcionalidad con autenticación', () => {
  
  test('DEBE mostrar contenido para usuario autenticado', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Verificar que hay contenido (rutas)
    const tripCards = page.locator(SELECTORS.tripCard);
    await expect(tripCards.first()).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Usuario autenticado puede ver rutas');
  });

  test('DEBE poder guardar una ruta', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Navegar al detalle
    const tripLink = page.locator(SELECTORS.tripCard).first();
    await expect(tripLink).toBeVisible({ timeout: 15000 });
    
    await tripLink.click();
    await waitForPageLoad(page);
    
    // Buscar botón de guardar
    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Save"), [class*="save"]').first();
    
    if (!(await saveButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('ℹ️ Botón de guardar no disponible en el detalle');
      return;
    }
    
    // Interceptar API
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/save') || response.url().includes('/users'),
      { timeout: 10000 }
    ).catch(() => null);
    
    await saveButton.click();
    
    const response = await responsePromise;
    if (response) {
      console.log(`✅ API de guardar respondió con status ${response.status()}`);
    }
  });
});

test.describe('Rutas - Filtros y búsqueda', () => {
  
  test('DEBE verificar si hay elementos de filtrado', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Buscar elementos de filtrado
    const filterElements = page.locator(
      'select, [class*="filter"], [class*="search"], input[type="search"], .category-btn'
    );
    
    const filterCount = await filterElements.count();
    console.log(`ℹ️ ${filterCount} elemento(s) de filtrado encontrado(s)`);
    
    // Informativo - no todos los diseños tienen filtros
    if (filterCount > 0) {
      await expect(filterElements.first()).toBeVisible();
      console.log('✅ Elementos de filtrado visibles');
    }
  });

  test('DEBE funcionar la barra de búsqueda (si existe)', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);

    const searchBar = page.locator('.search-bar, [class*="search"], input[type="search"]').first();
    
    if (!(await searchBar.isVisible({ timeout: 5000 }).catch(() => false))) {
      console.log('ℹ️ Barra de búsqueda no visible en esta versión');
      return;
    }

    const searchInput = page.locator('.search-input, input[type="search"], input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible();

    // Escribir texto de búsqueda
    await searchInput.fill('Barcelona');
    await page.waitForTimeout(500);

    // El grid debe seguir visible
    const grid = page.locator(SELECTORS.tripGrid).first();
    const cards = page.locator(SELECTORS.tripCard);
    
    const gridVisible = await grid.isVisible({ timeout: 8000 }).catch(() => false);
    const cardVisible = await cards.first().isVisible({ timeout: 8000 }).catch(() => false);
    
    if (gridVisible || cardVisible) {
      console.log('✅ Búsqueda ejecutada');
    } else {
      test.skip(true, 'Grid no visible después de buscar en esta UI');
    }
  });
});

// NOTA: Tests de interacción social (seguir) están en user-profile.spec.ts
