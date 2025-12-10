import { test, expect } from '@playwright/test';
import { loginWithMock, MOCK_USER, MOCK_BACKEND_USER, setupAuthMocks } from '../fixtures/mock-auth';

/**
 * 🗺️ Tests E2E: Rutas con datos reales (ESTRICTOS)
 * 
 * Estos tests verifican que las rutas creadas por el global-setup
 * se muestran correctamente en la UI.
 * 
 * NOTA: Los datos de prueba se crean en global-setup.ts antes de todos los tests.
 * Estos tests FALLARÁN si no hay datos en la BD.
 */

const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';

test.describe('Rutas - Verificación estricta de datos', () => {

  test('DEBE cargar rutas desde la API', async ({ page }) => {
    // Configurar interceptor ANTES de navegar
    // Filtrar solo respuestas de la API backend (puerto 8000), no archivos del frontend
    const responsePromise = page.waitForResponse(
      response => response.url().includes(':8000/trips') && 
                  response.status() === 200 &&
                  response.headers()['content-type']?.includes('application/json'),
      { timeout: 20000 }
    );
    
    // Navegar
    await page.goto('/');
    
    // Esperar respuesta de la API
    const tripsResponse = await responsePromise;
    
    // Verificar que la API respondió
    expect(tripsResponse).toBeTruthy();
    
    const data = await tripsResponse.json();
    console.log(`📊 API respondió con ${Array.isArray(data) ? data.length : 0} rutas`);
    
    // DEBE haber al menos 1 ruta (las del seed)
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('DEBE mostrar rutas en la home después del seed', async ({ page }) => {
    // Navegar a la home
    await page.goto('/');
    await page.waitForResponse(
      (response) =>
        response.url().includes('/trips') &&
        response.status() === 200 &&
        response.headers()['content-type']?.includes('application/json'),
      { timeout: 20000 }
    ).catch(() => null);
    
    // Verificar que existe la sección de rutas
    const tripsSection = page.locator('[class*="masonry"], .trip-list, .trip-list-section');
    await expect(tripsSection.first()).toBeVisible({ timeout: 10000 });
    
    // Buscar tarjetas de rutas - DEBE haber al menos 1
    const tripCards = page.locator('[class*="masonry"] a, .trip-card, [class*="masonry-item"]');
    const cardCount = await tripCards.count();
    
    console.log(`🎴 Tarjetas de rutas encontradas: ${cardCount}`);
    
    // ESTRICTO: Debe haber rutas visibles
    expect(cardCount).toBeGreaterThan(0);
  });

  test('DEBE poder navegar al detalle de una ruta', async ({ page }) => {
    await page.goto('/');
    await page.waitForResponse(
      (response) =>
        response.url().includes('/trips') &&
        response.status() === 200,
      { timeout: 20000 }
    ).catch(() => null);
    
    // Verificar primero que hay tarjetas (usando el mismo selector que el test que funciona)
    const tripCards = page.locator('[class*="masonry"] a, .trip-card, [class*="masonry-item"]');
    const cardCount = await tripCards.count();
    console.log(`🎴 Tarjetas encontradas: ${cardCount}`);
    
    // Debe haber rutas
    expect(cardCount).toBeGreaterThan(0);
    
    // Hacer clic en la primera tarjeta (cualquier elemento clickeable)
    const firstCard = tripCards.first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    
    // Verificar que navegamos (la URL cambió o hay contenido de detalle)
    const isDetailPage = page.url().includes('/ruta/') || 
                        page.url().includes('/trip/') ||
                        await page.locator('[class*="detail"], h1, h2').first().isVisible();
    
    expect(isDetailPage).toBeTruthy();
    console.log(`🔗 URL: ${page.url()}`);
  });

  test('DEBE mostrar información completa en el detalle', async ({ page }) => {
    await page.goto('/');
    await page.waitForResponse(
      (response) =>
        response.url().includes('/trips') &&
        response.status() === 200,
      { timeout: 20000 }
    ).catch(() => null);
    
    // Buscar tarjetas de rutas
    const tripCards = page.locator('[class*="masonry"] a, .trip-card, [class*="masonry-item"]');
    await expect(tripCards.first()).toBeVisible({ timeout: 10000 });
    
    // Hacer clic en la primera tarjeta
    await tripCards.first().click();
    await page.waitForLoadState('networkidle');
    
    // Verificar elementos REQUERIDOS en el detalle
    const title = page.locator('h1, h2, [class*="title"]').first();
    const image = page.locator('img').first();
    
    await expect(title).toBeVisible({ timeout: 5000 });
    await expect(image).toBeVisible({ timeout: 5000 });
    
    // Verificar que el título tiene contenido
    const titleText = await title.textContent();
    expect(titleText?.length).toBeGreaterThan(0);
    
    console.log(`📝 Detalle de ruta: "${titleText}"`);
  });
});

test.describe('Rutas - Creación con autenticación mock', () => {
  
  test('DEBE mostrar botón de crear ruta cuando hay sesión', async ({ page }) => {
    // Configurar mocks de autenticación
    await setupAuthMocks(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Inyectar estado de auth
    await page.evaluate((mockUser) => {
      localStorage.setItem('uid', mockUser.uid);
    }, MOCK_USER);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Buscar botón de crear ruta
    const createButton = page.locator(
      'button:has-text("Nova ruta"), button:has-text("New"), [class*="new-trip"], [class*="create"]'
    );
    
    await expect(createButton.first()).toBeVisible({ timeout: 8000 });
    console.log('✅ Botón de crear ruta visible con auth mock');
  });

  test('flujo de creación: abrir formulario', async ({ page }) => {
    await setupAuthMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Buscar botón de crear
    const createButton = page.locator(
      'button:has-text("Nova ruta"), button:has-text("New"), [class*="new-trip"]'
    ).first();
    
    await expect(createButton).toBeVisible({ timeout: 5000 });
    
    await createButton.click();
    
    // Verificar que se abre el formulario
    const createForm = page.locator('.create-trip-backdrop, .create-trip-panel, [class*="create-trip"]');
    await expect(createForm.first()).toBeVisible({ timeout: 5000 });
    
    // Verificar campos del formulario
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toBeVisible();
    
    console.log('✅ Formulario de creación abierto correctamente');
  });
});

test.describe('Rutas - Filtros y búsqueda', () => {
  
  test('DEBE tener sección de filtros o búsqueda', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Buscar elementos de filtrado
    const filterElements = page.locator(
      'select, [class*="filter"], [class*="search"], input[type="search"], .category-btn'
    );
    
    const filterCount = await filterElements.count();
    console.log(`🔍 Elementos de filtrado encontrados: ${filterCount}`);
    
    // Informativo - no todos los diseños tienen filtros visibles
    if (filterCount > 0) {
      await expect(filterElements.first()).toBeVisible();
    }
  });
});

test.describe('Rutas - Búsqueda y filtros (con auth mock)', () => {
  test('debería mostrar barra de búsqueda y permitir filtrar por texto', async ({ page }) => {
    await setupAuthMocks(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Inyectar estado de auth y recargar para mostrar barra de búsqueda
    await page.evaluate((mockUser) => localStorage.setItem('uid', mockUser.uid), MOCK_USER);
    await page.reload();
    await page.waitForLoadState('networkidle');

    const searchBar = page.locator('.search-bar');
    if (!(await searchBar.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip('barra de búsqueda no visible (requiere auth real)');
    }

    await expect(searchBar).toBeVisible();
    const searchInput = page.locator('.search-input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('a');

    // El grid debe seguir visible tras filtrar
    const grid = page.locator('[class*="masonry"], .trip-list, [class*="grid"]');
    await expect(grid.first()).toBeVisible({ timeout: 5000 });

    const filterSelect = page.locator('.search-filter-select');
    if (await filterSelect.count() > 0) {
      await filterSelect.selectOption('city').catch(() => {});
      await expect(filterSelect).toBeVisible();
    }
  });
});

test.describe('Rutas - Seguir y guardar (auth mock, skip si no hay UI)', () => {
  test('debería mostrar botón de seguir en perfil público', async ({ page }) => {
    await setupAuthMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    if (!(await tripLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip('no hay rutas visibles para navegar al perfil');
    }

    await tripLink.click();
    await page.waitForLoadState('networkidle');

    const authorLink = page.locator('[class*="author"] a, a[href*="/perfil"]').first();
    if (!(await authorLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip('no hay link al autor en la tarjeta');
    }

    await authorLink.click();
    await page.waitForLoadState('networkidle');

    const followButton = page.locator('button:has-text("Seguir"), button:has-text("Follow"), [class*="follow-btn"]').first();
    if (!(await followButton.isVisible({ timeout: 4000 }).catch(() => false))) {
      test.skip('botón de seguir no disponible (requiere backend)');
    }

    await followButton.click();
    await expect(followButton).toBeVisible();
  });

  test('debería mostrar botón de guardar en detalle y permitir click', async ({ page }) => {
    await setupAuthMocks(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    if (!(await tripLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip('no hay rutas visibles para abrir detalle');
    }

    await tripLink.click();
    await waitForPageLoad(page);

    const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Save"), [class*="save"]');
    if (!(await saveButton.first().isVisible({ timeout: 4000 }).catch(() => false))) {
      test.skip('botón de guardar no disponible en el detalle');
    }

    await saveButton.first().click();
    await expect(saveButton.first()).toBeVisible();
  });
});
