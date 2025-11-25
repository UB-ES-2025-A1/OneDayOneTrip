# 📊 Test Coverage Documentation

Documentación completa del estado de pruebas en OneDayOneTrip. Última actualización: Sprint 2.

---

## 📈 Resumen Ejecutivo

| Categoría | Cobertura | Estado |
|-----------|-----------|--------|
| **Backend Overall** | **85%** | ✅ Excelente |
| **Frontend Overall** | **36.77%** | ⚠️ En progreso |
| **Total Tests** | **77 tests** | ✅ |
| **Backend Tests** | 57 tests | ✅ |
| **Frontend Tests** | 20 tests | ✅ |

---

## 🔧 Backend Tests

### Routers (API Endpoints)

| Router | Cobertura | Test File | Estado | Tests Implementados |
|--------|-----------|-----------|--------|---------------------|
| **ratings.py** | **100%** | `test_ratings_endpoints.py`<br>`test_ratings_service.py` | ✅ Completo | - POST `/ratings/trip/{trip_id}`<br>- Rating stats calculation<br>- Upsert rating logic |
| **users.py** | **98%** | `test_users_endpoints.py`<br>`test_security_users.py` | ✅ Casi completo | - POST `/users/register`<br>- GET `/users/`<br>- GET `/users/me`<br>- GET `/users/{user_id}`<br>- PATCH `/users/update/{user_id}`<br>- POST `/users/follow/{user_id}/{target_id}`<br>- POST `/users/unfollow/{user_id}/{target_id}`<br>- Security: no self-follow, UID validation |
| **comments.py** | **89%** | `test_comments_endpoints.py` | ✅ Bueno | - POST `/trips/{trip_id}/comments`<br>- GET `/trips/{trip_id}/comments`<br>- Invalid ObjectId handling |
| **trips.py** | **84%** | `test_trips_endpoints.py`<br>`test_geo_utils.py` | ✅ Bueno | - GET `/trips/`<br>- GET `/trips/{trip_id}`<br>- POST `/trips/` (multipart)<br>- POST `/trips/{trip_id}/rating`<br>- POST `/trips/{trip_id}/comment`<br>- Geocoding (`get_location_name`) |
| **images.py** | **50%** | `test_image_service.py` | ⚠️ Parcial | - Image upload to ImgBB<br>- Missing: error handling in router |

### Services

| Service | Cobertura | Test File | Estado | Tests Implementados |
|--------|-----------|-----------|--------|---------------------|
| **mongo_service.py** | **79%** | `test_mongo_service.py` | ✅ Bueno | - `save_trip()`<br>- `get_all_trips()`<br>- `get_trip_by_id()` (valid/invalid/not found)<br>- `get_trip_rating_stats()` (with/without ratings, exceptions)<br>- `upsert_rating()` (success/exception)<br>- `list_comments()` (success/empty/pagination/exceptions) |
| **image_service.py** | **86%** | `test_image_service.py` | ✅ Bueno | - `upload_image_to_imgbb()` (with/without API key)<br>- Mock URL generation |
| **firebase_service.py** | **59%** | ❌ Sin tests | ⚠️ Necesita tests | - Inicialización de Firestore<br>- Mock fallback |

### Auth

| Module | Cobertura | Test File | Estado | Tests Implementados |
|--------|-----------|-----------|--------|---------------------|
| **verify_token.py** | **33%** | ❌ Sin tests | ⚠️ Necesita tests | - Verificación de token JWT<br>- Manejo de errores |

### Models

| Model | Cobertura | Test File | Estado |
|-------|-----------|-----------|--------|
| **trip_model.py** | **100%** | Indirecto (via endpoints) | ✅ |
| **trip_create_in.py** | **100%** | Indirecto (via endpoints) | ✅ |
| **comment_model.py** | **100%** | Indirecto (via endpoints) | ✅ |
| **rating_model.py** | **100%** | Indirecto (via endpoints) | ✅ |

### Main & Utilities

| Module | Cobertura | Test File | Estado |
|--------|-----------|-----------|--------|
| **main.py** | **100%** | `test_smoke_api.py` | ✅ |
| **test_smoke_api.py** | N/A | Smoke tests | ✅ |

---

## 🎨 Frontend Tests

### Components

