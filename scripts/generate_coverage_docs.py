#!/usr/bin/env python3
"""
Script to automatically generate test coverage documentation.
Runs on CI/CD and updates TEST_COVERAGE.md with current coverage data.
"""
import subprocess
import json
import re
import os
from pathlib import Path
from datetime import datetime

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
DOCS_DIR = PROJECT_ROOT / "docs"
COVERAGE_DOC = DOCS_DIR / "TEST_COVERAGE.md"
SUMMARY_DOC = DOCS_DIR / "TEST_COVERAGE_SUMMARY.md"


def run_command(cmd, cwd=None):
    """Run shell command and return output."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, cwd=cwd, check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {cmd}")
        print(f"Error: {e.stderr}")
        return ""


def get_backend_coverage():
    """Get backend test coverage using pytest-cov."""
    os.environ["PYTHONPATH"] = str(PROJECT_ROOT / "api")
    
    # Run pytest with coverage
    cmd = f"pytest --cov=app --cov-report=json --cov-report=term -q api/tests"
    output = run_command(cmd, cwd=PROJECT_ROOT)
    
    # Try to read JSON coverage report
    coverage_file = PROJECT_ROOT / "coverage.json"
    if coverage_file.exists():
        with open(coverage_file, "r") as f:
            data = json.load(f)
        return data, output
    return None, output


def get_frontend_coverage():
    """Get frontend test coverage from downloaded artifacts or by running tests."""
    # Try to read JSON coverage report from downloaded artifacts (CI/CD)
    coverage_file = PROJECT_ROOT / "frontend" / "coverage" / "coverage-final.json"
    if coverage_file.exists():
        with open(coverage_file, "r") as f:
            data = json.load(f)
        return data, "Coverage data loaded from artifacts"
    
    # If not found, try to run tests to get coverage (local development)
    print("  Running frontend tests to generate coverage...")
    cmd = "npm run test:cov"
    output = run_command(cmd, cwd=PROJECT_ROOT / "frontend")
    
    # Try to read the generated coverage file
    if coverage_file.exists():
        with open(coverage_file, "r") as f:
            data = json.load(f)
        return data, output
    
    # Fallback to parsing terminal output
    return None, output


def parse_backend_coverage_terminal(output):
    """Parse backend coverage from terminal output."""
    coverage_data = {}
    lines = output.split("\n")
    
    for line in lines:
        if "TOTAL" in line and "%" in line:
            # Extract total coverage
            match = re.search(r"(\d+)%", line)
            if match:
                coverage_data["total"] = int(match.group(1))
        
        # Parse individual file coverage
        if "api/app" in line and "%" in line:
            parts = line.split()
            if len(parts) >= 2:
                file_path = parts[0]
                coverage_str = parts[-1].replace("%", "")
                try:
                    coverage_data[file_path] = int(coverage_str)
                except ValueError:
                    pass
    
    return coverage_data


def parse_frontend_coverage_terminal(output):
    """Parse frontend coverage from terminal output."""
    coverage_data = {}
    lines = output.split("\n")
    
    in_table = False
    for line in lines:
        if "File" in line and "% Stmts" in line:
            in_table = True
            continue
        if in_table and "---" in line:
            continue
        if in_table and line.strip() and not line.startswith(" "):
            parts = line.split("|")
            if len(parts) >= 5:
                file_path = parts[0].strip()
                coverage_str = parts[1].strip().replace("%", "")
                try:
                    coverage_data[file_path] = int(coverage_str)
                except ValueError:
                    pass
        if in_table and "All files" in line:
            parts = line.split("|")
            if len(parts) >= 2:
                total_str = parts[1].strip().replace("%", "")
                try:
                    coverage_data["total"] = int(total_str)
                except ValueError:
                    pass
            break
    
    return coverage_data


def get_test_files():
    """Get list of test files."""
    backend_tests = list((PROJECT_ROOT / "api" / "tests").glob("test_*.py"))
    frontend_tests = list((PROJECT_ROOT / "frontend" / "src" / "__tests__").glob("*.test.*"))
    
    return {
        "backend": [f.name for f in backend_tests],
        "frontend": [f.name for f in frontend_tests]
    }


def generate_coverage_doc(backend_cov, frontend_cov, test_files):
    """Generate the coverage documentation."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    backend_total = backend_cov.get("total", 0)
    frontend_total = frontend_cov.get("total", 0)
    
    doc = f"""# Test Coverage Documentation

Documentación completa del estado de pruebas en OneDayOneTrip.
**Generado automáticamente**: {timestamp}

---

## Resumen Ejecutivo

| Categoría | Cobertura | Estado |
|-----------|-----------|--------|
| **Backend Overall** | **{backend_total}%** | {'Excelente' if backend_total >= 70 else 'En progreso'} |
| **Frontend Overall** | **{frontend_total}%** | {'Excelente' if frontend_total >= 50 else 'En progreso'} |
| **Total Tests** | **{len(test_files['backend']) + len(test_files['frontend'])} test files** | Completo |

---

## Backend Tests

### Routers (API Endpoints)

| Router | Cobertura | Test File | Estado |
|--------|-----------|-----------|--------|
"""
    
    # Add router coverage
    routers = {
        "ratings.py": "test_ratings_endpoints.py, test_ratings_service.py",
        "users.py": "test_users_endpoints.py, test_security_users.py",
        "comments.py": "test_comments_endpoints.py",
        "trips.py": "test_trips_endpoints.py, test_geo_utils.py",
        "images.py": "test_image_service.py"
    }
    
    for router, test_file in routers.items():
        cov = backend_cov.get(f"api/app/routers/{router}", 0)
        status = "Completo" if cov >= 80 else "Bueno" if cov >= 60 else "Parcial"
        doc += f"| **{router}** | **{cov}%** | `{test_file}` | {status} |\n"
    
    doc += f"""
### Services

| Service | Cobertura | Test File | Estado |
|--------|-----------|-----------|--------|
"""
    
    services = {
        "mongo_service.py": "test_mongo_service.py",
        "image_service.py": "test_image_service.py",
        "firebase_service.py": "Sin tests"
    }

    for service, test_file in services.items():
        cov = backend_cov.get(f"api/app/services/{service}", 0)
        status = "Bueno" if cov >= 60 else "Necesita tests"
        doc += f"| **{service}** | **{cov}%** | {test_file} | {status} |\n"
    
    doc += f"""
### Auth

| Module | Cobertura | Test File | Estado |
|--------|-----------|-----------|--------|
| **verify_token.py** | **{backend_cov.get('api/app/auth/verify_token.py', 0)}%** | Sin tests | Necesita tests |

---

## Frontend Tests

### Componentes con Tests

| Component | Cobertura | Test File | Estado |
|-----------|-----------|-----------|--------|
"""
    
    # Add frontend components (only those with actual test files)
    components = {
        "Valorar.tsx": "Valorar.test.tsx",
        "RegisterModal.tsx": "RegisterModel.test.tsx",
        "Comments.tsx": "Comments.test.tsx",
        "LoginModal.tsx": "LoginModel.test.tsx",
        "ResetPasswordModal.tsx": "ResetPasswordModal.test.tsx",
        "EtapesList.tsx": "EtapesList.test.tsx",
        "MasonryGrid.tsx": "MasonryGrid.test.tsx",
        "ImageCarousel.tsx": "ImageCarrousel.test.tsx",
        "Home.tsx": "Home.test.tsx, SmokeApp.test.tsx",
        "RutaDetall.tsx": "RutaDetall.test.tsx",
        "UserProfile.tsx": "UserProfile.test.tsx",
        "UserProfilePublic.tsx": "UserProfilePublic.test.tsx"
    }
    
    for component, test_file in components.items():
        # Try to find coverage for this component
        cov = 0
        component_name = component.replace(".tsx", "").replace(".ts", "")
        for key in frontend_cov:
            # Match component name in path (e.g., "Valorar" in ".../components/Valorar.tsx")
            if component_name.lower() in key.lower() and ("components" in key.lower() or "pages" in key.lower()):
                cov = frontend_cov[key]
                break
        
        # Only show components with actual coverage (> 0%)
        if cov > 0:
            status = "Completo" if cov >= 80 else "Bueno" if cov >= 60 else "Parcial"
            doc += f"| **{component}** | **{cov}%** | `{test_file}` | {status} |\n"
    
    doc += f"""
---

## Test Files Existentes

### Backend (`api/tests/`)

"""
    
    for test_file in sorted(test_files["backend"]):
        doc += f"- `{test_file}`\n"
    
    doc += f"""
**Total Backend Tests**: {len(test_files['backend'])} test files

### Frontend (`frontend/src/__tests__/`)

"""
    
    for test_file in sorted(test_files["frontend"]):
        doc += f"- `{test_file}`\n"
    
    doc += f"""
**Total Frontend Tests**: {len(test_files['frontend'])} test files

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

**Última actualización**: {timestamp}  
**Generado automáticamente por**: `scripts/generate_coverage_docs.py`  
**Mantenido por**: CI/CD Pipeline
"""
    
    return doc


