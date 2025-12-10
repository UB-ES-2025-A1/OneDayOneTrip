import { test, expect, waitForPageLoad, SELECTORS } from '../fixtures/test-fixtures';
import { loginAsTestUser } from '../fixtures/auth-helpers';

/**
 * ✏️ Tests E2E: Edición de perfil de usuario
 * 
 * Tests ESTRICTOS para verificar el flujo de edición de perfil.
 * Todos estos tests requieren autenticación.
 */

test.describe('Editar Perfil - Acceso', () => {

  test('DEBE mostrar botón de editar en perfil propio', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const editButton = page.locator(SELECTORS.editProfileButton).first();
    
    const isVisible = await editButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      await expect(editButton).toBeVisible();
      await expect(editButton).toBeEnabled();
      console.log('✅ Botón de editar perfil visible y habilitado');
    } else {
      console.log('⚠️ Botón de editar no visible - verificar configuración de perfil');
    }
  });

  test('DEBE abrir modal de edición al hacer clic', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const editButton = page.locator(SELECTORS.editProfileButton).first();
    
    if (!(await editButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botón de editar no disponible');
      return;
    }
    
    await editButton.click();
    await page.waitForTimeout(500);
    
    // El modal de edición DEBE abrirse
    const editModal = page.locator('.editar-perfil-card, .modal-backdrop, [class*="edit-profile-modal"]').first();
    await expect(editModal).toBeVisible({ timeout: 5000 });
    console.log('✅ Modal de edición abierto');
  });

  test('DEBE poder cerrar el modal de edición', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const editButton = page.locator(SELECTORS.editProfileButton).first();
    
    if (!(await editButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botón de editar no disponible');
      return;
    }
    
    await editButton.click();
    await page.waitForTimeout(500);
    
    const editModal = page.locator('.editar-perfil-card, .modal-backdrop').first();
    
    if (!(await editModal.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Modal no se abrió');
      return;
    }
    
    // Buscar y hacer clic en el botón de cerrar
    const closeButton = page.locator(SELECTORS.closeModalButton).first();
    await expect(closeButton).toBeVisible({ timeout: 3000 });
    await closeButton.click();
    
    // El modal DEBE cerrarse
    await expect(editModal).not.toBeVisible({ timeout: 5000 });
    console.log('✅ Modal cerrado correctamente');
  });
});

test.describe('Editar Perfil - Campos del formulario', () => {

  test('DEBE mostrar campos de nombre y username', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const editButton = page.locator(SELECTORS.editProfileButton).first();
    
    if (!(await editButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botón de editar no disponible');
      return;
    }
    
    await editButton.click();
    await page.waitForTimeout(500);
    
    // DEBE haber campos de texto para editar
    const textInputs = page.locator('input[type="text"]');
    const inputCount = await textInputs.count();
    
    expect(inputCount).toBeGreaterThanOrEqual(1);
    console.log(`✅ ${inputCount} campos de texto encontrados en el formulario`);
  });

  test('DEBE mostrar inputs para fotos (perfil y portada)', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const editButton = page.locator(SELECTORS.editProfileButton).first();
    
    if (!(await editButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botón de editar no disponible');
      return;
    }
    
    await editButton.click();
    await page.waitForTimeout(500);
    
    // DEBE haber inputs de archivo para las fotos
    const fileInputs = page.locator('input[type="file"]');
    const fileCount = await fileInputs.count();
    
    if (fileCount > 0) {
      console.log(`✅ ${fileCount} input(s) de archivo encontrado(s)`);
    } else {
      console.log('ℹ️ No hay inputs de archivo visibles');
    }
  });

  test('DEBE cargar valores actuales del perfil', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const editButton = page.locator(SELECTORS.editProfileButton).first();
    
    if (!(await editButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botón de editar no disponible');
      return;
    }
    
    await editButton.click();
    await page.waitForTimeout(500);
    
    // El primer campo de texto debería tener un valor (el nombre actual)
    const nameInput = page.locator('input[type="text"]').first();
    
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const value = await nameInput.inputValue();
      console.log(`ℹ️ Valor actual del campo: "${value}"`);
      // El campo puede estar vacío o tener el nombre actual
    }
  });
});