| Component | Cobertura | Test File | Estado | Tests Implementados |
|-----------|-----------|-----------|--------|---------------------|
| **Valorar.tsx** | **100%** | `Valorar.test.tsx` | ✅ Completo | - Rating selection<br>- Submit handler<br>- Disabled state |
| **Comments.tsx** | **88.42%** | `Comments.test.tsx` | ✅ Bueno | - Load and display comments<br>- Submit comment<br>- Text trimming<br>- Comment ordering |
| **CreateTripForm.tsx** | **90.39%** | `CreateTripForm.test.tsx` | ✅ Bueno | - Form submission with all fields<br>- Error handling<br>- Map selector integration |
| **LoginModal.tsx** | **84.82%** | `LoginModel.test.tsx` | ✅ Bueno | - Form rendering<br>- Login with credentials<br>- Validation (empty fields) |
| **RegisterModal.tsx** | **93.03%** | `RegisterModel.test.tsx` | ✅ Bueno | - Form rendering<br>- Registration with data<br>- Validation |
| **ImageCarousel.tsx** | **83.87%** | `ImageCarrousel.test.tsx` | ✅ Bueno | - Image rendering<br>- Navigation |
| **Carousel.tsx** | **87.5%** | Indirecto (via Home) | ✅ Bueno | - Carousel functionality |
| **Footer.tsx** | **100%** | Indirecto | ✅ | - Footer rendering |
| **Layout.tsx** | **100%** | Indirecto | ✅ | - Layout structure |
| **Header.tsx** | **66.66%** | ❌ Sin tests directos | ⚠️ Parcial | - Header rendering (via Home) |
| **MapSelector.tsx** | **0%** | ❌ Sin tests | ❌ Sin tests | - Map interaction<br>- Coordinate selection |
| **MasonryGrid.tsx** | **0.92%** | ❌ Sin tests | ❌ Sin tests | - Grid layout<br>- Trip cards rendering |
| **AnimatedText1.tsx** | **0%** | ❌ Sin tests | ❌ Sin tests | - Text animations |
| **AuthLayout.tsx** | **0%** | ❌ Sin tests | ❌ Sin tests | - Auth layout wrapper |
| **ButtonNewTrip.tsx** | **10%** | ❌ Sin tests | ❌ Sin tests | - Button click handler |
| **EditarPerfilModal.tsx** | **0%** | ❌ Sin tests | ❌ Sin tests | - Profile editing form |
| **EtapesList.tsx** | **0%** | ❌ Sin tests | ❌ Sin tests | - Trip points list |
| **LlistaSeguidorsModal.tsx** | **0%** | ❌ Sin tests | ❌ Sin tests | - Followers list |
| **LlistaSeguitsModal.tsx** | **0%** | ❌ Sin tests | ❌ Sin tests | - Following list |
| **ResetPasswordModal.tsx** | **1.53%** | ❌ Sin tests | ❌ Sin tests | - Password reset form |

### Pages

| Page | Cobertura | Test File | Estado | Tests Implementados |
|------|-----------|-----------|--------|---------------------|
| **Home.tsx** | **47.32%** | `Home.test.tsx`<br>`SmokeApp.test.tsx` | ⚠️ Parcial | - Basic rendering<br>- Title display<br>- Hero section |
| **RutaDetall.tsx** | **0%** | ❌ Sin tests | ❌ Sin tests | - Trip detail view<br>- Comments integration<br>- Rating display |
| **UserProfile.tsx** | **0%** | ❌ Sin tests | ❌ Sin tests | - User profile view<br>- Edit profile<br>- User trips list |
| **UserProfilePublic.tsx** | **0%** | ❌ Sin tests | ❌ Sin tests | - Public profile view<br>- Follow/unfollow |

### API & Utilities

| Module | Cobertura | Test File | Estado | Tests Implementados |
|--------|-----------|-----------|--------|---------------------|
| **api/client.ts** | **63.63%** | `apiClient.test.ts` | ✅ Bueno | - Token attachment<br>- GET/POST requests<br>- `followUser` helper |
| **api/trips.ts** | **24.29%** | `rateTrip.test.ts` | ⚠️ Parcial | - `rateTrip()` function<br>- Missing: `getAllTrips()`, `getTripById()`, `createTripMultipart()`, etc. |
| **firebase/auth.ts** | **31.42%** | Indirecto (via LoginModal) | ⚠️ Parcial | - Auth functions (via mocks) |
| **firebase/config.ts** | **100%** | Indirecto | ✅ | - Firebase config |
| **firebase/firestore.ts** | **0%** | ❌ Sin tests | ❌ Sin tests | - Firestore operations |