def generate_summary_doc(backend_cov, frontend_cov):
    """Generate the summary documentation."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    backend_total = backend_cov.get("total", 0)
    frontend_total = frontend_cov.get("total", 0)
    
    doc = f"""# Test Coverage - Quick Reference

Resumen rápido del estado de tests. Para detalles completos, ver [`TEST_COVERAGE.md`](./TEST_COVERAGE.md).

**Última actualización**: {timestamp}

---

## Backend: {backend_total}% Coverage

| Módulo | Coverage | Estado |
|--------|----------|--------|
"""
    
    # Add key modules
    modules = [
        ("ratings.py", "api/app/routers/ratings.py"),
        ("users.py", "api/app/routers/users.py"),
        ("comments.py", "api/app/routers/comments.py"),
        ("trips.py", "api/app/routers/trips.py"),
        ("mongo_service.py", "api/app/services/mongo_service.py"),
        ("image_service.py", "api/app/services/image_service.py"),
    ]
    
    for name, path in modules:
        cov = backend_cov.get(path, 0)
        status = "Completo" if cov >= 70 else "En progreso"
        doc += f"| **{name}** | {cov}% | {status} |\n"
    
    doc += f"""
---

## Frontend: {frontend_total}% Coverage

### Componentes con Tests
"""

    # Calculate coverage for key components (only those with actual test files)
    key_components = {
        "Valorar.tsx": "Valorar.test.tsx",
        "RegisterModal.tsx": "RegisterModel.test.tsx",
        "Comments.tsx": "Comments.test.tsx",
        "LoginModal.tsx": "LoginModel.test.tsx",
        "ResetPasswordModal.tsx": "ResetPasswordModal.test.tsx",
        "EtapesList.tsx": "EtapesList.test.tsx",
        "MasonryGrid.tsx": "MasonryGrid.test.tsx",
        "Home.tsx": "Home.test.tsx",
        "RutaDetall.tsx": "RutaDetall.test.tsx",
        "UserProfile.tsx": "UserProfile.test.tsx",
        "UserProfilePublic.tsx": "UserProfilePublic.test.tsx"
    }

    components_with_tests = []
    for component, test_file in key_components.items():
        cov = 0
        # Try to find coverage for this component
        component_name = component.replace(".tsx", "").replace(".ts", "")
        for key in frontend_cov:
            # Match component name in path (e.g., "Valorar" in ".../components/Valorar.tsx")
            if component_name.lower() in key.lower() and ("components" in key.lower() or "pages" in key.lower()):
                cov = frontend_cov[key]
                break
        
        # Only include components with actual coverage (> 0%)
        if cov > 0:
            components_with_tests.append((component, cov))
    
    # Sort by coverage descending
    components_with_tests.sort(key=lambda x: x[1], reverse=True)
    
    for component, cov in components_with_tests:
        doc += f"- `{component}` ({cov}%)\n"
    
    if not components_with_tests:
        doc += "- No components with test coverage found\n"

    doc += f"""

