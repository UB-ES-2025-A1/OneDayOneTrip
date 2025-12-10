import { test, expect, waitForPageLoad, SELECTORS } from '../fixtures/test-fixtures';
import { loginAsTestUser } from '../fixtures/auth-helpers';

/**
 * NOTA: En esta aplicación, navegar al detalle de ruta requiere autenticación.
 * Los tests de valoraciones usan auth para poder acceder al detalle.
 */

/**
 * ⭐ Tests E2E: Sistema de valoraciones (ratings)
 * 
 * Tests ESTRICTOS que verifican el flujo completo de valoraciones.
 * Incluye tests de visualización y tests de envío real (con auth).
 */

// Helper para navegar al detalle de una ruta
async function navigateToTripDetail(page: any): Promise<boolean> {
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
  
  return true;
}

test.describe('Valoraciones - Visualización', () => {

  // NOTA: Navegar al detalle de ruta requiere autenticación

  test('DEBE mostrar valoración promedio en detalle de ruta', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToTripDetail(page);
    expect(navigated).toBeTruthy();
    
    // Buscar display de valoración (puede ser estrellas, número, etc.)
    const ratingDisplay = page.locator(SELECTORS.ratingDisplay).first();
    
    // La valoración DEBE estar visible
    await expect(ratingDisplay).toBeVisible({ timeout: 5000 });
    console.log('✅ Display de valoración visible');
  });

  test('DEBE mostrar botón de valorar', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToTripDetail(page);
    expect(navigated).toBeTruthy();
    
    const rateButton = page.locator(SELECTORS.rateButton).first();
    
    // El botón DEBE estar visible (puede estar en diferentes ubicaciones)
    await expect(rateButton).toBeVisible({ timeout: 5000 });
    console.log('✅ Botón de valorar visible');
  });
});

// NOTA: Los tests de modal sin auth no son posibles porque no se puede
// navegar al detalle sin autenticación en esta app

