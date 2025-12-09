# Script para ejecutar tests e2e
# Asegúrate de que el servidor de desarrollo esté corriendo en otra terminal:
# npm run dev

Write-Host "Ejecutando tests e2e..." -ForegroundColor Green
Write-Host "Asegúrate de que el servidor esté corriendo en http://localhost:5173" -ForegroundColor Yellow

npx playwright test --reporter=list

Write-Host "`nPara ver el reporte HTML:" -ForegroundColor Cyan
Write-Host "npx playwright show-report" -ForegroundColor White