### Componentes Sin Tests (Prioridad Alta)
"""

    # Find components without tests (components in key_components but with 0% coverage)
    components_without_tests = []
    for component, test_file in key_components.items():
        cov = 0
        component_name = component.replace(".tsx", "").replace(".ts", "")
        for key in frontend_cov:
            if component_name.lower() in key.lower() and ("components" in key.lower() or "pages" in key.lower()):
                cov = frontend_cov[key]
                break
        
        # If component has 0% coverage, it doesn't have tests
        if cov == 0:
            components_without_tests.append(component)
    
    # Also check for common components that might not be in the list
    common_components_without_tests = ["CreateTripForm.tsx", "MapSelector.tsx"]
    for component in common_components_without_tests:
        if component not in key_components:
            components_without_tests.append(component)
    
    if components_without_tests:
        for component in sorted(components_without_tests):
            doc += f"- `{component}`\n"
    else:
        doc += "- No hay componentes sin tests identificados\n"

    doc += f"""
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
"""
    
    return doc


def main():
    """Main function to generate coverage documentation."""
    print("Gathering test coverage data...")

    # Get backend coverage
    print("Getting backend coverage...")
    backend_json, backend_output = get_backend_coverage()
    if backend_json:
        backend_cov = {}
        backend_cov["total"] = int(backend_json["totals"]["percent_covered"])
        for file_path, data in backend_json["files"].items():
            # Normalize path separators for cross-platform compatibility
            normalized_path = file_path.replace("\\", "/")
            if "api/app" in normalized_path:
                backend_cov[normalized_path] = int(data["summary"]["percent_covered"])
    else:
        backend_cov = parse_backend_coverage_terminal(backend_output)

    # Get frontend coverage
    print("Getting frontend coverage...")
    frontend_json, frontend_output = get_frontend_coverage()
    if frontend_json:
        frontend_cov = {}
        # Parse vitest coverage-final.json format
        total_cov = 0
        file_count = 0
        for file_path, data in frontend_json.items():
            # Normalize path separators
            normalized_path = file_path.replace("\\", "/")
            # Only process source files
            if "src" in normalized_path and (".tsx" in normalized_path or ".ts" in normalized_path):
                stmts = data.get("s", {})
                if stmts:
                    covered = sum(1 for v in stmts.values() if v > 0)
                    total = len(stmts)
                    if total > 0:
                        cov = int((covered / total) * 100)
                        frontend_cov[normalized_path] = cov
                        total_cov += cov
                        file_count += 1
        if file_count > 0:
            frontend_cov["total"] = int(total_cov / file_count)
    else:
        frontend_cov = parse_frontend_coverage_terminal(frontend_output)

    # Get test files
    test_files = get_test_files()

    # Generate documentation
    print("Generating coverage documentation...")
    coverage_doc = generate_coverage_doc(backend_cov, frontend_cov, test_files)
    summary_doc = generate_summary_doc(backend_cov, frontend_cov)

    # Write files
    DOCS_DIR.mkdir(exist_ok=True)
    COVERAGE_DOC.write_text(coverage_doc, encoding="utf-8")
    SUMMARY_DOC.write_text(summary_doc, encoding="utf-8")

    print("Coverage documentation generated!")
    print(f"   - {COVERAGE_DOC}")
    print(f"   - {SUMMARY_DOC}")
    print(f"Backend: {backend_cov.get('total', 0)}% | Frontend: {frontend_cov.get('total', 0)}%")


if __name__ == "__main__":
    main()

