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

Write-Host "`n📦 Levantando MongoDB con Docker..." -ForegroundColor Yellow

# Levantar MongoDB
docker-compose -f docker-compose.e2e.yml up mongo-e2e -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error levantando MongoDB" -ForegroundColor Red
    exit 1
}

Write-Host "✅ MongoDB iniciado en puerto 27018" -ForegroundColor Green

# Esperar a que MongoDB esté listo
Write-Host "`n⏳ Esperando a que MongoDB esté listo..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 1
    $attempt++
    $healthy = docker exec onedayonetrip-mongo-e2e mongosh --eval "db.adminCommand('ping')" 2>$null
} while (-not $healthy -and $attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "❌ MongoDB no respondió a tiempo" -ForegroundColor Red
    exit 1
}

Write-Host "✅ MongoDB está listo!" -ForegroundColor Green

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "📋 Siguiente paso: Inicia el backend API" -ForegroundColor White
Write-Host ""
Write-Host "   En una terminal nueva, ejecuta:" -ForegroundColor Gray
Write-Host "   cd api" -ForegroundColor White
Write-Host "   `$env:MONGO_URI='mongodb://localhost:27018/OneDayOneTrip_E2E'" -ForegroundColor White
Write-Host "   python -m uvicorn app.main:app --port 8001" -ForegroundColor White
Write-Host ""
Write-Host "📋 Luego: Inicia el frontend" -ForegroundColor White
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

