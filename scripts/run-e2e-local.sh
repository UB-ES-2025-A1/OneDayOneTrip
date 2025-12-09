#!/bin/bash
# ============================================================
# 🎭 Script para ejecutar tests E2E localmente (Linux/Mac)
# ============================================================

set -e

echo "🚀 Iniciando entorno E2E para OneDayOneTrip"
echo "============================================"

# Verificar Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor, inicia Docker."
    exit 1
fi

echo ""
echo "📦 Levantando MongoDB con Docker..."

# Levantar MongoDB
docker-compose -f docker-compose.e2e.yml up mongo-e2e -d

if [ $? -ne 0 ]; then
    echo "❌ Error levantando MongoDB"
    exit 1
fi

echo "✅ MongoDB iniciado en puerto 27018"

# Esperar a que MongoDB esté listo
echo ""
echo "⏳ Esperando a que MongoDB esté listo..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec onedayonetrip-mongo-e2e mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo "✅ MongoDB está listo!"
        break
    fi
    sleep 1
    ((attempt++))
done

if [ $attempt -ge $max_attempts ]; then
    echo "❌ MongoDB no respondió a tiempo"
    exit 1
fi

echo ""
echo "============================================"
echo "📋 Siguiente paso: Inicia el backend API"
echo ""
echo "   En una terminal nueva, ejecuta:"
echo "   cd api"
echo "   export MONGO_URI='mongodb://localhost:27018/OneDayOneTrip_E2E'"
echo "   python -m uvicorn app.main:app --port 8001"
echo ""
echo "📋 Luego: Inicia el frontend"
echo ""
echo "   En otra terminal:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "📋 Finalmente: Ejecuta los tests"
echo ""
echo "   npm run test:e2e        # Ejecutar todos"
echo "   npm run test:e2e:ui     # Con interfaz visual"
echo "   npm run test:e2e:headed # Ver navegador"
echo "============================================"

echo ""
echo "🧹 Para limpiar cuando termines:"
echo "   docker-compose -f docker-compose.e2e.yml down -v"

