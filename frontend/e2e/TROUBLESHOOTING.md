# Troubleshooting Tests E2E

## Problemas Comunes y Soluciones

### 1. **Tests fallan porque no encuentran elementos**

**Problema**: Los tests buscan elementos que no existen o están ocultos.

**Causas**:
- Elementos solo aparecen si el usuario está autenticado/no autenticado
- Textos traducidos (español, catalán, inglés)
- Selectores incorrectos o elementos que cambiaron

**Solución**:
- Usar selectores por clase CSS en lugar de texto
- Verificar si el elemento existe antes de interactuar
- Usar funciones robustas que manejen múltiples selectores

**Ejemplo**:
```typescript
// ❌ Malo - busca texto específico
const button = page.locator('button:has-text("Iniciar sesión")');

// ✅ Bueno - busca por clase CSS
const button = page.locator('.header-btn.login');
```

### 2. **Tests fallan por timeouts**

**Problema**: Los tests fallan porque la página tarda en cargar.

**Causas**:
- La aplicación tarda en cargar datos de la API
- Animaciones o transiciones
- Carga lenta de recursos

**Solución**:
- Aumentar timeouts en funciones de espera
- Usar `waitForLoadState` con diferentes estados
- Esperar elementos específicos en lugar de tiempos fijos

**Ejemplo**:
```typescript
// ❌ Malo - timeout fijo corto
await page.waitForTimeout(500);

// ✅ Bueno - esperar estado específico
await page.waitForLoadState('networkidle', { timeout: 30000 });
```

### 3. **Tests fallan por textos traducidos**

**Problema**: Los tests buscan textos en un idioma pero la app está en otro.

**Causas**:
- La aplicación usa i18n (internacionalización)
- Los textos cambian según el idioma configurado

**Solución**:
- Usar selectores por clase CSS o data-testid
- Si es necesario buscar texto, usar múltiples variantes
- Preferir atributos HTML sobre texto visible

**Ejemplo**:
```typescript
// ❌ Malo - solo un idioma
const button = page.locator('button:has-text("Iniciar sesión")');

// ✅ Bueno - múltiples idiomas o clase CSS
const button = page.locator('.header-btn.login');
// O
const button = findElementRobust(page, [
  'button:has-text("Iniciar sesión")',
  'button:has-text("Iniciar sessió")',
  'button:has-text("Login")',
]);
```

### 4. **Tests fallan porque elementos son opcionales**

**Problema**: Los tests asumen que ciertos elementos siempre existen.

**Causas**:
- Elementos que solo aparecen en ciertos estados
- Funcionalidades condicionales

**Solución**:
- Verificar si el elemento existe antes de interactuar
- Usar funciones que no fallen si el elemento no existe
- Hacer tests opcionales para elementos condicionales

**Ejemplo**:
```typescript
// ❌ Malo - asume que siempre existe
await page.locator('.search-input').fill('test');

// ✅ Bueno - verifica primero
const searchInput = page.locator('.search-input');
if (await searchInput.count() > 0) {
  await searchInput.first().fill('test');
}
```

### 5. **Tests fallan por condiciones de carrera**

**Problema**: Los tests intentan interactuar antes de que la página esté lista.

**Causas**:
- JavaScript aún cargando
- Estado de la aplicación no inicializado
- Animaciones en progreso

**Solución**:
- Esperar estados específicos antes de interactuar
- Usar `waitForSelector` con estados apropiados
- Esperar eventos específicos

**Ejemplo**:
```typescript
// ❌ Malo - no espera
await page.goto('/');
await page.locator('.button').click();

// ✅ Bueno - espera estado
await page.goto('/');
await page.waitForLoadState('networkidle');
await page.waitForSelector('.button', { state: 'visible' });
await page.locator('.button').click();
```

## Mejores Prácticas

### 1. Usar selectores robustos
- Preferir clases CSS sobre texto
- Usar `data-testid` cuando sea posible
- Combinar múltiples selectores como fallback

### 2. Manejar elementos opcionales
- Verificar existencia antes de interactuar
- No fallar si elementos opcionales no existen
- Documentar qué elementos son opcionales

### 3. Timeouts apropiados
- Usar timeouts más largos para operaciones de red
- Esperar estados específicos en lugar de tiempos fijos
- Configurar timeouts globales apropiados

### 4. Tests independientes
- Cada test debe poder ejecutarse solo
- No depender del estado de otros tests
- Limpiar estado entre tests si es necesario

### 5. Manejo de errores
- Capturar y manejar errores esperados
- Proporcionar mensajes de error claros
- Usar try-catch para operaciones que pueden fallar

## Cómo Debuggear Tests que Fallan

1. **Ejecutar en modo headed**:
   ```bash
   npm run test:e2e:headed
   ```

2. **Ejecutar en modo debug**:
   ```bash
   npm run test:e2e:debug
   ```

3. **Ver screenshots de fallos**:
   - Los screenshots se guardan en `test-results/`
   - Revisar qué se ve cuando el test falla

4. **Ver traces**:
   ```bash
   npx playwright show-trace test-results/[test-name]/trace.zip
   ```

5. **Ejecutar un test específico**:
   ```bash
   npx playwright test home.spec.ts
   ```

6. **Aumentar timeouts temporalmente**:
   ```typescript
   test('mi test', async ({ page }) => {
     test.setTimeout(60000); // 60 segundos
     // ...
   });
   ```

## Selectores Recomendados

### Header
- Logo: `h1.logo`
- Botón login: `.header-btn.login`
- Botón registro: `.header-btn.register`
- Botón perfil: `.profile-btn`
- Botón logout: `.header-btn.logout`

### Modales
- Backdrop: `.modal-backdrop`
- Login card: `.login-card`
- Register card: `.register-card`
- Botón cerrar: `.close-btn-login`, `.close-btn-reg`

### Viajes
- Grid: `.masonry-grid`, `.masonry-container`
- Items: `.masonry-item`

### Formularios
- Inputs: `input[type="email"]`, `input[type="password"]`
- Botones submit: `button[type="submit"]`

## Ejemplo de Test Robusto

```typescript
import { test, expect } from '@playwright/test';
import { findLoginButton, waitForPageLoad } from './helpers/test-helpers-robust';

test('test robusto ejemplo', async ({ page }) => {
  // 1. Navegar y esperar carga
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForPageLoad(page);
  
  // 2. Buscar elemento de forma robusta
  const loginButton = await findLoginButton(page);
  
  // 3. Verificar existencia antes de interactuar
  if (loginButton) {
    await loginButton.click();
    await page.waitForTimeout(500);
    
    // 4. Verificar resultado
    const modal = page.locator('.modal-backdrop');
    await expect(modal).toBeVisible({ timeout: 5000 });
  } else {
    // 5. Manejar caso donde no existe (usuario ya autenticado)
    console.log('Login button not found - user may be authenticated');
  }
});
```

