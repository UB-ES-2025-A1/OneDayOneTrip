# QA & Testing Strategy – Sprint 2

Este plan aterriza las guías de **Software Engineering Class 8** para el estado actual del proyecto OneDayOneTrip. Incluye el alineamiento con el V-Model, los tipos de pruebas cubiertos (unitarias, integración, funcionales, smoke, regresión, usabilidad, seguridad y exploratorias), la automatización requerida y la cadencia de mejora continua para Sprint 2.

---

## 1. Alineamiento con el V-Model

| Desarrollo                      | QA asociado            | Activos actuales                                                                                       |
| --------------------------------| -----------------------| -------------------------------------------------------------------------------------------------------|
| Requisitos del usuario          | Acceptance Test Plan   | `docs/QA_Sprint2.md` (sección Checklist + criterios por flujo crítico).                                |
| Arquitectura del sistema        | System Test Plan       | Suite end-to-end objetivo (documentada en “Pruebas funcionales”) + smoke `tests/test_smoke_api.py` + validación `tests/test_ratings_endpoints.py`.    |
| Diseño de alto nivel            | Integration Test Plan  | Pytest API `tests/test_trips_endpoints.py`, `tests/test_comments_endpoints.py`, `tests/test_smoke_api.py`. |
| Diseño detallado                | Unit Test Plan         | Pytest unitarios (`tests/test_geo_utils.py`, `tests/test_image_service.py`, `tests/test_security_users.py`, `tests/test_ratings_service.py`). |
| Implementación (código)         | Unit Testing           | Vitest unitarios (`src/__tests__/*.test.tsx`, `apiClient.test.ts`, `Valorar.test.tsx`, `rateTrip.test.ts`) + Pytest unit tests.                 |

Cada historia del Sprint 2 debe registrar su test espejo (mínimo unit + integración) en la checklist adjunta antes de moverse a “Done”.

---

## 2. Tipos de prueba cubiertos (pág. 6–10)

📊 **Documentación completa de cobertura**: Ver [`docs/TEST_COVERAGE.md`](./TEST_COVERAGE.md)

- **Unit Tests (TDD preferente)**  
  - Backend: `tests/test_geo_utils.py`, `tests/test_image_service.py`, `tests/test_security_users.py`, `tests/test_ratings_service.py`, `tests/test_mongo_service.py`.  
  - Frontend: `src/__tests__/CreateTripForm.test.tsx`, `Comments.test.tsx`, `Valorar.test.tsx`, `rateTrip.test.ts`, `apiClient.test.ts`.  
  - Ejecutar con `pytest -q tests` y `npm run test:cov`.

- **Integration Tests**  
  - Endpoints FastAPI (`tests/test_trips_endpoints.py`, `tests/test_comments_endpoints.py`, `tests/test_ratings_endpoints.py`, `tests/test_smoke_api.py`).  
  - Validan la interacción router ↔ servicios mockeados (Mongo/Firestore).

- **Functional Testing (caja negra)**  
  - Formularios clave: `CreateTripForm`, `Comments` y la experiencia de valoración (`Valorar.test.tsx`) simulan entradas reales validando la experiencia completa.  
  - Para rutas públicas recomendadas, usar el guion `docs/QA_Sprint2.md#checklist`.

- **Smoke Testing**  
  - `tests/test_smoke_api.py` asegura que la API y las rutas esenciales responden tras cada build.  
  - `src/__tests__/Home.test.tsx` + `SmokeApp` (Home render) actúan como smoke del frontend.

- **Regression Testing**  
  - Toda la suite (pytest + vitest coverage) corre en `run-tests.yml` para cada PR.  
  - Cualquier bug encontrado debe traducirse en un caso permanente dentro de `tests/` o `src/__tests__/`.

- **Usability Testing**  
  - Mini-sesiones internas (10 minutos) por historia con checklist de accesibilidad: foco visible, textos en catalán/español coherentes, feedback inmediato en formularios.  
  - Documentar hallazgos en la retro del sprint.

- **Security Testing**  
  - Validaciones automáticas: `tests/test_security_users.py` (registro sin UID, follow a uno mismo) y pruebas de comentarios con `ObjectId` inválido.  
  - Manual: checklist de inputs maliciosos (scripts, payloads largos) sobre formularios principales.

- **Exploratory Testing**  
  - Sesiones de 30 minutos a mitad del sprint. Objetivo: romper flujo de creación de rutas, autenticación y comentarios.  
  - Registrar hipótesis → resultado → acciones en la retro.

