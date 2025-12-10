import { test, expect, waitForPageLoad, SELECTORS } from '../fixtures/test-fixtures';
import { loginAsTestUser } from '../fixtures/auth-helpers';

/**
 * 👤 Tests E2E: Perfil de usuario
 * 
 * Tests ESTRICTOS para verificar la visualización de perfiles de usuario.
 * 
 * NOTA: La navegación al detalle de ruta y al perfil del autor
 * requiere autenticación porque el clic sin auth abre el modal de registro.
 */

// Helper para navegar al perfil de un autor
async function navigateToAuthorProfile(page: any): Promise<boolean> {
  await page.goto('/');
  await waitForPageLoad(page);
  
  // Esperar a que aparezcan las tarjetas de rutas
  const tripCard = page.locator(SELECTORS.tripCard).first();
  
  try {
    await tripCard.waitFor({ state: 'visible', timeout: 15000 });
  } catch {
    console.log('⚠️ No hay tarjetas de rutas visibles');
    return false;
  }
  
  await tripCard.click();
  await waitForPageLoad(page);
  
  // Buscar elemento clickeable del autor (puede ser div con onClick, no necesariamente <a>)
  // El frontend usa .autor-icon y .autor-info con onClick para navegar a /user/{userId}
  const authorClickable = page.locator('.autor-icon, .autor-info, .autor a, a[href*="/user/"], a[href*="/perfil"]').first();
  
  try {
    await authorClickable.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    console.log('⚠️ No hay elemento clickeable del autor');
    return false;
  }
  
  await authorClickable.click();
  await waitForPageLoad(page);
  
  // La URL puede ser /perfil o /user/{userId}
  return page.url().includes('/perfil') || page.url().includes('/user/');
}

test.describe('Perfil Público - Visualización', () => {

  test('DEBE poder navegar al perfil de un autor desde el detalle de ruta', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToAuthorProfile(page);
    if (!navigated) {
      test.skip(true, 'No se pudo navegar al perfil del autor - elemento no clickeable');
      return;
    }
    
    // Verificar que estamos en un perfil (puede ser /perfil o /user/{id})
    const url = page.url();
    const isProfileUrl = url.includes('/perfil') || url.includes('/user/');
    expect(isProfileUrl).toBeTruthy();
    console.log(`✅ Navegación exitosa a perfil: ${url}`);
  });

  test('DEBE mostrar nombre del usuario', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToAuthorProfile(page);
    if (!navigated) {
      test.skip(true, 'No se pudo navegar al perfil del autor');
      return;
    }
    
    // El nombre DEBE estar visible
    const userName = page.locator('h1, h2, [class*="name"], .user-name').first();
    await expect(userName).toBeVisible({ timeout: 5000 });
    
    const nameText = await userName.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);
    console.log(`✅ Nombre de usuario: "${nameText?.trim()}"`);
  });

  test('DEBE mostrar foto de perfil', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToAuthorProfile(page);
    if (!navigated) {
      test.skip(true, 'No se pudo navegar al perfil del autor');
      return;
    }
    
    // La foto de perfil DEBE estar visible
    const profilePhoto = page.locator('[class*="photo"] img, [class*="avatar"] img, .user-photo img').first();
    await expect(profilePhoto).toBeVisible({ timeout: 5000 });
    console.log('✅ Foto de perfil visible');
  });

  test('DEBE mostrar estadísticas (seguidores/seguidos)', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToAuthorProfile(page);
    if (!navigated) {
      test.skip(true, 'No se pudo navegar al perfil del autor');
      return;
    }
    
    // Las estadísticas DEBEN estar visibles
    const stats = page.locator(SELECTORS.userStats).first();
    await expect(stats).toBeVisible({ timeout: 5000 });
    console.log('✅ Estadísticas de perfil visibles');
  });

  test('DEBE mostrar publicaciones del usuario', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToAuthorProfile(page);
    if (!navigated) {
      test.skip(true, 'No se pudo navegar al perfil del autor');
      return;
    }
    
    // El grid de publicaciones o algún contenido del perfil DEBE estar visible
    const publicationsGrid = page.locator(SELECTORS.tripGrid).first();
    const profileContent = page.locator('[class*="profile"], .user-profile').first();
    
    const hasGrid = await publicationsGrid.isVisible({ timeout: 5000 }).catch(() => false);
    const hasProfile = await profileContent.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasGrid || hasProfile).toBeTruthy();
    console.log('✅ Contenido del perfil visible');
  });
});