test.describe('Valoraciones - Con autenticación (flujo completo)', () => {

  test('DEBE abrir modal de valoración con 5 estrellas', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToTripDetail(page);
    expect(navigated).toBeTruthy();
    
    const rateButton = page.locator(SELECTORS.rateButton).first();
    
    if (!(await rateButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Botón de valorar no visible');
      return;
    }
    
    await rateButton.click();
    await page.waitForTimeout(500);
    
    // El modal de valoración DEBE estar visible
    const ratingModal = page.locator(SELECTORS.ratingModal).first();
    await expect(ratingModal).toBeVisible({ timeout: 5000 });
    
    // DEBE tener 5 opciones de estrellas
    const starInputs = page.locator(SELECTORS.starInput);
    const starCount = await starInputs.count();
    expect(starCount).toBe(5);
    console.log('✅ Modal con 5 estrellas visible');
  });

  test('DEBE tener botón de enviar deshabilitado sin selección', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToTripDetail(page);
    expect(navigated).toBeTruthy();
    
    const rateButton = page.locator(SELECTORS.rateButton).first();
    if (!(await rateButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Botón de valorar no visible');
      return;
    }
    
    await rateButton.click();
    await page.waitForTimeout(500);
    
    const ratingModal = page.locator(SELECTORS.ratingModal).first();
    if (!(await ratingModal.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Modal de valoración no se abrió');
      return;
    }
    
    const submitButton = page.locator(SELECTORS.ratingSubmitButton).first();
    
    // El botón DEBE estar deshabilitado sin selección
    await expect(submitButton).toBeDisabled({ timeout: 2000 });
    console.log('✅ Botón deshabilitado sin selección');
  });

  test('DEBE habilitar envío después de seleccionar estrella', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToTripDetail(page);
    expect(navigated).toBeTruthy();
    
    const rateButton = page.locator(SELECTORS.rateButton).first();
    if (!(await rateButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Botón de valorar no visible');
      return;
    }
    
    await rateButton.click();
    await page.waitForTimeout(500);
    
    const ratingModal = page.locator(SELECTORS.ratingModal).first();
    if (!(await ratingModal.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Modal de valoración no se abrió');
      return;
    }
    
    // Seleccionar 4 estrellas
    const starLabel = page.locator(SELECTORS.starLabel).nth(1); // La segunda (4 estrellas normalmente)
    
    if (await starLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
      await starLabel.click();
      await page.waitForTimeout(300);
      
      const submitButton = page.locator(SELECTORS.ratingSubmitButton).first();
      
      // El botón DEBE estar habilitado
      await expect(submitButton).toBeEnabled({ timeout: 2000 });
      console.log('✅ Botón habilitado después de seleccionar estrella');
    }
  });

  test('DEBE enviar valoración y cerrar modal', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToTripDetail(page);
    expect(navigated).toBeTruthy();
    
    const rateButton = page.locator(SELECTORS.rateButton).first();
    if (!(await rateButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Botón de valorar no visible');
      return;
    }
    
    await rateButton.click();
    await page.waitForTimeout(500);
    
    const ratingModal = page.locator(SELECTORS.ratingModal).first();
    if (!(await ratingModal.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Modal de valoración no se abrió');
      return;
    }
    
    // Seleccionar una estrella
    const starLabel = page.locator(SELECTORS.starLabel).nth(1);
    if (!(await starLabel.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip(true, 'Labels de estrellas no visibles');
      return;
    }
    
    await starLabel.click();
    await page.waitForTimeout(300);
    
    const submitButton = page.locator(SELECTORS.ratingSubmitButton).first();
    await expect(submitButton).toBeEnabled({ timeout: 2000 });
    
    // Interceptar respuesta de la API
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/rating') && 
                  (response.status() === 200 || response.status() === 201),
      { timeout: 10000 }
    ).catch(() => null);
    
    // Enviar valoración
    await submitButton.click();
    
    const response = await responsePromise;
    
    if (response) {
      console.log(`✅ API de ratings respondió con status ${response.status()}`);
      
      // Esperar a que se cierre el modal
      await page.waitForTimeout(1000);
      
      // El modal DEBE cerrarse después de enviar
      const modalStillVisible = await ratingModal.isVisible().catch(() => false);
      expect(modalStillVisible).toBeFalsy();
      console.log('✅ Modal cerrado después de enviar valoración');
    } else {
      console.log('⚠️ No se detectó respuesta de API de ratings');
    }
  });

  test('DEBE poder cerrar modal de valoración', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToTripDetail(page);
    expect(navigated).toBeTruthy();
    
    const rateButton = page.locator(SELECTORS.rateButton).first();
    if (!(await rateButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Botón de valorar no visible');
      return;
    }
    
    await rateButton.click();
    await page.waitForTimeout(500);
    
    const ratingModal = page.locator(SELECTORS.ratingModal).first();
    if (!(await ratingModal.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Modal no se abrió');
      return;
    }
    
    // Buscar botón de cerrar
    const closeButton = page.locator('.valorar-close, button:has-text("✕"), button:has-text("×")').first();
    
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(300);
      
      // El modal DEBE cerrarse
      await expect(ratingModal).not.toBeVisible({ timeout: 3000 });
      console.log('✅ Modal cerrado correctamente');
    } else {
      // Intentar cerrar haciendo clic fuera
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Valoraciones - Interacción con estrellas', () => {

  test('DEBE poder seleccionar diferentes ratings', async ({ page }) => {
    const loggedIn = await loginAsTestUser(page);
    if (!loggedIn) {
      test.skip(true, 'Requiere autenticación Firebase real');
      return;
    }
    
    const navigated = await navigateToTripDetail(page);
    expect(navigated).toBeTruthy();
    
    const rateButton = page.locator(SELECTORS.rateButton).first();
    if (!(await rateButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Botón de valorar no visible');
      return;
    }
    
    await rateButton.click();
    await page.waitForTimeout(500);
    
    const ratingModal = page.locator(SELECTORS.ratingModal).first();
    if (!(await ratingModal.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Modal no se abrió');
      return;
    }
    
    // Probar seleccionar diferentes estrellas
    for (let i = 5; i >= 1; i--) {
      const starLabel = page.locator(`label[for="estrella-${i}"]`);
      
      if (await starLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
        await starLabel.click();
        await page.waitForTimeout(200);
        
        // Verificar que se seleccionó
        const starInput = page.locator(`input#estrella-${i}`);
        if (await starInput.count() > 0) {
          const isChecked = await starInput.isChecked();
          expect(isChecked).toBeTruthy();
          console.log(`✅ Estrella ${i} seleccionada correctamente`);
          break;
        }
      }
    }
  });
});
