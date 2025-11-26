# Test Coverage Documentation

Documentación completa del estado de pruebas en OneDayOneTrip.
**Generado automáticamente**: 2025-11-26 02:58:05

---

## Resumen Ejecutivo

| Categoría | Cobertura | Estado |
|-----------|-----------|--------|
| **Backend Overall** | **81%** | Excelente |
| **Frontend Overall** | **54%** | Excelente |
| **Total Tests** | **26 test files** | Completo |

---

## Backend Tests

### Routers (API Endpoints)

| Router | Cobertura | Test File | Estado |
|--------|-----------|-----------|--------|
| **ratings.py** | **100%** | `test_ratings_endpoints.py, test_ratings_service.py` | Completo |
| **users.py** | **78%** | `test_users_endpoints.py, test_security_users.py` | Bueno |
| **comments.py** | **88%** | `test_comments_endpoints.py` | Completo |
| **trips.py** | **84%** | `test_trips_endpoints.py, test_geo_utils.py` | Completo |
| **images.py** | **50%** | `test_image_service.py` | Parcial |

### Services

| Service | Cobertura | Test File | Estado |
|--------|-----------|-----------|--------|
| **mongo_service.py** | **76%** | test_mongo_service.py | Bueno |
| **image_service.py** | **85%** | test_image_service.py | Bueno |
| **firebase_service.py** | **59%** | Sin tests | Necesita tests |

### Auth

| Module | Cobertura | Test File | Estado |
|--------|-----------|-----------|--------|
| **verify_token.py** | **33%** | Sin tests | Necesita tests |

---

## Frontend Tests

### Componentes con Tests

| Component | Cobertura | Test File | Estado |
|-----------|-----------|-----------|--------|
| **Valorar.tsx** | **100%** | `Valorar.test.tsx` | Completo |
| **RegisterModal.tsx** | **93%** | `RegisterModel.test.tsx` | Completo |
| **Comments.tsx** | **88%** | `Comments.test.tsx` | Completo |
| **LoginModal.tsx** | **84%** | `LoginModel.test.tsx` | Completo |
| **ResetPasswordModal.tsx** | **95%** | `ResetPasswordModal.test.tsx` | Completo |
| **EtapesList.tsx** | **100%** | `EtapesList.test.tsx` | Completo |
| **MasonryGrid.tsx** | **97%** | `MasonryGrid.test.tsx` | Completo |
| **ImageCarousel.tsx** | **83%** | `ImageCarrousel.test.tsx` | Completo |
| **Home.tsx** | **95%** | `Home.test.tsx, SmokeApp.test.tsx` | Completo |
| **RutaDetall.tsx** | **78%** | `RutaDetall.test.tsx` | Bueno |
| **UserProfile.tsx** | **68%** | `UserProfile.test.tsx` | Bueno |
| **UserProfilePublic.tsx** | **83%** | `UserProfilePublic.test.tsx` | Completo |

---

## Test Files Existentes

### Backend (`api/tests/`)

- `test_comments_endpoints.py`
- `test_geo_utils.py`
- `test_image_service.py`
- `test_mongo_service.py`
- `test_ratings_endpoints.py`
- `test_ratings_service.py`
- `test_security_users.py`
- `test_smoke_api.py`
- `test_trips_endpoints.py`
- `test_users_endpoints.py`

**Total Backend Tests**: 10 test files

### Frontend (`frontend/src/__tests__/`)

- `Comments.test.tsx`
- `EtapesList.test.tsx`
- `Home.test.tsx`
- `ImageCarrousel.test.tsx`
- `LoginModel.test.tsx`
- `MasonryGrid.test.tsx`
- `RegisterModel.test.tsx`
- `ResetPasswordModal.test.tsx`
- `RutaDetall.test.tsx`
- `SmokeApp.test.tsx`
- `UserProfile.test.tsx`
- `UserProfilePublic.test.tsx`
- `Valorar.test.tsx`
- `apiClient.test.ts`
- `rateTrip.test.ts`
- `trips.test.ts`

**Total Frontend Tests**: 16 test files

---

## Cómo Verificar Cobertura

### Backend
```bash
# Desde el root del proyecto
$env:PYTHONPATH='api'
pytest --cov=app --cov-report=term-missing -q api/tests
```

### Frontend
```bash
cd frontend
npm run test:cov
```

---

**Última actualización**: 2025-11-26 02:58:05  
**Generado automáticamente por**: `scripts/generate_coverage_docs.py`  
**Mantenido por**: CI/CD Pipeline
