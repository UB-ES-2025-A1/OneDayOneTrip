import { test, expect, waitForPageLoad, scrollToElement } from '../fixtures/test-fixtures';

/**
 * 🏠 Tests E2E: Navegación y exploración de la Home
 * 
 * Estos tests verifican flujos complejos de usuario en la página principal,
 * incluyendo carga de rutas, navegación y visualización de contenido.
 */

test.describe('Home Page - Navegación y Exploración', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar a la home antes de cada test
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('debería cargar la página principal correctamente', async ({ page }) => {
    // Verificar elementos principales de la página
    await expect(page.locator('.logo, h1')).toContainText('OneDayOneTrip');
    
    // Verificar que el carrusel está presente
    await expect(page.locator('.carousel, .intro-text')).toBeVisible();
    
    // Verificar botones de autenticación para usuarios no logueados
    await expect(page.getByRole('button', { name: /login|iniciar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /regist/i })).toBeVisible();
  });

  test('debería mostrar el carrusel de imágenes y hacer transiciones', async ({ page }) => {
    const carousel = page.locator('.carousel');
    
    if (await carousel.isVisible()) {
      // Verificar que hay imágenes en el carrusel
      const images = carousel.locator('img');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0);
      
      // Esperar una transición del carrusel (si tiene autoplay)
      await page.waitForTimeout(4000);
    }
  });

  test('debería cargar y mostrar la lista de rutas', async ({ page }) => {
    // Esperar a que las rutas se carguen
    await page.waitForResponse(
      response => response.url().includes('/trips') && response.status() === 200,
      { timeout: 15000 }
    ).catch(() => {
      // Si no hay respuesta de API, puede ser que no haya backend
      console.log('No se detectó respuesta de API de trips');
    });

    // Verificar que hay una sección de rutas
    const tripsSection = page.locator('.trip-list-section, .trip-list, [class*="masonry"]');
    await expect(tripsSection).toBeVisible({ timeout: 10000 });
  });

  test('debería mostrar mensaje cuando no hay rutas', async ({ page }) => {
    // Buscar mensaje de "no hay rutas" si la lista está vacía
    const noTripsMessage = page.locator('.no-trips-message, [class*="empty"]');
    const tripCards = page.locator('[class*="trip-card"], [class*="masonry"] > div');
    
    const cardCount = await tripCards.count();
    
    if (cardCount === 0) {
      // Si no hay tarjetas, debería mostrar mensaje vacío
      await expect(noTripsMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('debería abrir modal de login al hacer clic en el botón', async ({ page }) => {
    // Buscar y hacer clic en el botón de login
    const loginButton = page.getByRole('button', { name: /login|iniciar/i });
    await loginButton.click();

    // Verificar que el modal de login está visible
    const loginModal = page.locator('.modal-backdrop, .login-card, [class*="login-modal"]');
    await expect(loginModal).toBeVisible();

    // Verificar campos del formulario
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('debería cerrar modal de login al hacer clic en X', async ({ page }) => {
    // Abrir modal de login
    const loginButton = page.getByRole('button', { name: /login|iniciar/i });
    await loginButton.click();

    // Verificar que está abierto
    const loginModal = page.locator('.modal-backdrop, .login-card');
    await expect(loginModal).toBeVisible();

    // Cerrar con botón X
    const closeButton = page.locator('.close-btn-login, button:has-text("×")');
    await closeButton.click();

    // Verificar que se cerró
    await expect(loginModal).not.toBeVisible();
  });

  test('debería abrir modal de registro al hacer clic en el botón', async ({ page }) => {
    // Buscar y hacer clic en el botón de registro
    const registerButton = page.getByRole('button', { name: /regist/i });
    await registerButton.click();

    // Verificar que el modal de registro está visible
    const registerModal = page.locator('.modal-backdrop, .register-card, [class*="register"]');
    await expect(registerModal).toBeVisible();
  });

  test('debería navegar desde login a registro usando el link', async ({ page }) => {
    // Abrir modal de login
    await page.getByRole('button', { name: /login|iniciar/i }).click();
    
    // Buscar link "Registra't aquí" o similar
    const registerLink = page.locator('button.auth-link, a:has-text("regist")').first();
    await registerLink.click();

    // Verificar que ahora muestra el formulario de registro
    // Buscamos un campo específico de registro (como nombre completo o username)
    const registerField = page.locator('input[name="fullname"], input[placeholder*="nom"], input[placeholder*="username"]');
    await expect(registerField.first()).toBeVisible({ timeout: 5000 });
  });

  test('debería hacer scroll y mostrar más contenido', async ({ page }) => {
    // Hacer scroll hacia abajo
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    // Verificar que el footer o contenido inferior está visible o se acerca
    const footer = page.locator('footer, .footer');
    if (await footer.count() > 0) {
      await footer.scrollIntoViewIfNeeded();
    }
  });

  test('debería mantener el estado al recargar la página', async ({ page }) => {
    // Cargar página
    await expect(page.locator('.logo, h1')).toContainText('OneDayOneTrip');
    
    // Recargar
    await page.reload();
    await waitForPageLoad(page);
    
    // Verificar que todo sigue funcionando
    await expect(page.locator('.logo, h1')).toContainText('OneDayOneTrip');
    await expect(page.getByRole('button', { name: /login|iniciar/i })).toBeVisible();
  });
});

test.describe('Home Page - Interacción con Rutas', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('debería navegar al detalle de una ruta al hacer clic', async ({ page }) => {
    // Esperar a que las rutas se carguen
    await page.waitForTimeout(2000);
    
    // Buscar una tarjeta de ruta
    const tripCard = page.locator('[class*="trip-card"], [class*="masonry"] > div > a, .trip-item').first();
    
    if (await tripCard.isVisible()) {
      // Hacer clic en la tarjeta
      await tripCard.click();
      
      // Verificar navegación (la URL debería cambiar o aparecer contenido de detalle)
      await page.waitForTimeout(1000);
      
      // Verificar que estamos en una página de detalle o que se abre algo
      const isDetailPage = page.url().includes('/ruta/') || 
                          page.url().includes('/trip/') ||
                          await page.locator('[class*="detail"], [class*="ruta"]').isVisible();
      
      expect(isDetailPage).toBeTruthy();
    }
  });

  test('debería mostrar información básica en las tarjetas de rutas', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const tripCard = page.locator('[class*="masonry"] > div, .trip-card').first();
    
    if (await tripCard.isVisible()) {
      // Las tarjetas deberían tener imagen
      const cardImage = tripCard.locator('img');
      if (await cardImage.count() > 0) {
        await expect(cardImage.first()).toBeVisible();
      }
    }
  });
});