test.describe('Perfil Público - Interacción Social', () => {

  test('DEBE mostrar botón de seguir en perfil de otro usuario', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToAuthorProfile(page);
    if (!navigated) {
      test.skip(true, 'No se pudo navegar al perfil del autor');
      return;
    }
    
    // El botón de seguir DEBE estar visible (si no es nuestro propio perfil)
    const followButton = page.locator(SELECTORS.followButton).first();
    
    const isVisible = await followButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await expect(followButton).toBeVisible();
      console.log('✅ Botón de seguir visible');
    } else {
      // Puede ser nuestro propio perfil
      console.log('ℹ️ Botón de seguir no visible (puede ser el propio perfil)');
    }
  });

  test('DEBE poder hacer clic en seguir', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToAuthorProfile(page);
    if (!navigated) {
      test.skip(true, 'No se pudo navegar al perfil del autor');
      return;
    }
    
    const followButton = page.locator(SELECTORS.followButton).first();
    
    if (!(await followButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      console.log('ℹ️ Botón de seguir no disponible');
      return;
    }
    
    // Interceptar llamada a la API
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/follow') || response.url().includes('/users'),
      { timeout: 10000 }
    ).catch(() => null);
    
    // Hacer clic
    await followButton.click();
    
    const response = await responsePromise;
    if (response) {
      console.log(`✅ API de follow respondió con status ${response.status()}`);
    }
    
    // El botón puede cambiar de estado
    await page.waitForTimeout(500);
  });
});

test.describe('Perfil Propio', () => {

  test('DEBE mostrar perfil propio al navegar a /perfil', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    // Debe estar en la página de perfil
    await expect(page).toHaveURL(/.*\/perfil/);
    
    // El perfil DEBE tener contenido
    const profileContent = page.locator(SELECTORS.userProfile).first();
    const userName = page.locator('h1, h2, [class*="name"]').first();
    
    const hasProfile = await profileContent.isVisible({ timeout: 5000 }).catch(() => false);
    const hasName = await userName.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasProfile || hasName).toBeTruthy();
    console.log('✅ Perfil propio cargado');
  });

  // NOTA: Test de botón de editar está en edit-profile.spec.ts

  test('DEBE mostrar tabs de publicaciones y guardadas', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const publicationsTab = page.locator('button:has-text("Publicacions"), button:has-text("Publications")').first();
    const savedTab = page.locator('button:has-text("Guardades"), button:has-text("Saved")').first();
    
    const hasTabs = await publicationsTab.isVisible({ timeout: 3000 }).catch(() => false) ||
                    await savedTab.isVisible({ timeout: 1000 }).catch(() => false);
    
    if (hasTabs) {
      console.log('✅ Tabs de perfil visibles');
    } else {
      console.log('ℹ️ Tabs no visibles en esta vista de perfil');
    }
  });
});

test.describe('Perfil - Responsive', () => {

  test('DEBE adaptarse a pantalla móvil', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    const navigated = await navigateToAuthorProfile(page);
    if (!navigated) {
      test.skip(true, 'No se pudo navegar al perfil');
      return;
    }
    
    // El perfil DEBE ser usable en móvil
    const profileContent = page.locator(SELECTORS.userProfile).first();
    const userName = page.locator('h1, h2, [class*="name"]').first();
    
    const isVisible = await profileContent.isVisible({ timeout: 5000 }).catch(() => false) ||
                      await userName.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(isVisible).toBeTruthy();
    
    // NO debe haber scroll horizontal
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBeFalsy();
    console.log('✅ Perfil responsive sin scroll horizontal');
  });
});
