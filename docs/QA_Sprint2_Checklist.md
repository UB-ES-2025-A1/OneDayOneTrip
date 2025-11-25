# ✅ QA Sprint 2 Checklist

Checklist práctica para validar que cada historia cumple con los estándares de QA según **Software Engineering Class 8**.

---

## 📋 Checklist por Historia de Usuario

### Antes de empezar (Sprint Planning)
- [ ] Historia refinada con **escenarios de prueba enumerados** (Acceptance Criteria)
- [ ] Identificado el **tipo de test necesario** (unit, integration, functional, security)
- [ ] Estimado **25% del tiempo** para QA/testing
- [ ] Definido el **test espejo** según V-Model (ver tabla abajo)

### Durante el desarrollo (TDD/Test-First)
- [ ] **Unit tests** creados/actualizados (backend y/o frontend)
  - [ ] Backend: `pytest tests/test_*.py` pasa
  - [ ] Frontend: `npm run test:cov` pasa
- [ ] **Integration tests** ejecutados (router ↔ servicio)
  - [ ] Endpoints FastAPI validados con `TestClient`
  - [ ] Mocks/fixtures actualizados en `tests/conftest.py`
- [ ] **Functional tests** (caja negra) para formularios/flujos críticos
  - [ ] Simulación de entradas reales del usuario
  - [ ] Validación de experiencia completa

### Antes de mergear (Definition of Done)
- [ ] **Smoke suite** verde: `pytest tests/test_smoke_api.py -q`
- [ ] **Seguridad básica** validada:
  - [ ] Inputs inválidos rechazados (ObjectId, XSS, SQLi)
  - [ ] Rutas protegidas requieren autenticación
  - [ ] Validación de permisos (ej: no seguirse a uno mismo)
- [ ] **Cobertura** revisada:
  - [ ] Backend: `pytest --cov` muestra >70% en routers/servicios críticos
  - [ ] Frontend: `npm run test:cov` muestra cobertura aceptable
- [ ] **Suite completa en CI** verde:
  - [ ] GitHub Actions `run-tests.yml` pasa
  - [ ] Sin warnings críticos
- [ ] **Linters** ejecutados:
  - [ ] Frontend: `npm run lint` sin errores
  - [ ] Backend: código revisado estáticamente
- [ ] **Evidencia en PR**: captura o log de tests pasando

### Post-merge (Retrospectiva)
- [ ] **Usabilidad**: al menos 1 hallazgo documentado por sprint
  - [ ] Foco visible en formularios
  - [ ] Textos coherentes (catalán/español)
  - [ ] Feedback inmediato en acciones del usuario
- [ ] **Exploratory testing**: sesión de 30 min documentada
  - [ ] Hipótesis → resultado → acciones
- [ ] **Retro QA**: registrar qué mejorar en siguiente iteración

---

## 🎯 V-Model: Mapeo Desarrollo ↔ QA

| Nivel de Desarrollo | Tipo de Test Requerido | Archivos/Herramientas |
|---------------------|------------------------|----------------------|
| **Requisitos del usuario** | Acceptance Test Plan | Criterios en `docs/QA_Sprint2.md` |
| **Arquitectura del sistema** | System Test Plan | `tests/test_smoke_api.py`, `tests/test_ratings_endpoints.py` |
| **Diseño de alto nivel** | Integration Test Plan | `tests/test_trips_endpoints.py`, `tests/test_comments_endpoints.py` |
| **Diseño detallado** | Unit Test Plan | `tests/test_geo_utils.py`, `tests/test_image_service.py`, `tests/test_ratings_service.py` |
| **Implementación (código)** | Unit Testing | `src/__tests__/*.test.tsx`, `apiClient.test.ts` |

**Regla**: Cada historia debe tener mínimo **unit + integration** antes de "Done".

---

## 🧪 Tipos de Prueba: Checklist de Cobertura

### ✅ Unit Tests (TDD preferente)
- [ ] Backend: funciones puras testeadas (`test_geo_utils.py`, `test_image_service.py`, `test_ratings_service.py`)
- [ ] Frontend: componentes aislados (`CreateTripForm.test.tsx`, `Valorar.test.tsx`, `Comments.test.tsx`)
- [ ] Helpers/utilities (`apiClient.test.ts`, `rateTrip.test.ts`)
- [ ] Ejecución: `pytest -q tests` y `npm run test:cov`