---

## ❌ Componentes Sin Tests

### Backend - Prioridad Alta

1. **`api/app/auth/verify_token.py`** (33% coverage)
   - **Falta**: Tests para verificación de token JWT
   - **Impacto**: Alto (seguridad)
   - **Test file sugerido**: `tests/test_auth_verify_token.py`

2. **`api/app/routers/images.py`** (50% coverage)
   - **Falta**: Tests para error handling en upload
   - **Impacto**: Medio
   - **Test file sugerido**: Extender `tests/test_image_service.py`

3. **`api/app/services/firebase_service.py`** (59% coverage)
   - **Falta**: Tests para inicialización y fallback
   - **Impacto**: Medio
   - **Test file sugerido**: `tests/test_firebase_service.py`

### Frontend - Prioridad Alta

1. **`RutaDetall.tsx`** (0% coverage)
   - **Falta**: Tests para vista de detalle de ruta
   - **Impacto**: Alto (página principal)
   - **Test file sugerido**: `src/__tests__/RutaDetall.test.tsx`

2. **`UserProfile.tsx`** (0% coverage)
   - **Falta**: Tests para perfil de usuario
   - **Impacto**: Alto (funcionalidad core)
   - **Test file sugerido**: `src/__tests__/UserProfile.test.tsx`

3. **`UserProfilePublic.tsx`** (0% coverage)
   - **Falta**: Tests para perfil público
   - **Impacto**: Medio
   - **Test file sugerido**: `src/__tests__/UserProfilePublic.test.tsx`

### Frontend - Prioridad Media

4. **`MapSelector.tsx`** (0% coverage)
   - **Falta**: Tests para selector de mapa
   - **Impacto**: Medio (usado en CreateTripForm)
   - **Test file sugerido**: `src/__tests__/MapSelector.test.tsx`

5. **`MasonryGrid.tsx`** (0.92% coverage)
   - **Falta**: Tests para grid de trips
   - **Impacto**: Medio (visualización principal)
   - **Test file sugerido**: `src/__tests__/MasonryGrid.test.tsx`

6. **`api/trips.ts`** (24.29% coverage)
   - **Falta**: Tests para `getAllTrips()`, `getTripById()`, `createTripMultipart()`, `getTripComments()`, `createTripComment()`
   - **Impacto**: Alto (API client)
   - **Test file sugerido**: Extender `src/__tests__/trips.test.ts`

### Frontend - Prioridad Baja

7. **`EditarPerfilModal.tsx`** (0% coverage)
8. **`ResetPasswordModal.tsx`** (1.53% coverage)
9. **`LlistaSeguidorsModal.tsx`** (0% coverage)
10. **`LlistaSeguitsModal.tsx`** (0% coverage)
11. **`EtapesList.tsx`** (0% coverage)
12. **`AnimatedText1.tsx`** (0% coverage)
13. **`AuthLayout.tsx`** (0% coverage)
14. **`ButtonNewTrip.tsx`** (10% coverage)
15. **`firebase/firestore.ts`** (0% coverage)

---

## 📋 Test Files Existentes

### Backend (`tests/`)

| Test File | Tests | Cobertura | Estado |
|-----------|-------|-----------|--------|
| `test_comments_endpoints.py` | 3 | Comments router | ✅ |
| `test_geo_utils.py` | 2 | Geocoding utilities | ✅ |
| `test_image_service.py` | 2 | Image upload service | ✅ |
| `test_mongo_service.py` | 16 | MongoDB operations | ✅ |
| `test_ratings_endpoints.py` | 2 | Ratings router | ✅ |
| `test_ratings_service.py` | 2 | Rating calculations | ✅ |
| `test_security_users.py` | 2 | User security validations | ✅ |
| `test_smoke_api.py` | 3 | Smoke tests (API health) | ✅ |
| `test_trips_endpoints.py` | 6 | Trips router | ✅ |
| `test_users_endpoints.py` | 18 | Users router | ✅ |
| `conftest.py` | Fixtures | Test configuration | ✅ |

**Total Backend Tests**: 57 tests

### Frontend (`frontend/src/__tests__/`)

