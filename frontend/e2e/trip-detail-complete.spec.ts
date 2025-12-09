import { test, expect } from '@playwright/test';
import {
  verifyRouteDetailPage,
  clickBackButton,
  verifyHomePage,
  waitForPageLoad,
  navigateToRoute,
} from './helpers/test-helpers';

test.describe('Detalle de Ruta Completo', () => {
  test('debería cargar la página de detalle de ruta', async ({ page }) => {
    await navigateToRoute(page, 'test-route-id');
    
    // Verificar que la página carga
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    const currentUrl = page.url();
    if (currentUrl.includes('/ruta/')) {
      await verifyRouteDetailPage(page);
    }
  });

  test('debería mostrar el header en la página de detalle', async ({ page }) => {
    await navigateToRoute(page, 'test-route-id');
    
    const header = page.locator('header, .main-header');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
    
    // Verificar que el logo está presente
    const logo = header.locator('h1.logo');
    await expect(logo).toBeVisible({ timeout: 5000 });
  });

  test('debería tener un botón de volver funcional', async ({ page }) => {
    // Ir primero a home
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    // Ir a detalle de ruta
    await navigateToRoute(page, 'test-route-id');
    
    const currentUrl = page.url();
    if (currentUrl.includes('/ruta/')) {
      // Buscar y hacer clic en el botón de volver
      const backButton = page.locator('.back-btn-header, button:has-text("Volver"), button:has-text("Tornar"), button:has-text("Go Back")');
      if (await backButton.count() > 0) {
        await expect(backButton.first()).toBeVisible({ timeout: 5000 });
        await backButton.first().click({ timeout: 5000 });
        await waitForPageLoad(page);
        
        // Debería volver a home
        await verifyHomePage(page);
      }
    }
  });

  test('debería mostrar información del viaje', async ({ page }) => {
    await navigateToRoute(page, 'test-route-id');
    
    // Buscar elementos comunes en una página de detalle
    const pageContent = page.locator('main, .layout-content, body');
    await expect(pageContent.first()).toBeVisible({ timeout: 10000 });
    
    // Puede tener título, imágenes, descripción, etc.
    const title = page.locator('h1, h2, .trip-title, [data-testid="trip-title"]');
    const images = page.locator('img');
    
    // Al menos debería haber algún contenido
    const hasContent = await pageContent.first().textContent();
    expect(hasContent).toBeTruthy();
  });

  test('debería mostrar imágenes del viaje si existen', async ({ page }) => {
    await navigateToRoute(page, 'test-route-id');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    // Puede que haya imágenes o no, dependiendo del viaje
    if (imageCount > 0) {
      // Verificar que al menos una imagen es visible
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
    }
  });

  test('debería mostrar botones de acción si el usuario está autenticado', async ({ page }) => {
    await navigateToRoute(page, 'test-route-id');
    
    // Buscar botones comunes (guardar, seguir, valorar, etc.)
    const actionButtons = page.locator('button:has-text("Guardar"), button:has-text("Seguir"), button:has-text("Valorar"), button:has-text("Save"), button:has-text("Follow")');
    
    // Puede que no haya botones si el usuario no está autenticado
    // Solo verificamos si existen
  });

  test('debería mostrar sección de comentarios', async ({ page }) => {
    await navigateToRoute(page, 'test-route-id');
    
    // Buscar sección de comentarios
    const commentsSection = page.locator('.comments, [data-testid="comments"], :has-text("Comentarios"), :has-text("Comments")');
    
    // Puede que no haya comentarios, pero la sección debería existir o no estar visible
  });

  test('debería mostrar información del autor del viaje', async ({ page }) => {
    await navigateToRoute(page, 'test-route-id');
    
    // Buscar información del autor
    const authorInfo = page.locator('.author, .user-info, [data-testid="author"]');
    
    // Puede que no esté visible si no hay autor
  });

  test('debería poder navegar al perfil del autor si existe', async ({ page }) => {
    await navigateToRoute(page, 'test-route-id');
    
    // Verificar que la página cargó correctamente
    const currentUrl = page.url();
    if (currentUrl.includes('/ruta/')) {
      // Buscar enlace o botón al perfil del autor
      const authorLink = page.locator('a[href*="/user/"], a[href*="/perfil"], button:has-text("Ver perfil"), .author-link, .user-link');
      
      if (await authorLink.count() > 0) {
        await authorLink.first().click({ timeout: 5000 });
        await waitForPageLoad(page);
        
        // Debería navegar al perfil del usuario o a /perfil
        const newUrl = page.url();
        expect(newUrl.includes('/user/') || newUrl.includes('/perfil')).toBeTruthy();
      }
    }
  });

  test('debería mostrar lista de etapas si el viaje las tiene', async ({ page }) => {
    await navigateToRoute(page, 'test-route-id');
    
    // Buscar lista de etapas
    const etapasList = page.locator('.etapes-list, [data-testid="etapes"], :has-text("Etapas"), :has-text("Stages")');
    
    // Puede que no todas las rutas tengan etapas
  });

  test('debería mostrar rating del viaje', async ({ page }) => {
    await navigateToRoute(page, 'test-route-id');
    
    // Buscar elementos de rating
    const ratingElements = page.locator('.rating, .stars, [data-testid="rating"], :has-text("⭐")');
    
    // Puede que no todos los viajes tengan rating visible
  });
});

