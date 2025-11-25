# 🤖 Automatización de Documentación de Cobertura

Sistema automatizado que genera documentación de cobertura de tests en cada Pull Request.

---

## 🎯 Cómo Funciona

### 1. **Trigger Automático**
Cuando se crea un Pull Request, GitHub Actions ejecuta:
- Tests de backend con coverage
- Tests de frontend con coverage
- Generación automática de documentación

### 2. **Script de Generación**
El script `scripts/generate_coverage_docs.py`:
- Recopila datos de cobertura de backend (pytest-cov)
- Recopila datos de cobertura de frontend (vitest)
- Genera `docs/TEST_COVERAGE.md` (completo)
- Genera `docs/TEST_COVERAGE_SUMMARY.md` (resumen)

### 3. **Output en PR**
- **Artifact**: Documentación completa disponible para descargar
- **Comentario automático**: Resumen de cobertura en el PR
- **Actualización**: Los docs se regeneran en cada push al PR

---

## 📋 Archivos Generados

### `docs/TEST_COVERAGE.md`
- Documentación completa de cobertura
- Tablas por módulo/componente
- Lista de tests implementados
- Plan de acción para próximos tests

### `docs/TEST_COVERAGE_SUMMARY.md`
- Resumen rápido
- Métricas principales
- Componentes sin tests (prioridad alta)

---

## 🔧 Uso Local

### Generar documentación manualmente

```bash
# Desde el root del proyecto
$env:PYTHONPATH='api'
python scripts/generate_coverage_docs.py
```

### Requisitos

```bash
# Backend
pip install pytest pytest-cov

# Frontend
cd frontend
npm install
```

---

## 🚀 En CI/CD

### Workflow: `.github/workflows/run-tests.yml`

**Jobs**:
1. `backend-tests` - Ejecuta tests y genera `coverage.json`
2. `frontend-tests` - Ejecuta tests con vitest
3. `generate-coverage-docs` - Combina ambos y genera docs

**Output**:
- Artifacts con documentación
- Comentario en PR con resumen

---

## 📊 Ejemplo de Comentario en PR

Cuando se crea un PR, verás un comentario automático como:

```
## 📊 Test Coverage Summary

**Backend Coverage**: 85%

**Frontend Coverage**: 36.77%

📄 Full coverage report available in artifacts.
```

---


