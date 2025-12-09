#!/bin/bash
# Script para ejecutar tests e2e
# Asegúrate de que el servidor de desarrollo esté corriendo en otra terminal:
# npm run dev

echo "Ejecutando tests e2e..."
echo "Asegúrate de que el servidor esté corriendo en http://localhost:5173"

npx playwright test --reporter=list

echo ""
echo "Para ver el reporte HTML:"
echo "npx playwright show-report"

