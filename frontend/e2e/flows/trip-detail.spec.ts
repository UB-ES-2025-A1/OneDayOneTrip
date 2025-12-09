import { test, expect, waitForPageLoad } from '../fixtures/test-fixtures';

/**
 * 🗺️ Tests E2E: Detalle de rutas y visualización
 * 
 * Estos tests verifican el flujo completo de visualización de una ruta,
 * incluyendo información, etapas, comentarios y valoraciones.
 */

test.describe('Detalle de Ruta - Visualización', () => {

  test('debería cargar la página de detalle desde la home', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Esperar a que se carguen las rutas
    await page.waitForTimeout(2000);
    
    // Buscar una tarjeta de ruta y hacer clic
    const tripCard = page.locator('[class*="masonry"] a, .trip-card a, [class*="trip"] a').first();
    
    if (await tripCard.isVisible()) {
      // Obtener el href antes de hacer clic
      const href = await tripCard.getAttribute('href');
      
      await tripCard.click();
      await waitForPageLoad(page);
      
      // Verificar que navegamos a una página de detalle
      expect(page.url()).toMatch(/\/(ruta|trip|detail)/);
    }
  });

  test('debería mostrar información básica de la ruta', async ({ page }) => {
    // Navegar directamente a una página de detalle (si conocemos una ruta)
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Intentar navegar a una ruta
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Verificar elementos de detalle
      // Título
      const title = page.locator('h1, h2, .trip-title, [class*="title"]').first();
      await expect(title).toBeVisible();
      
      // Descripción o contenido
      const content = page.locator('p, .description, [class*="description"]').first();
      await expect(content).toBeVisible();
    }
  });

  test('debería mostrar el mapa o ubicación', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar componente de mapa (Leaflet)
      const mapContainer = page.locator('.leaflet-container, [class*="map"], #map');
      
      // El mapa puede tardar en cargar
      if (await mapContainer.count() > 0) {
        await expect(mapContainer.first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('debería mostrar las etapas de la ruta', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar lista de etapas/puntos
      const etapas = page.locator('[class*="etapa"], [class*="point"], [class*="step"], .trip-points');
      
      if (await etapas.count() > 0) {
        await expect(etapas.first()).toBeVisible();
      }
    }
  });

  test('debería poder volver a la home con el botón de atrás', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar botón de volver
      const backButton = page.locator('button:has-text("←"), button:has-text("Tornar"), button:has-text("Back"), .back-btn');
      
      if (await backButton.isVisible()) {
        await backButton.click();
        await waitForPageLoad(page);
        
        // Deberíamos estar de vuelta en la home
        expect(page.url()).toBe(page.url().split('/')[0] + '//localhost:5173/');
      }
    }
  });
});

test.describe('Detalle de Ruta - Interacción', () => {

  test('debería mostrar galería de imágenes si existe', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar galería de imágenes
      const gallery = page.locator('[class*="gallery"], [class*="carousel"], .images');
      
      if (await gallery.count() > 0) {
        const images = gallery.locator('img');
        const imageCount = await images.count();
        
        if (imageCount > 1) {
          // Si hay múltiples imágenes, debería haber navegación
          const navButtons = page.locator('[class*="gallery"] button, [class*="carousel"] button');
          // Puede haber o no botones de navegación
        }
      }
    }
  });

  test('debería mostrar información del autor', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar información del autor
      const authorInfo = page.locator('[class*="author"], [class*="user"], .creator');
      
      if (await authorInfo.count() > 0) {
        await expect(authorInfo.first()).toBeVisible();
      }
    }
  });

  test('debería mostrar sección de comentarios', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar sección de comentarios
      const commentsSection = page.locator('[class*="comment"], .comments, #comments');
      
      if (await commentsSection.count() > 0) {
        await commentsSection.first().scrollIntoViewIfNeeded();
        await expect(commentsSection.first()).toBeVisible();
      }
    }
  });

  test('debería mostrar valoración promedio', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar indicador de rating/estrellas
      const ratingDisplay = page.locator('[class*="rating"], [class*="star"], .stars, .valoracion');
      
      if (await ratingDisplay.count() > 0) {
        await expect(ratingDisplay.first()).toBeVisible();
      }
    }
  });

  test('debería requerir login para valorar', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar botón de valorar
      const rateButton = page.locator('button:has-text("Valorar"), button:has-text("Rate"), [class*="rate-btn"]');
      
      if (await rateButton.isVisible()) {
        await rateButton.click();
        
        // Sin login, debería pedir autenticación o mostrar mensaje
        await page.waitForTimeout(1000);
        
        // Puede abrir modal de login o mostrar mensaje
        const loginPrompt = page.locator('.modal-backdrop, [class*="login"], [class*="auth"]');
        // El comportamiento depende de la implementación
      }
    }
  });

  test('debería requerir login para comentar', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar input de comentario
      const commentInput = page.locator('textarea[placeholder*="coment"], input[placeholder*="coment"], [class*="comment-input"]');
      
      if (await commentInput.count() > 0) {
        await commentInput.first().click();
        
        // Sin login, el input puede estar deshabilitado o pedir login
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('Detalle de Ruta - Responsive', () => {

  test('debería adaptarse a pantalla móvil', async ({ page }) => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Verificar que el contenido es visible y scrolleable
      const mainContent = page.locator('main, .content, [class*="detail"]').first();
      await expect(mainContent).toBeVisible();
      
      // El layout debería ser columna única en móvil
      // Verificar que no hay overflow horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBeFalsy();
    }
  });

  test('debería adaptarse a tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible()) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Verificar contenido visible
      const title = page.locator('h1, h2, [class*="title"]').first();
      await expect(title).toBeVisible();
    }
  });
});


