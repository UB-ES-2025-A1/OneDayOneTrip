# 🎭 Tests E2E - OneDayOneTrip

Este directorio contiene los tests End-to-End (E2E) del proyecto, usando Playwright.

## 📋 Estructura

```
e2e/
├── fixtures/                      # Configuración y utilidades compartidas
│   ├── test-fixtures.ts           # Fixtures principales y selectores centralizados
│   ├── auth-helpers.ts            # Helpers de autenticación
│   └── seed-data.ts               # Datos de seed para tests
├── flows/                         # Tests organizados por flujo de usuario
│   ├── home-navigation.spec.ts    # Navegación en la home
│   ├── auth-flow.spec.ts          # Flujo de autenticación
│   ├── trip-detail.spec.ts        # Visualización de rutas
│   ├── user-profile.spec.ts       # Perfil de usuario
│   ├── comments.spec.ts           # Sistema de comentarios
│   ├── create-trip.spec.ts        # Crear publicaciones
│   ├── edit-profile.spec.ts       # Edición de perfil
│   ├── ratings.spec.ts            # Sistema de valoraciones
│   └── trips-with-data.spec.ts    # Tests con datos de seed
├── global-setup.ts                # Setup global (crea datos de prueba)
├── global-teardown.ts             # Teardown global (limpieza)
└── README.md
```

## 🧪 Filosofía de Tests

### Tests ESTRICTOS

Los tests están diseñados para **fallar** cuando la funcionalidad no funciona:

- ❌ **NO usamos**: `expect(count).toBeGreaterThanOrEqual(0)` (siempre pasa)
- ✅ **Usamos**: `expect(count).toBeGreaterThan(0)` (falla si no hay datos)

- ❌ **NO usamos**: `if (element.isVisible()) { test } else { pass }`
- ✅ **Usamos**: `await expect(element).toBeVisible()` (falla si no es visible)

### Selectores Centralizados

Todos los selectores están en `test-fixtures.ts`:

```typescript
import { SELECTORS } from '../fixtures/test-fixtures';

// Uso:
await page.locator(SELECTORS.loginButton).click();
await page.locator(SELECTORS.tripCard).first().click();
```

### Helpers Estrictos

```typescript
import { waitForTripsAPI, navigateToFirstTrip, assertElementVisible } from '../fixtures/test-fixtures';

// Esperar API y fallar si no hay datos
const tripCount = await waitForTripsAPI(page, true);

// Navegar al detalle (falla si no hay rutas)
await navigateToFirstTrip(page);

// Verificar elemento (falla si no existe)
await assertElementVisible(page, SELECTORS.tripCard, 'tarjeta de ruta');
```

## 🚀 Ejecutar Tests

### Prerrequisitos

1. **MongoDB corriendo** (via Docker):
   ```bash
   docker-compose -f docker-compose.e2e.yml up mongo-e2e -d
   ```

2. **Backend API corriendo**:
   ```bash
   cd api
   export MONGO_URI=mongodb://localhost:27018/OneDayOneTrip_E2E
   uvicorn app.main:app --port 8000
   ```

3. **Frontend corriendo**:
   ```bash
   cd frontend
   npm run dev
   ```

### Comandos

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Con UI de Playwright (recomendado para desarrollo)
npm run test:e2e:ui

# Con navegador visible
npm run test:e2e:headed

# Tests específicos
npx playwright test home-navigation
npx playwright test auth-flow

# Modo debug
npm run test:e2e:debug

# Ver último reporte
npx playwright show-report
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PLAYWRIGHT_BASE_URL` | URL del frontend | `http://localhost:5173` |
| `API_URL` / `VITE_API_URL` | URL del backend | `http://localhost:8000` |
| `MONGO_URI` | URI de MongoDB E2E | `mongodb://localhost:27018/OneDayOneTrip_E2E` |
| `E2E_TEST_EMAIL` | Email para tests con auth | `testuser@testuser.com` |
| `E2E_TEST_PASSWORD` | Password para tests con auth | `testuser` |
| `STRICT_E2E_SETUP` | Si true, falla si API no disponible | `false` (true en CI) |
| `CI` | Indica entorno CI | - |

### Modo Estricto

En CI (`CI=true`) o con `STRICT_E2E_SETUP=true`, el global-setup **falla** si:
- MongoDB no está disponible
- La API no responde
- No se pueden crear datos de seed

Esto evita ejecutar tests que van a fallar por falta de infraestructura.

## 📝 Escribir Nuevos Tests

### Estructura Recomendada

```typescript
import { test, expect, waitForPageLoad, SELECTORS } from '../fixtures/test-fixtures';

test.describe('Feature - Subflujo', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('DEBE hacer X cuando Y', async ({ page }) => {
    // Usar selectores centralizados
    const element = page.locator(SELECTORS.tripCard).first();
    
    // Aserciones ESTRICTAS
    await expect(element).toBeVisible({ timeout: 5000 });
    
    // Verificar resultado
    const text = await element.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });
});
```

### Buenas Prácticas

1. **Usar selectores de SELECTORS**:
   ```typescript
   // ✅ Bien
   page.locator(SELECTORS.loginButton)
   
   // ❌ Evitar selectores duplicados
   page.locator('.header-btn.login, button:has-text("Log in")')
   ```

2. **Esperar condiciones, no tiempos fijos**:
   ```typescript
   // ✅ Bien
   await page.waitForResponse(r => r.url().includes('/api'))
   
   // ❌ Evitar
   await page.waitForTimeout(5000)
   ```

3. **Tests independientes**: Cada test debe poder ejecutarse solo

4. **Usar test.skip para tests que requieren auth**:
   ```typescript
   const loggedIn = await loginAsTestUser(page);
   if (!loggedIn) {
     test.skip(true, 'Requiere autenticación Firebase real');
     return;
   }
   ```

## 🚨 Troubleshooting

### Tests fallan en CI pero pasan local

1. Verificar que `STRICT_E2E_SETUP=true` en CI
2. Verificar que el backend está corriendo antes de los tests
3. Revisar logs del global-setup

### "No hay rutas visibles"

1. Verificar que MongoDB tiene datos: `mongosh mongodb://localhost:27018/OneDayOneTrip_E2E`
2. Verificar que el seed se ejecutó: revisar logs del global-setup
3. Ejecutar manualmente el seed si es necesario

### Selector no encuentra elemento

1. Usar `npx playwright codegen` para generar selectores
2. Añadir el selector a `SELECTORS` en `test-fixtures.ts`
3. Preferir `data-testid` cuando sea posible

### Autenticación falla

1. Verificar credenciales en `.env`:
   ```
   E2E_TEST_EMAIL=testuser@testuser.com
   E2E_TEST_PASSWORD=testuser
   VITE_FIREBASE_API_KEY=...
   ```
2. Verificar que el usuario existe en Firebase
3. Verificar que el usuario existe en MongoDB

## 📊 CI/CD

Los tests E2E se ejecutan automáticamente en:
- Pull Requests a `main`/`develop`
- Push a `main`/`develop`

Ver `.github/workflows/e2e-tests.yml` para detalles.

Los resultados se publican como:
- Comentario en el PR
- Artefactos descargables (playwright-report)