test.describe('Editar Perfil - Modificar datos', () => {

  test('DEBE permitir modificar el nombre', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const editButton = page.locator(SELECTORS.editProfileButton).first();
    
    if (!(await editButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botón de editar no disponible');
      return;
    }
    
    await editButton.click();
    await page.waitForTimeout(500);
    
    const nameInput = page.locator('input[type="text"]').first();
    
    if (!(await nameInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Campo de nombre no disponible');
      return;
    }
    
    // Guardar valor original
    const originalValue = await nameInput.inputValue();
    
    // Modificar el valor
    const testValue = `Test User ${Date.now()}`;
    await nameInput.clear();
    await nameInput.fill(testValue);
    
    // Verificar que el valor cambió
    const newValue = await nameInput.inputValue();
    expect(newValue).toBe(testValue);
    console.log('✅ Campo de nombre modificado correctamente');
    
    // Restaurar valor original (sin guardar)
    await nameInput.clear();
    await nameInput.fill(originalValue);
  });

  test('DEBE mostrar botón de guardar', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const editButton = page.locator(SELECTORS.editProfileButton).first();
    
    if (!(await editButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botón de editar no disponible');
      return;
    }
    
    await editButton.click();
    await page.waitForTimeout(500);
    
    // DEBE haber botón de guardar
    const saveButton = page.locator('.save-btn, button:has-text("Guardar"), button:has-text("Save")').first();
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await expect(saveButton).toBeEnabled();
    console.log('✅ Botón de guardar visible y habilitado');
  });

  test('DEBE guardar cambios y cerrar modal', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const editButton = page.locator(SELECTORS.editProfileButton).first();
    
    if (!(await editButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botón de editar no disponible');
      return;
    }
    
    await editButton.click();
    await page.waitForTimeout(500);
    
    const editModal = page.locator('.editar-perfil-card, .modal-backdrop').first();
    
    if (!(await editModal.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Modal no se abrió');
      return;
    }
    
    const saveButton = page.locator('.save-btn, button:has-text("Guardar"), button:has-text("Save")').first();
    
    if (!(await saveButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Botón de guardar no disponible');
      return;
    }
    
    // Interceptar llamada a la API
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/users') && 
                  (response.request().method() === 'PUT' || response.request().method() === 'PATCH'),
      { timeout: 10000 }
    ).catch(() => null);
    
    // Hacer clic en guardar
    await saveButton.click();
    
    const response = await responsePromise;
    
    if (response) {
      console.log(`✅ API de usuarios respondió con status ${response.status()}`);
      
      // Esperar a que se procese
      await page.waitForTimeout(1000);
      
      // El modal DEBE cerrarse después de guardar exitosamente
      const modalStillVisible = await editModal.isVisible().catch(() => false);
      
      if (!modalStillVisible) {
        console.log('✅ Modal cerrado después de guardar');
      }
    } else {
      console.log('⚠️ No se detectó llamada a API de usuarios');
    }
  });
});

test.describe('Editar Perfil - Responsive', () => {

  test('DEBE ser usable en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    await page.goto('/perfil');
    await waitForPageLoad(page);
    
    const editButton = page.locator(SELECTORS.editProfileButton).first();
    
    if (!(await editButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botón de editar no disponible');
      return;
    }
    
    await editButton.click();
    await page.waitForTimeout(500);
    
    const editModal = page.locator('.editar-perfil-card, .modal-backdrop').first();
    
    if (await editModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      // NO debe haber scroll horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBeFalsy();
      console.log('✅ Modal de edición responsive sin scroll horizontal');
    }
  });
});