### ✅ Integration Tests
- [ ] Endpoints FastAPI completos (`test_trips_endpoints.py`, `test_comments_endpoints.py`, `test_ratings_endpoints.py`)
- [ ] Validación router ↔ servicio mockeado (Mongo/Firestore)
- [ ] Validación de respuestas HTTP (status codes, payloads)

### ✅ Functional Testing (caja negra)
- [ ] Formularios clave: `CreateTripForm`, `Comments`, `Valorar`
- [ ] Flujos completos: crear ruta, comentar, valorar
- [ ] Simulación de entradas reales del usuario

### ✅ Smoke Testing
- [ ] API: `tests/test_smoke_api.py` valida rutas esenciales
- [ ] Frontend: `src/__tests__/SmokeApp.test.tsx` valida render básico
- [ ] Automatizado en CI/CD

### ✅ Regression Testing
- [ ] Suite completa corre en cada PR (`run-tests.yml`)
- [ ] Bugs encontrados → casos de test permanentes
- [ ] Cobertura no disminuye

### ✅ Security Testing
- [ ] Automático: `tests/test_security_users.py` (UID, follow a uno mismo)
- [ ] Validación de ObjectId inválidos en comentarios
- [ ] Manual: inputs maliciosos (scripts, payloads largos)

### ✅ Usability Testing
- [ ] Mini-sesiones internas (10 min por historia)
- [ ] Checklist: foco visible, textos coherentes, feedback inmediato
- [ ] Documentado en retro

### ✅ Exploratory Testing
- [ ] Sesión de 30 min a mitad del sprint
- [ ] Objetivo: romper flujos críticos (crear ruta, auth, comentarios)
- [ ] Hipótesis → resultado → acciones documentadas

---

## 🔧 Automatización: Checklist de Herramientas

### CI/CD
- [ ] GitHub Actions `run-tests.yml` ejecuta:
  - [ ] `pytest -v tests` (backend)
  - [ ] `npm run test:cov` (frontend)
- [ ] Smoke tests incluidos en pipeline
- [ ] Tests corren en cada PR antes de merge

### Cobertura
- [ ] Backend: reporte `htmlcov/` generado (Pytest)
- [ ] Frontend: reporte `coverage/` generado (Vitest v8)
- [ ] Revisión local antes de mergear
- [ ] Objetivo: >70% en routers/servicios críticos

### Comandos Locales
```bash
# Backend
cd api && pytest --maxfail=1 --disable-warnings -q

# Frontend  
cd frontend && npm run test:cov
```

---

## 📊 Objetivos Cuantificables Sprint 2

- [x] Cobertura backend >70% en routers/servicios críticos
- [x] Smoke automático en cada build (`test_smoke_api.py`)
- [x] Documentación de técnicas y herramientas (`docs/QA_Sprint2.md`)
- [ ] MSW para pruebas funcionales del frontend (próximo paso)
- [ ] Contract tests para `users` router (próximo paso)

---

## 🚨 Red Flags: NO mergear si...

- ❌ Tests unitarios faltantes para funciones críticas
- ❌ Smoke suite falla
- ❌ Cobertura disminuye significativamente
- ❌ Linters con errores críticos
- ❌ CI/CD rojo
- ❌ Sin evidencia de tests en PR
- ❌ Escenarios de prueba no definidos en la historia

---

## 📝 Template para PR

```markdown
## QA Checklist
- [ ] Unit tests: ✅/❌
- [ ] Integration tests: ✅/❌
- [ ] Smoke suite: ✅/❌
- [ ] Security validada: ✅/❌
- [ ] Cobertura: X% (backend) / Y% (frontend)
- [ ] CI verde: ✅/❌

## Evidencia
[Captura o log de tests]
```

---

## 🔄 Retrospectiva QA (al final del sprint)

### Preguntas guía:
1. ¿Qué defecto identificamos tarde que un test podría haber detectado?
2. ¿Qué mocks/fixtures reutilizamos y cuáles debemos refactorizar?
3. ¿Cobertura y tiempos de pipeline fueron aceptables?
4. ¿Qué parte del proceso de pruebas mejoraremos la próxima iteración?

### Acciones resultantes:
- [ ] Tarea creada para siguiente sprint
- [ ] Documentación actualizada
- [ ] Herramientas/tecnologías nuevas identificadas

---

**Mantén este checklist vivo**: actualízalo cuando cambien los estándares o herramientas del equipo.

