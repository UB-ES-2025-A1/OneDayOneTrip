# 🎭 Tests E2E - OneDayOneTrip

Este directorio contiene los tests End-to-End (E2E) del proyecto, usando Playwright.

## 📋 Estructura

```
e2e/
├── fixtures/                      # Configuración y utilidades compartidas
│   ├── test-fixtures.ts           # Fixtures principales
│   └── auth-helpers.ts            # Helpers de autenticación
├── flows/                         # Tests organizados por flujo de usuario
│   ├── home-navigation.spec.ts    # Navegación en la home (~15 tests)
│   ├── auth-flow.spec.ts          # Flujo de autenticación (~15 tests)
│   ├── trip-detail.spec.ts        # Visualización de rutas (~15 tests)
│   ├── user-profile.spec.ts       # Perfil de usuario (~12 tests)
│   ├── comments.spec.ts           # Sistema de comentarios (~15 tests)
│   ├── create-trip.spec.ts        # Crear publicaciones (~20 tests)
│   ├── edit-profile.spec.ts       # Edición de perfil (~18 tests)
│   └── ratings.spec.ts            # Sistema de valoraciones (~12 tests)
└── README.md
```

## 🧪 Tests disponibles

| Archivo | Flujos que testea |
|---------|-------------------|
| `home-navigation.spec.ts` | Carga de home, carrusel, lista de rutas, modales |
| `auth-flow.spec.ts` | Login, registro, validaciones, reset password |
| `trip-detail.spec.ts` | Ver detalle de ruta, mapa, etapas, galería |
| `user-profile.spec.ts` | Ver perfil, estadísticas, seguidores |
| `comments.spec.ts` | Ver y escribir comentarios, validaciones |
| `create-trip.spec.ts` | Wizard de 3 pasos para crear rutas |
| `edit-profile.spec.ts` | Editar nombre, username, fotos |
| `ratings.spec.ts` | Sistema de estrellas, valorar rutas |

## 🚀 Ejecutar Tests Localmente

### Prerrequisitos

1. **MongoDB corriendo** (via Docker):
   ```bash
   # Desde la raíz del proyecto
   docker-compose -f docker-compose.e2e.yml up mongo-e2e -d
   ```

2. **Backend API corriendo**:
   ```bash
   cd api
   # Configurar variables de entorno
   export MONGO_URI=mongodb://localhost:27018/OneDayOneTrip_E2E
   uvicorn app.main:app --port 8000
   ```

3. **Frontend corriendo**:
   ```bash
   cd frontend
   npm run dev
   ```

### Comandos de Tests

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar con UI de Playwright (recomendado para desarrollo)
npm run test:e2e:ui

# Ejecutar con navegador visible
npm run test:e2e:headed

# Ejecutar tests específicos
npx playwright test home-navigation

# Modo debug
npm run test:e2e:debug

# Ver último reporte
npx playwright show-report
```

## 🐳 Ejecutar con Docker (Entorno completo)

```bash
# Levantar todo el entorno E2E
docker-compose -f docker-compose.e2e.yml up -d

# Ejecutar tests
npm run test:e2e

# Limpiar
docker-compose -f docker-compose.e2e.yml down -v
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PLAYWRIGHT_BASE_URL` | URL del frontend | `http://localhost:5173` |
| `API_URL` / `VITE_API_URL` | URL del backend | `http://localhost:8000` |
| `E2E_AUTH_TOKEN` | (Opcional) Bearer para seed de usuario | - |
| `CI` | Indica entorno CI | - |

### playwright.config.ts

La configuración principal incluye:
- Timeouts extendidos para entornos lentos
- Screenshots y traces en fallos
- Retry automático en CI
- Viewport consistente para reproducibilidad

## 📝 Escribir Nuevos Tests

### Estructura Recomendada

```typescript
import { test, expect, waitForPageLoad } from '../fixtures/test-fixtures';

test.describe('Feature - Subflujo', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup común
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('debería hacer X cuando Y', async ({ page }) => {
    // Arrange
    // ...
    
    // Act
    // ...
    
    // Assert
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### Buenas Prácticas

1. **Usar selectores resilientes**:
   - ✅ `page.getByRole('button', { name: /enviar/i })`
   - ✅ `page.locator('[data-testid="submit-btn"]')`
   - ❌ `page.locator('.btn-primary-v2')`

2. **Esperar condiciones, no tiempos fijos**:
   - ✅ `await page.waitForResponse(r => r.url().includes('/api'))`
   - ❌ `await page.waitForTimeout(5000)`

3. **Tests independientes**: Cada test debe poder ejecutarse solo

4. **Datos de prueba aislados**: Usar fixtures para datos consistentes

## 🚨 Troubleshooting

### Tests fallan en CI pero pasan local

1. Verificar timeouts (CI es más lento)
2. Verificar que el servidor está listo antes de los tests
3. Revisar diferencias de viewport

### Selector no encuentra elemento

1. Usar `npx playwright codegen` para generar selectores
2. Verificar que el elemento existe con DevTools
3. Añadir waits explícitos si es contenido dinámico

### MongoDB no conecta

1. Verificar que el contenedor está corriendo: `docker ps`
2. Verificar puerto: `docker-compose -f docker-compose.e2e.yml logs mongo-e2e`
3. Probar conexión manual: `mongosh mongodb://localhost:27018`

## 📊 CI/CD

Los tests E2E se ejecutan automáticamente en:
- Pull Requests a `main`/`develop`
- Push a `main`/`develop`

Ver `.github/workflows/e2e-tests.yml` para detalles.

Los resultados se publican como:
- Comentario en el PR
- Artefactos descargables (playwright-report)