---

## 3. Automatización (pág. 13)

- **Back + Front**: GitHub Actions `run-tests.yml` ya ejecuta `pytest -v tests` y `npm run test:cov`.  
- **Cobertura**: revisar reportes `coverage/` (Vitest v8) y `htmlcov/` (Pytest) localmente antes de mergear.  
- **Smoke/Regression**: incluidos en la misma pipeline.  
- **Comando local recomendado**:
  ```bash
  # Backend
  cd api && pytest --maxfail=1 --disable-warnings -q
  # Frontend
  cd frontend && npm run test:cov
  ```

---

## 4. Planificación de pruebas por sprint

1. **Sprint Planning**  
   - Identificar historias de mayor riesgo (nueva API, formularios complejos) y anotar qué tipos de test necesita cada una.  
   - Definir esfuerzo QA explícito en la estimación (al menos 25% del tiempo de la historia).  
2. **Durante el sprint**  
   - Practicar TDD o al menos “test-first” para nuevas funciones.  
   - Añadir fixtures/mocks reutilizables en `tests/conftest.py` cuando surja una dependencia nueva.  
3. **Definition of Done**  
   - Tests escritos + verdes.  
   - Checklist de QA marcada.  
   - Evidencia en PR (captura o log de `npm run test:cov`/`pytest`).

---

## 5. Retrospectiva enfocada en QA (pág. 16)

Preguntas guía:
- ¿Qué defecto identificamos tarde que un test podría haber detectado?  
- ¿Qué mocks/fixtures reutilizamos y cuáles debemos refactorizar?  
- ¿Cobertura y tiempos de pipeline fueron aceptables?  
Acciones resultantes deben quedar como tareas de la siguiente iteración (ej. “Agregar contract tests para comments API”).

---

## 6. Coste de bugs (pág. 5)

- Incluir la gráfica “Cost of Change” en cada demo para recordar que detectar errores en requisitos/diseño es hasta 100x más barato que en producción.  
- Implicación práctica: no mover historias a desarrollo si carecen de escenarios de prueba definidos; realizar code reviews con checklist de QA antes del merge.

---

## 7. Buenas prácticas de QA (pág. 11)

- Linters automáticos (`npm run lint`, `ruff`/`flake8` si aplica) + revisión estática obligatoria.  
- Inspecciones cruzadas de diseño y código (pair programming ligero).  
- Revisar los scripts de prueba y actualizar `docs/QA_Sprint2.md` cuando cambie el alcance.  
- Controlar cobertura en subrutinas críticas (servicios de Mongo/Firestore, auth, formularios de rutas).

---

## 8. Equipos autoorganizados (pág. 14–15)

- QA es responsabilidad del squad completo; cada PR debe llegar con su test asociado.  
- Rotar ownership de fixtures/mocks para evitar “single point of failure”.  
- Compartir mini-demos sobre herramientas de testing (Vitest, Pytest, MSW) en la daily del miércoles.

---

## 9. Foco Sprint 2 (pág. 17)

Objetivos cuantificables:
- ✅ Subir cobertura backend al >70% en routers y servicios críticos.  
- ✅ Asegurar smoke automático en cada build (hecho con `test_smoke_api.py`).  
- ✅ Documentar en este archivo las técnicas y herramientas usadas.  
- ➡️ Próximo paso: añadir MSW para pruebas funcionales del frontend y contract tests para `users` router.

---

## 10. Checklist QA Sprint 2

**📋 Checklist detallada disponible en:** [`docs/QA_Sprint2_Checklist.md`](./QA_Sprint2_Checklist.md)

Checklist rápida:
1. Historia refinada con escenarios de prueba enumerados.  
2. Unit tests creados/actualizados (backend y/o frontend).  
3. Integration/functional test ejecutado (Pytest o Vitest).  
4. Smoke suite (`pytest tests/test_smoke_api.py -q`) verde.  
5. Seguridad básica validada (inputs inválidos + rutas protegidas).  
6. Anotaciones de usabilidad (al menos 1 hallazgo por sprint).  
7. Suite completa en CI verde antes de mergear.  
8. Retro: registrar qué parte del proceso de pruebas mejorarás la próxima iteración.

> Mantén este documento vivo: cualquier nueva técnica o herramienta debe añadirse aquí como referencia única para el equipo.


