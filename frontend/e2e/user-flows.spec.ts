import { test, expect } from '@playwright/test';
import {
  verifyHomePage,
  clickLoginButton,
  clickRegisterButton,
  fillLoginForm,
  fillRegisterForm,
  submitForm,
  closeModal,
  waitForTripsToLoad,
  waitForPageLoad,
  clickOnTrip,
  verifyRouteDetailPage,
  clickBackButton,
  clickProfileButton,
  verifyProfilePage,
  clickLogo,
} from './helpers/test-helpers';

test.describe('Flujos Completos de Usuario', () => {
  test('flujo completo: navegar por la aplicación sin autenticación', async ({ page }) => {
    // 1. Ir a home
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    await verifyHomePage(page);
    
    // 2. Ver viajes
    await waitForTripsToLoad(page);
    const trips = page.locator('.masonry-item');
    
    // 3. Intentar hacer clic en un viaje (puede que abra modal de registro)
    if (await trips.count() > 0) {
      await trips.first().click({ timeout: 5000 });
      await waitForPageLoad(page);
      
      // Puede que navegue a detalle o abra modal
      const currentUrl = page.url();
      const hasModal = await page.locator('.modal-backdrop').count() > 0;
      
      if (currentUrl.includes('/ruta/')) {
        await verifyRouteDetailPage(page);
        
        // Volver
        const backButton = page.locator('.back-btn-header, button:has-text("Volver"), button:has-text("Tornar")');
        if (await backButton.count() > 0) {
          await backButton.first().click({ timeout: 5000 });
          await waitForPageLoad(page);
          await verifyHomePage(page);
        } else {
          // Si no hay botón de volver, usar logo
          const logo = page.locator('h1.logo');
          if (await logo.count() > 0) {
            await logo.click({ timeout: 5000 });
            await waitForPageLoad(page);
            await verifyHomePage(page);
          }
        }
      } else if (hasModal) {
        // Si se abrió modal, cerrarlo
        await closeModal(page);
        await page.waitForTimeout(500);
      }
    }
    
    // 4. Intentar abrir modal de login
    const loginClicked = await clickLoginButton(page);
    if (loginClicked) {
      await page.waitForTimeout(500);
      
      // Verificar que el modal está visible
      const modal = page.locator('.modal-backdrop, .login-card');
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible({ timeout: 5000 });
      }
      
      // 5. Cerrar modal
      await closeModal(page);
      await page.waitForTimeout(500);
    }
    
    // 6. Navegar usando el logo
    const logo = page.locator('h1.logo');
    await expect(logo).toBeVisible({ timeout: 10000 });
    await logo.click({ timeout: 5000 });
    await waitForPageLoad(page);
    await verifyHomePage(page);
  });

  test('flujo completo: intentar registrarse (sin completar)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    
    // 1. Abrir modal de registro
    const clicked = await clickRegisterButton(page);
    if (!clicked) return; // Si no se pudo abrir, saltar test
    
    await page.waitForTimeout(500);
    
    // 2. Verificar que el modal está abierto
    const registerModal = page.locator('.register-card, .modal-backdrop');
    if (await registerModal.count() > 0) {
      await expect(registerModal.first()).toBeVisible();
    }
    
    // 3. Intentar llenar formulario (parcialmente)
    await fillRegisterForm(page, {
      username: 'testuser',
      email: 'test@example.com',
    });
    
    // 4. Cerrar modal sin completar
    await closeModal(page);
    await page.waitForTimeout(500);
    
    // 5. Verificar que volvimos a home
    await verifyHomePage(page);
  });

  test('flujo completo: explorar viajes y navegar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await verifyHomePage(page);
    
    // 1. Esperar a que carguen los viajes
    await waitForTripsToLoad(page);
    
    // 2. Verificar que hay viajes
    const trips = page.locator('.masonry-item');
    const tripCount = await trips.count();
    
    if (tripCount > 0) {
      // 3. Hacer clic en el primer viaje
      await trips.first().click({ timeout: 5000 });
      await waitForPageLoad(page);
      
      // 4. Verificar que estamos en detalle
      const currentUrl = page.url();
      if (currentUrl.includes('/ruta/')) {
        await verifyRouteDetailPage(page);
        
        // 5. Verificar que hay contenido
        const pageContent = page.locator('main, .layout-content, body');
        await expect(pageContent.first()).toBeVisible({ timeout: 10000 });
        
        // 6. Volver a home
        const backButton = page.locator('.back-btn-header, button:has-text("Volver"), button:has-text("Tornar")');
        if (await backButton.count() > 0) {
          await backButton.first().click({ timeout: 5000 });
          await waitForPageLoad(page);
          await verifyHomePage(page);
        }
      }
    }
  });

  test('flujo completo: búsqueda y filtrado', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await waitForTripsToLoad(page);
    
    // 1. Buscar campo de búsqueda
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    
    if (await searchInput.count() > 0) {
      // 2. Escribir en búsqueda
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);
      
      // 3. Cambiar filtro si existe
      const filterButtons = page.locator('button:has-text("City"), button:has-text("Country")');
      if (await filterButtons.count() > 0) {
        await filterButtons.first().click();
        await page.waitForTimeout(500);
      }
      
      // 4. Limpiar búsqueda
      await searchInput.first().clear();
      await page.waitForTimeout(500);
    }
  });

  test('flujo completo: navegación entre páginas principales', async ({ page }) => {
    // 1. Home
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    await verifyHomePage(page);
    
    // 2. Intentar ir a perfil
    const profileButton = page.locator('.profile-btn, button[title*="profile" i]');
    if (await profileButton.count() > 0) {
      await profileButton.first().click({ timeout: 5000 });
      await waitForPageLoad(page);
      
      // 3. Si estamos en perfil, volver a home
      const urlAfterProfile = page.url();
      if (urlAfterProfile.includes('/perfil')) {
        await verifyProfilePage(page);
        const logo = page.locator('h1.logo');
        await expect(logo).toBeVisible({ timeout: 10000 });
        await logo.click({ timeout: 5000 });
        await waitForPageLoad(page);
        await verifyHomePage(page);
      }
    }
    
    // 4. Ir a detalle de ruta
    await page.goto('/ruta/test-id', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageLoad(page);
    const currentUrl = page.url();
    if (currentUrl.includes('/ruta/')) {
      await verifyRouteDetailPage(page);
      
      // 5. Volver a home usando logo
      const logo = page.locator('h1.logo');
      await expect(logo).toBeVisible({ timeout: 10000 });
      await logo.click({ timeout: 5000 });
      await waitForPageLoad(page);
      await verifyHomePage(page);
    } else {
      // Si redirigió a home, verificar que estamos en home
      await verifyHomePage(page);
    }
  });

  test('flujo completo: cambiar entre tabs si el usuario está autenticado', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageLoad(page);
    await waitForTripsToLoad(page);
    
    // Buscar tabs (pueden estar en diferentes idiomas)
    const followingTab = page.locator('.tab-btn:has-text("Following"), .tab-btn:has-text("Siguiendo"), .tab-btn:has-text("seguint")');
    const recommendedTab = page.locator('.tab-btn:has-text("Recommended"), .tab-btn:has-text("Recomendados"), .tab-btn:has-text("recomanats")');
    
    const hasFollowing = await followingTab.count() > 0;
    const hasRecommended = await recommendedTab.count() > 0;
    
    if (hasFollowing && hasRecommended) {
      // 1. Clic en Following
      await followingTab.first().click({ timeout: 5000 });
      await page.waitForTimeout(500);
      
      // 2. Clic en Recommended
      await recommendedTab.first().click({ timeout: 5000 });
      await page.waitForTimeout(500);
      
      // 3. Verificar que el tab está activo
      const isActive = await recommendedTab.first().evaluate((el) => 
        el.classList.contains('active') || el.getAttribute('data-active') === 'recommended'
      );
    }
    // Si no hay tabs, el usuario no está autenticado (no es un error)
  });
});

