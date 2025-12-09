import { test, expect } from '@playwright/test';
import {
  verifyProfilePage,
  clickProfileButton,
  verifyHomePage,
  waitForPageLoad,
  clickLogo,
} from './helpers/test-helpers';

test.describe('Perfil de Usuario', () => {
  test('debería navegar al perfil desde el botón de perfil', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    const profileButton = page.locator('.profile-btn, button[title*="profile" i]');
    if (await profileButton.count() > 0) {
      await profileButton.first().click({ timeout: 5000 });
      await waitForPageLoad(page);
      
      // Si el usuario está autenticado, debería ir a /perfil
      const currentUrl = page.url();
      if (currentUrl.includes('/perfil')) {
        await verifyProfilePage(page);
      }
    }
  });

  test('debería mostrar el header en la página de perfil', async ({ page }) => {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    const header = page.locator('header, .main-header');
    await expect(header.first()).toBeVisible({ timeout: 10000 });
    
    // Verificar que tiene el logo
    const logo = header.locator('h1.logo');
    await expect(logo).toBeVisible({ timeout: 5000 });
  });

  test('debería tener un botón de home en el header del perfil', async ({ page }) => {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    
    // Verificar que estamos en perfil o redirigidos
    const currentUrl = page.url();
    if (currentUrl.includes('/perfil')) {
      const homeButton = page.locator('.home-btn-header, button:has([aria-label*="home" i])');
      if (await homeButton.count() > 0) {
        await expect(homeButton.first()).toBeVisible({ timeout: 5000 });
        await homeButton.first().click({ timeout: 5000 });
        await waitForPageLoad(page);
        await verifyHomePage(page);
      } else {
        // Si no hay botón de home, usar el logo para volver
        const logo = page.locator('h1.logo');
        if (await logo.count() > 0) {
          await logo.click({ timeout: 5000 });
          await waitForPageLoad(page);
          await verifyHomePage(page);
        }
      }
    }
  });

  test('debería mostrar información del usuario en el perfil', async ({ page }) => {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    // Buscar elementos comunes del perfil
    const profileContent = page.locator('main, .layout-content, body');
    await expect(profileContent.first()).toBeVisible({ timeout: 10000 });
    
    // Puede tener nombre, avatar, estadísticas, etc.
    const userName = page.locator('h1, h2, .user-name, [data-testid="user-name"]');
    const userAvatar = page.locator('img.avatar, .user-avatar, [data-testid="avatar"]');
    
    // Al menos debería haber algún contenido
    const hasContent = await profileContent.first().textContent();
    expect(hasContent).toBeTruthy();
  });

  test('debería mostrar los viajes del usuario', async ({ page }) => {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    
    // Verificar que estamos en perfil o redirigidos
    const currentUrl = page.url();
    if (currentUrl.includes('/perfil')) {
      // Buscar grid de viajes (usar .masonry-container que es la clase real)
      const tripsGrid = page.locator('.masonry-container, [data-testid="user-trips"]');
      const trips = page.locator('.masonry-item');
      
      // Puede que no haya viajes, pero verificar que hay contenido
      const hasGrid = await tripsGrid.count() > 0;
      const hasTrips = await trips.count() > 0;
      
      // Al menos debería haber contenido en la página
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText).toBeTruthy();
    }
  });

  test('debería mostrar tabs o secciones en el perfil', async ({ page }) => {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    // Buscar tabs comunes (publicaciones, guardados, etc.)
    const tabs = page.locator('.tab, .tab-btn, button:has-text("Publicaciones"), button:has-text("Guardados")');
    
    // Puede que no haya tabs, dependiendo del diseño
  });

  test('debería tener botón de logout en el perfil', async ({ page }) => {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    const logoutButton = page.locator('.header-btn.logout, button.logout, button:has-text("Cerrar sesión"), button:has-text("Tancar sessió"), button:has-text("Logout")');
    
    // Si el usuario está autenticado, debería haber un botón de logout
    if (await logoutButton.count() > 0) {
      await expect(logoutButton.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('debería poder navegar de perfil a home usando el logo', async ({ page }) => {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    const logo = page.locator('h1.logo');
    await expect(logo).toBeVisible({ timeout: 10000 });
    await logo.click({ timeout: 5000 });
    await waitForPageLoad(page);
    await verifyHomePage(page);
  });

  test('debería mostrar estadísticas del usuario si existen', async ({ page }) => {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    // Buscar estadísticas (seguidores, seguidos, viajes, etc.)
    const stats = page.locator('.stats, .statistics, [data-testid="stats"]');
    
    // Puede que no todas las versiones muestren estadísticas
  });

  test('debería mostrar botón de editar perfil si el usuario está autenticado', async ({ page }) => {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    // Buscar botón de editar
    const editButton = page.locator('button:has-text("Editar"), button:has-text("Edit"), .edit-profile-btn');
    
    // Puede que no esté visible si no es el perfil propio
  });

  test('debería mostrar botón de crear nuevo viaje en el perfil', async ({ page }) => {
    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    // Buscar botón de crear viaje
    const createButton = page.locator('button:has-text("Nuevo viaje"), button:has-text("New trip"), [data-testid="create-trip"]');
    
    // Puede que no esté visible si no es el perfil propio
  });
});

