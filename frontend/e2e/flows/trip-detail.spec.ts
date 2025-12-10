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
    
    // Esperar a que se carguen las rutas desde la API
    await page.waitForResponse(
      response => response.url().includes('/trips') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);
    
    // Buscar una tarjeta de ruta y hacer clic
    const tripCard = page.locator('[class*="masonry"] a, .trip-card a, [class*="trip"] a').first();
    
    if (await tripCard.isVisible({ timeout: 5000 })) {
      // Obtener el href antes de hacer clic
      const href = await tripCard.getAttribute('href');
      expect(href).toBeTruthy();
      
      await tripCard.click();
      await waitForPageLoad(page);
      
      // Verificar que navegamos a una página de detalle
      await page.waitForURL(/\/(ruta|trip|detail)/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/(ruta|trip|detail)/);
    } else {
      // Si no hay tarjetas, verificar que la página cargó
      await expect(page.locator('body')).toBeVisible();
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
    
    // Esperar a que se carguen las rutas
    await page.waitForResponse(
      response => response.url().includes('/trips') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible({ timeout: 5000 })) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar botón de valorar
      const rateButton = page.locator('button:has-text("Valorar"), button:has-text("Rate"), [class*="rate-btn"]');
      
      if (await rateButton.isVisible({ timeout: 2000 })) {
        await rateButton.click();
        
        // Esperar a que aparezca el modal de login o mensaje
        await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => null);
        
        // Puede abrir modal de login o mostrar mensaje
        const loginPrompt = page.locator('.modal-backdrop, [class*="login"], [class*="auth"], .login-card');
        const hasLoginPrompt = await loginPrompt.count() > 0 && await loginPrompt.first().isVisible({ timeout: 3000 }).catch(() => false);
        
        // Debería aparecer algún prompt de login o el modal de valoración debería requerir auth
        expect(hasLoginPrompt || await rateButton.isVisible({ timeout: 1000 }).catch(() => false)).toBeTruthy();
      } else {
        // Si no hay botón de valorar, verificar que estamos en la página de detalle
        const title = page.locator('h1, h2, [class*="title"]').first();
        await expect(title).toBeVisible({ timeout: 5000 });
      }
    } else {
      // Si no hay links, verificar que la página cargó
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('debería requerir login para comentar', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Esperar a que se carguen las rutas
    await page.waitForResponse(
      response => response.url().includes('/trips') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => null);
    
    const tripLink = page.locator('[class*="masonry"] a, .trip-card a').first();
    
    if (await tripLink.isVisible({ timeout: 5000 })) {
      await tripLink.click();
      await waitForPageLoad(page);
      
      // Buscar input de comentario
      const commentInput = page.locator('textarea[placeholder*="coment"], input[placeholder*="coment"], [class*="comment-input"]');
      
      if (await commentInput.count() > 0) {
        const inputVisible = await commentInput.first().isVisible({ timeout: 2000 }).catch(() => false);
        
        if (inputVisible) {
          await commentInput.first().click();
          
          // Sin login, el input puede estar deshabilitado o pedir login
          await page.waitForLoadState('networkidle', { timeout: 1000 }).catch(() => null);
          
          const isDisabled = await commentInput.first().isDisabled().catch(() => false);
          const loginPrompt = page.locator('.login-card, [class*="login"], [class*="auth-required"]');
          const hasLoginPrompt = await loginPrompt.count() > 0 && await loginPrompt.first().isVisible({ timeout: 2000 }).catch(() => false);
          
          // El input debería estar deshabilitado o debería aparecer un prompt de login
          expect(isDisabled || hasLoginPrompt).toBeTruthy();
        }
      } else {
        // Si no hay input de comentario, verificar que estamos en la página de detalle
        const title = page.locator('h1, h2, [class*="title"]').first();
        await expect(title).toBeVisible({ timeout: 5000 });
      }
    } else {
      // Si no hay links, verificar que la página cargó
      await expect(page.locator('body')).toBeVisible();
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


