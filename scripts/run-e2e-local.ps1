# ============================================================
# 🎭 Script para ejecutar tests E2E localmente (Windows PowerShell)
# ============================================================

Write-Host "🚀 Iniciando entorno E2E para OneDayOneTrip" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Verificar Docker
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker no está corriendo. Por favor, inicia Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Levantando MongoDB + API con Docker..." -ForegroundColor Yellow

# Levantar MongoDB + API
docker-compose -f docker-compose.e2e.yml up api-e2e -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error levantando infraestructura E2E (mongo/api)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ MongoDB en 27018 y API en 8000" -ForegroundColor Green

# Esperar a que MongoDB esté listo
Write-Host "`n⏳ Esperando a que MongoDB esté listo..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 1
    $attempt++
    $mongoHealthy = docker exec onedayonetrip-mongo-e2e mongosh --eval "db.adminCommand('ping')" 2>$null
    $apiHealthy = (curl -s http://127.0.0.1:8000/) 2>$null
} while ((-not $mongoHealthy -or -not $apiHealthy) -and $attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "❌ Infraestructura E2E no respondió a tiempo" -ForegroundColor Red
    exit 1
}

Write-Host "✅ MongoDB y API están listos!" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "📋 Inicia el frontend" -ForegroundColor White
Write-Host ""
Write-Host "   En otra terminal:" -ForegroundColor Gray
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📋 Finalmente: Ejecuta los tests" -ForegroundColor White
Write-Host ""
Write-Host "   npm run test:e2e        # Ejecutar todos" -ForegroundColor White
Write-Host "   npm run test:e2e:ui     # Con interfaz visual" -ForegroundColor White
Write-Host "   npm run test:e2e:headed # Ver navegador" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`n🧹 Para limpiar cuando termines:" -ForegroundColor Yellow
Write-Host "   docker-compose -f docker-compose.e2e.yml down -v" -ForegroundColor Gray


