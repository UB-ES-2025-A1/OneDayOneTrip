# Tests E2E con Playwright

Este directorio contiene los tests end-to-end (e2e) de la aplicación OneDayOneTrip usando Playwright.

## Estructura

```
e2e/
├── helpers/
│   └── test-helpers.ts           # Funciones auxiliares para los tests
├── home.spec.ts                  # Tests de la página principal
├── navigation.spec.ts             # Tests básicos de navegación
├── navigation-complete.spec.ts   # Tests exhaustivos de navegación
├── buttons-interactions.spec.ts  # Tests de interacciones con botones
├── forms-validation.spec.ts      # Tests de validación de formularios
├── search-filters.spec.ts        # Tests de búsqueda y filtros
├── trips-interactions.spec.ts    # Tests de interacciones con viajes
├── trip-detail.spec.ts           # Tests básicos de detalle de ruta
├── trip-detail-complete.spec.ts  # Tests exhaustivos de detalle de ruta
├── user-profile.spec.ts          # Tests de perfil de usuario
├── user-flows.spec.ts            # Tests de flujos completos de usuario
├── auth.spec.ts                  # Tests de autenticación
└── README.md                     # Este archivo
```

## Cobertura de Tests

Los tests e2e cubren exhaustivamente:

### ✅ Navegación
- Navegación entre todas las páginas
- Uso del historial del navegador
- Redirecciones
- Rutas con parámetros
- Persistencia del estado

### ✅ Botones e Interacciones
- Todos los botones del header (login, registro, perfil, logout)
- Botón de logo
- Botón de volver
- Botones de tabs (following/recommended)
- Botones de acción en viajes
- Botones de modales

### ✅ Formularios
- Validación de campos requeridos
- Validación de formato de email
- Validación de coincidencia de contraseñas
- Mensajes de error
- Cambio entre modales (login/registro)

### ✅ Búsqueda y Filtros
- Campo de búsqueda
- Filtros (All, User, Country, City, Monument)
- Combinación de búsqueda y filtros
- Limpieza de búsqueda
- Resultados vacíos

### ✅ Viajes
- Visualización de viajes en grid
- Clic en viajes para ver detalle
- Información mostrada en cards (rating, ubicación, autor)
- Navegación entre múltiples viajes

### ✅ Detalle de Ruta
- Carga de página de detalle
- Información del viaje
- Imágenes
- Botones de acción (guardar, seguir, valorar)
- Sección de comentarios
- Información del autor
- Lista de etapas

### ✅ Perfil de Usuario
- Navegación al perfil
- Información del usuario
- Viajes del usuario
- Tabs/secciones
- Botones de edición y creación

### ✅ Flujos Completos
- Flujo de exploración sin autenticación
- Flujo de registro (parcial)
- Flujo de exploración de viajes
- Flujo de búsqueda y filtrado
- Flujo de navegación entre páginas
- Flujo de cambio de tabs

## Requisitos Previos

1. Asegúrate de tener instaladas las dependencias:
   ```bash
   npm install
   ```

2. Instala los navegadores de Playwright:
   ```bash
   npx playwright install chromium
   ```

## Ejecutar Tests

### Opción 1: Con servidor automático (recomendado)
Playwright iniciará el servidor automáticamente:
```bash
npm run test:e2e
```

### Opción 2: Con servidor manual (más rápido)
Si el servidor ya está corriendo en otra terminal:
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Ejecutar tests
npm run test:e2e
```

### Ejecutar tests en modo UI (interactivo)
```bash
npm run test:e2e:ui
```

### Ejecutar tests en modo headed (con navegador visible)
```bash
npm run test:e2e:headed
```

### Ejecutar tests en modo debug
```bash
npm run test:e2e:debug
```

### Ejecutar un test específico
```bash
npx playwright test home.spec.ts
```

### Ver reporte HTML
```bash
npx playwright show-report
```

## Configuración

La configuración de Playwright se encuentra en `playwright.config.ts` en la raíz del proyecto frontend.

### Características de la configuración:

- **Base URL**: `http://localhost:5173` (servidor de desarrollo de Vite)
- **Web Server**: Se inicia automáticamente antes de ejecutar los tests
- **Navegador**: Chromium (configurable)
- **Screenshots**: Solo en fallos
- **Traces**: Solo en reintentos

## Escribir Nuevos Tests

1. Crea un nuevo archivo `*.spec.ts` en el directorio `e2e/`
2. Importa las funciones necesarias de `@playwright/test`
3. Usa los helpers de `helpers/test-helpers.ts` cuando sea posible
4. Sigue la estructura de los tests existentes

### Ejemplo:

```typescript
import { test, expect } from '@playwright/test';
import { verifyHomePage } from './helpers/test-helpers';

test.describe('Mi Nueva Funcionalidad', () => {
  test('debería hacer algo', async ({ page }) => {
    await page.goto('/');
    await verifyHomePage(page);
    // ... más código del test
  });
});
```

## Notas

- Los tests asumen que el servidor de desarrollo está corriendo en `http://localhost:5173`
- Si necesitas cambiar la URL base, modifica `baseURL` en `playwright.config.ts`
- Los tests pueden fallar si la API backend no está disponible o si hay cambios en la estructura de la UI

