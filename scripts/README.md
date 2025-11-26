# Scripts Directory

Scripts utilitarios para automatización y mantenimiento del proyecto.

## 📊 generate_coverage_docs.py

Genera automáticamente la documentación de cobertura de tests.

### Uso Local

```bash
# Desde el root del proyecto
$env:PYTHONPATH='api'
python scripts/generate_coverage_docs.py
```

### Uso en CI/CD

El script se ejecuta automáticamente en GitHub Actions cuando:
- Se crea un Pull Request
- Se ejecutan los tests de backend y frontend

### Output

Genera dos archivos en `docs/`:
- `TEST_COVERAGE.md` - Documentación completa
- `TEST_COVERAGE_SUMMARY.md` - Resumen rápido

### Requisitos

- Python 3.11+
- pytest-cov instalado
- npm y vitest (para frontend coverage)

