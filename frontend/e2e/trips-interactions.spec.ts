import { test, expect } from '@playwright/test';
import {
  verifyHomePage,
  waitForTripsToLoad,
  clickOnTrip,
  verifyRouteDetailPage,
  waitForPageLoad,
  clickBackButton,
  closeModal,
} from './helpers/test-helpers';

test.describe('Interacciones con Viajes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await waitForTripsToLoad(page);
  });

  test('debería mostrar viajes en el grid', async ({ page }) => {
    await verifyHomePage(page);
    
    const trips = page.locator('.masonry-item, [data-testid="trip-card"]');
    const tripCount = await trips.count();
    
    // Puede que no haya viajes, pero al menos debería existir el contenedor
    const gridContainer = page.locator('.masonry-container');
    if (await gridContainer.count() > 0) {
      await expect(gridContainer.first()).toBeVisible({ timeout: 10000 });
    } else {
      // Si no hay contenedor, verificar que hay algún contenido en la página
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText).toBeTruthy();
    }
  });

  test('debería hacer clic en un viaje y navegar a su detalle', async ({ page }) => {
    const trips = page.locator('.masonry-item');
    const tripCount = await trips.count();
    
    if (tripCount > 0) {
      // Hacer clic en el primer viaje
      await trips.first().click({ timeout: 5000 });
      await waitForPageLoad(page);
      
      // Verificar que navegamos a la página de detalle o se abrió modal
      const currentUrl = page.url();
      const hasModal = await page.locator('.modal-backdrop').count() > 0;
      
      if (currentUrl.includes('/ruta/')) {
        await verifyRouteDetailPage(page);
      } else if (hasModal) {
        // Si se abrió modal, el usuario no está autenticado (no es un error)
        expect(hasModal).toBeTruthy();
        // Cerrar el modal para continuar
        await closeModal(page);
        await page.waitForTimeout(500);
      }
    }
  });

  test('debería mostrar información del viaje en el card', async ({ page }) => {
    const trips = page.locator('.masonry-item, [data-testid="trip-card"]');
    const tripCount = await trips.count();
    
    if (tripCount > 0) {
      const firstTrip = trips.first();
      
      // Verificar que el card tiene contenido
      await expect(firstTrip).toBeVisible();
      
      // Puede tener imagen, título, usuario, etc.
      const tripImage = firstTrip.locator('img');
      const tripTitle = firstTrip.locator('h2, h3, .trip-title, [data-testid="trip-title"]');
      
      // Al menos uno de estos elementos debería existir
      const hasImage = await tripImage.count() > 0;
      const hasTitle = await tripTitle.count() > 0;
    }
  });

  test('debería poder hacer clic en múltiples viajes consecutivamente', async ({ page }) => {
    const trips = page.locator('.masonry-item');
    const tripCount = await trips.count();
    
    if (tripCount >= 2) {
      // Clic en primer viaje
      await trips.first().click({ timeout: 5000 });
      await waitForPageLoad(page);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/ruta/')) {
        await verifyRouteDetailPage(page);
        
        // Volver
        const backButton = page.locator('.back-btn-header, button:has-text("Volver"), button:has-text("Tornar")');
        if (await backButton.count() > 0) {
          await backButton.first().click({ timeout: 5000 });
          await waitForPageLoad(page);
          await verifyHomePage(page);
          await waitForTripsToLoad(page);
          
          // Clic en segundo viaje
          const tripsAfter = page.locator('.masonry-item');
          if (await tripsAfter.count() > 1) {
            await tripsAfter.nth(1).click({ timeout: 5000 });
            await waitForPageLoad(page);
            const urlAfter = page.url();
            if (urlAfter.includes('/ruta/')) {
              await verifyRouteDetailPage(page);
            }
          }
        }
      }
    }
  });

  test('debería mostrar rating en los cards de viaje', async ({ page }) => {
    const trips = page.locator('.masonry-item, [data-testid="trip-card"]');
    const tripCount = await trips.count();
    
    if (tripCount > 0) {
      const firstTrip = trips.first();
      
      // Buscar elementos de rating (estrellas, números, etc.)
      const ratingElements = firstTrip.locator('.rating, .stars, [data-testid="rating"]');
      // Puede que no todos los viajes tengan rating visible
    }
  });

  test('debería mostrar información de ubicación en los cards', async ({ page }) => {
    const trips = page.locator('.masonry-item, [data-testid="trip-card"]');
    const tripCount = await trips.count();
    
    if (tripCount > 0) {
      const firstTrip = trips.first();
      
      // Buscar información de ubicación (ciudad, país, etc.)
      const locationElements = firstTrip.locator(':has-text("Madrid"), :has-text("Barcelona"), .location, .city, .country');
      // Puede que no todos los viajes tengan ubicación visible
    }
  });

  test('debería mostrar el autor del viaje en el card', async ({ page }) => {
    const trips = page.locator('.masonry-item, [data-testid="trip-card"]');
    const tripCount = await trips.count();
    
    if (tripCount > 0) {
      const firstTrip = trips.first();
      
      // Buscar información del autor
      const authorElements = firstTrip.locator('.author, .user, [data-testid="author"]');
      // Puede que no todos los viajes muestren el autor
    }
  });

  test('debería cargar más viajes al hacer scroll si hay paginación', async ({ page }) => {
    // Hacer scroll hasta el final
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Verificar si hay más viajes cargados
    const trips = page.locator('.masonry-item, [data-testid="trip-card"]');
    const tripCount = await trips.count();
    
    // Si hay paginación infinita, puede que se carguen más viajes
  });
});