| Test File | Tests | Cobertura | Estado |
|-----------|-------|-----------|--------|
| `apiClient.test.ts` | 3 | API client helpers | ✅ |
| `Comments.test.tsx` | 2 | Comments component | ✅ |
| `CreateTripForm.test.tsx` | 2 | Create trip form | ✅ |
| `Home.test.tsx` | 1 | Home page | ✅ |
| `ImageCarrousel.test.tsx` | 2 | Image carousel | ✅ |
| `LoginModel.test.tsx` | 3 | Login modal | ✅ |
| `rateTrip.test.ts` | 2 | Rate trip API | ✅ |
| `RegisterModel.test.tsx` | 3 | Register modal | ✅ |
| `SmokeApp.test.tsx` | 1 | App smoke test | ✅ |
| `Valorar.test.tsx` | 1 | Rating component | ✅ |
| `setup.ts` | Config | Test setup | ✅ |

**Total Frontend Tests**: 20 tests

---

## 🎯 Plan de Acción - Próximos Tests

### Sprint 2 (Actual) - ✅ Completado
- [x] Tests para `users.py` router
- [x] Tests para `mongo_service.py`
- [x] Tests para `ratings.py` router
- [x] Tests para componentes críticos del frontend

### Sprint 3 - Prioridad Alta

#### Backend
- [ ] `tests/test_auth_verify_token.py` - Verificación de tokens JWT
- [ ] Extender `tests/test_image_service.py` - Error handling en images router
- [ ] `tests/test_firebase_service.py` - Inicialización de Firestore

#### Frontend
- [ ] `src/__tests__/RutaDetall.test.tsx` - Vista de detalle de ruta
- [ ] `src/__tests__/UserProfile.test.tsx` - Perfil de usuario
- [ ] `src/__tests__/UserProfilePublic.test.tsx` - Perfil público
- [ ] `src/__tests__/trips.test.ts` - Extender tests de API client

### Sprint 4 - Prioridad Media

#### Frontend
- [ ] `src/__tests__/MapSelector.test.tsx` - Selector de mapa
- [ ] `src/__tests__/MasonryGrid.test.tsx` - Grid de trips
- [ ] `src/__tests__/EditarPerfilModal.test.tsx` - Edición de perfil
- [ ] `src/__tests__/ResetPasswordModal.test.tsx` - Reset de contraseña

---

## 📊 Métricas de Cobertura

### Backend (85% overall)

```
✅ Routers: 70% average
   - ratings.py: 100%
   - users.py: 98%
   - comments.py: 89%
   - trips.py: 84%
   - images.py: 50% ⚠️

✅ Services: 75% average
   - image_service.py: 86%
   - mongo_service.py: 79%
   - firebase_service.py: 59% ⚠️

✅ Models: 100%
✅ Main: 100%
⚠️ Auth: 33% (verify_token.py)
```

### Frontend (36.77% overall)

```
✅ Components críticos: 85%+ average
   - Valorar: 100%
   - CreateTripForm: 90.39%
   - RegisterModal: 93.03%
   - Comments: 88.42%
   - LoginModal: 84.82%

⚠️ Pages: 12% average
   - Home: 47.32%
   - RutaDetall: 0% ❌
   - UserProfile: 0% ❌
   - UserProfilePublic: 0% ❌

⚠️ API Client: 35.76%
   - client.ts: 63.63%
   - trips.ts: 24.29% ⚠️

❌ Componentes auxiliares: <5%
   - MapSelector, MasonryGrid, Modals, etc.
```

---

## 🔍 Cómo Verificar Cobertura

### Backend
```bash
# Desde el root del proyecto
$env:PYTHONPATH='api'
pytest --cov=app --cov-report=term-missing -q tests

# Con reporte HTML
pytest --cov=app --cov-report=html -q tests
# Abrir htmlcov/index.html en el navegador
```

### Frontend
```bash
cd frontend
npm run test:cov

# Ver reporte en coverage/ (generado automáticamente)
```

---

## 📝 Notas

- **Cobertura no es todo**: Algunos módulos con baja cobertura pueden tener código difícil de testear (ej: inicialización de DB, conexiones externas)
- **Tests de integración**: Muchos tests son de integración (endpoints completos) más que unitarios puros
- **Mocks**: Se usan mocks extensivamente para Firestore, MongoDB, y servicios externos (ImgBB, geocoding)
- **CI/CD**: Todos los tests corren automáticamente en GitHub Actions (`run-tests.yml`)

---

**Última actualización**: Sprint 2  
**Mantenido por**: Equipo de desarrollo  
**Actualizar cuando**: Se añadan nuevos tests o módulos

