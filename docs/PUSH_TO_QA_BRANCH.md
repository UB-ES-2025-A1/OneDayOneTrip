# 🚀 Cómo hacer push a QA-Unit-tests

## Situación Actual

Estás en la rama local `QA-Unit-tests-Sprint2` pero el branch remoto ha cambiado a `QA-Unit-tests`.

## Opciones para hacer push

### Opción 1: Push a QA-Unit-tests (nuevo branch)

```bash
# 1. Asegúrate de tener todos los cambios commiteados
git add -A
git commit -m "📊 Add comprehensive test coverage and automation"

# 2. Crea/switch a QA-Unit-tests
git checkout -b QA-Unit-tests

# 3. Push al nuevo branch
git push -u origin QA-Unit-tests
```

### Opción 2: Push a QA-Unit-Tests (branch existente con mayúscula)

```bash
# 1. Asegúrate de tener todos los cambios commiteados
git add -A
git commit -m "📊 Add comprehensive test coverage and automation"

# 2. Switch al branch existente
git checkout QA-Unit-Tests
# O si no existe localmente:
git checkout -b QA-Unit-Tests origin/QA-Unit-Tests

# 3. Merge tus cambios
git merge QA-Unit-tests-Sprint2

# 4. Push
git push -u origin QA-Unit-Tests
```

### Opción 3: Renombrar tu branch actual

```bash
# 1. Renombra tu branch local
git branch -m QA-Unit-tests-Sprint2 QA-Unit-tests

# 2. Push al nuevo nombre
git push -u origin QA-Unit-tests

# 3. Elimina el branch remoto viejo (opcional)
git push origin --delete QA-Unit-tests-Sprint2
```

## Cambios que se van a pushear

- ✅ Tests para `users.py` (18 nuevos tests)
- ✅ Tests para `mongo_service.py` (16 nuevos tests)
- ✅ Documentación de cobertura (`TEST_COVERAGE.md`, `TEST_COVERAGE_SUMMARY.md`)
- ✅ Script de automatización (`scripts/generate_coverage_docs.py`)
- ✅ GitHub Actions workflow actualizado (genera docs en PRs)

## Verificación

Después del push, verifica que:
1. El PR muestra el comentario automático con coverage
2. Los artifacts contienen la documentación generada
3. Los tests pasan en CI

