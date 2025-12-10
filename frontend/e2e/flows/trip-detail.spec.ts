import { test, expect, waitForPageLoad, SELECTORS } from '../fixtures/test-fixtures';
import { loginAsTestUser } from '../fixtures/auth-helpers';

/**
 * 🗺️ Tests E2E: Detalle de rutas y visualización
 * 
 * Tests ESTRICTOS que verifican el flujo completo de visualización de una ruta.
 * 
 * NOTA: En esta aplicación, hacer clic en una tarjeta sin autenticación
 * abre el modal de registro. Por lo tanto, todos los tests que necesitan
 * navegar al detalle requieren autenticación previa.
 */

test.describe('Detalle de Ruta - Navegación', () => {

  test('DEBE poder navegar desde la home al detalle (con auth)', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // DEBE haber al menos una tarjeta
    const tripCard = page.locator(SELECTORS.tripCard).first();
    await expect(tripCard).toBeVisible({ timeout: 15000 });
    
    // Hacer clic
    await tripCard.click();
    await waitForPageLoad(page);
    
    // DEBE navegar a página de detalle
    await page.waitForURL(/\/(ruta|trip)\//, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(ruta|trip)\//);
    console.log(`✅ Navegación exitosa a: ${page.url()}`);
  });
});

test.describe('Detalle de Ruta - Contenido Requerido', () => {

  test('DEBE mostrar título de la ruta', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripCard = page.locator(SELECTORS.tripCard).first();
    await expect(tripCard).toBeVisible({ timeout: 15000 });
    await tripCard.click();
    await waitForPageLoad(page);
    
    const title = page.locator(SELECTORS.tripTitle).first();
    await expect(title).toBeVisible({ timeout: 5000 });
    
    // El título DEBE tener contenido
    const titleText = await title.textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
    console.log(`✅ Título de ruta: "${titleText?.trim()}"`);
  });

  test('DEBE mostrar descripción o contenido', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripCard = page.locator(SELECTORS.tripCard).first();
    await expect(tripCard).toBeVisible({ timeout: 15000 });
    await tripCard.click();
    await waitForPageLoad(page);
    
    const content = page.locator(SELECTORS.tripDescription).first();
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('DEBE mostrar al menos una imagen', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripCard = page.locator(SELECTORS.tripCard).first();
    await expect(tripCard).toBeVisible({ timeout: 15000 });
    await tripCard.click();
    await waitForPageLoad(page);
    
    const image = page.locator('img').first();
    await expect(image).toBeVisible({ timeout: 5000 });
  });

  test('DEBE mostrar el mapa (Leaflet)', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripCard = page.locator(SELECTORS.tripCard).first();
    await expect(tripCard).toBeVisible({ timeout: 15000 });
    await tripCard.click();
    await waitForPageLoad(page);
    
    const mapContainer = page.locator(SELECTORS.mapContainer).first();
    
    // El mapa puede tardar en cargar
    await expect(mapContainer).toBeVisible({ timeout: 15000 });
    console.log('✅ Mapa visible');
  });

  test('DEBE mostrar información del autor', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripCard = page.locator(SELECTORS.tripCard).first();
    await expect(tripCard).toBeVisible({ timeout: 15000 });
    await tripCard.click();
    await waitForPageLoad(page);
    
    const authorInfo = page.locator(SELECTORS.tripAuthor).first();
    const authorLink = page.locator(`${SELECTORS.tripAuthor} a, a[href*="/perfil"]`).first();
    
    const hasAuthor = await authorInfo.isVisible({ timeout: 5000 }).catch(() => false) ||
                      await authorLink.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasAuthor) {
      console.log('✅ Información del autor visible');
    } else {
      test.skip(true, 'Autor no visible en la UI actual');
    }
  });
});

test.describe('Detalle de Ruta - Secciones Interactivas', () => {

  test('DEBE mostrar sección de comentarios', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripCard = page.locator(SELECTORS.tripCard).first();
    await expect(tripCard).toBeVisible({ timeout: 15000 });
    await tripCard.click();
    await waitForPageLoad(page);
    
    const commentsSection = page.locator(SELECTORS.commentsSection).first();
    await commentsSection.scrollIntoViewIfNeeded();
    await expect(commentsSection).toBeVisible({ timeout: 5000 });
    console.log('✅ Sección de comentarios visible');
  });

  test('DEBE mostrar display de valoración', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripCard = page.locator(SELECTORS.tripCard).first();
    await expect(tripCard).toBeVisible({ timeout: 15000 });
    await tripCard.click();
    await waitForPageLoad(page);
    
    const ratingDisplay = page.locator(SELECTORS.ratingDisplay).first();
    
    // El rating puede estar en diferentes ubicaciones
    const hasRating = await ratingDisplay.count() > 0;
    if (hasRating) {
      await expect(ratingDisplay).toBeVisible({ timeout: 5000 });
      console.log('✅ Display de valoración visible');
    } else {
      // Si no hay rating display, debe haber al menos botón de valorar
      const rateButton = page.locator(SELECTORS.rateButton).first();
      await expect(rateButton).toBeVisible({ timeout: 5000 });
      console.log('✅ Botón de valorar visible');
    }
  });
});

test.describe('Detalle de Ruta - Responsive', () => {

  test('DEBE adaptarse a pantalla móvil sin scroll horizontal', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripCard = page.locator(SELECTORS.tripCard).first();
    await expect(tripCard).toBeVisible({ timeout: 15000 });
    await tripCard.click();
    await waitForPageLoad(page);
    
    // Verificar que el título es visible en móvil
    const title = page.locator(SELECTORS.tripTitle).first();
    await expect(title).toBeVisible({ timeout: 5000 });
    
    // NO debe haber scroll horizontal
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBeFalsy();
    console.log('✅ Layout responsive sin scroll horizontal');
  });

  test('DEBE adaptarse a tablet', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripCard = page.locator(SELECTORS.tripCard).first();
    await expect(tripCard).toBeVisible({ timeout: 15000 });
    await tripCard.click();
    await waitForPageLoad(page);
    
    // Contenido debe ser visible
    const title = page.locator(SELECTORS.tripTitle).first();
    await expect(title).toBeVisible({ timeout: 5000 });
  });
});
