# Test Coverage - Quick Reference

Resumen rápido del estado de tests. Para detalles completos, ver [`TEST_COVERAGE.md`](./TEST_COVERAGE.md).

**Última actualización**: 2025-11-26 02:58:05

---

## Backend: 81% Coverage

| Módulo | Coverage | Estado |
|--------|----------|--------|
| **ratings.py** | 100% | Completo |
| **users.py** | 78% | Completo |
| **comments.py** | 88% | Completo |
| **trips.py** | 84% | Completo |
| **mongo_service.py** | 76% | Completo |
| **image_service.py** | 85% | Completo |

---

## Frontend: 54% Coverage

### Componentes con Tests
- `Valorar.tsx` (100%)
- `EtapesList.tsx` (100%)
- `MasonryGrid.tsx` (97%)
- `ResetPasswordModal.tsx` (95%)
- `Home.tsx` (95%)
- `RegisterModal.tsx` (93%)
- `Comments.tsx` (88%)
- `LoginModal.tsx` (84%)
- `UserProfilePublic.tsx` (83%)
- `RutaDetall.tsx` (78%)
- `UserProfile.tsx` (68%)


### Componentes Sin Tests (Prioridad Alta)
- `CreateTripForm.tsx`
- `MapSelector.tsx`

---

## Próximos Tests a Implementar

### Backend (Prioridad Alta)
1. `api/tests/test_auth_verify_token.py` - Auth verification
2. Extender `api/tests/test_image_service.py` - Error handling
3. `api/tests/test_firebase_service.py` - Firestore init

### Frontend (Prioridad Alta)
1. `src/__tests__/RutaDetall.test.tsx` - Trip detail page
2. `src/__tests__/UserProfile.test.tsx` - User profile
3. `src/__tests__/UserProfilePublic.test.tsx` - Public profile
4. `src/__tests__/trips.test.ts` - API client functions

---

**Ver documentación completa**: [`TEST_COVERAGE.md`](./TEST_COVERAGE.md)
