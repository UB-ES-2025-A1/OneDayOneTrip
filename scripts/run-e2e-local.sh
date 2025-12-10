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
echo "📦 Levantando MongoDB + API con Docker..."

# Levantar MongoDB + API
docker-compose -f docker-compose.e2e.yml up api-e2e -d

if [ $? -ne 0 ]; then
    echo "❌ Error levantando infraestructura E2E (mongo/api)"
    exit 1
fi

echo "✅ MongoDB iniciado en puerto 27018 y API en 8000"

# Esperar a que MongoDB esté listo
echo ""
echo "⏳ Esperando a que MongoDB esté listo..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    mongo_ready=$(docker exec onedayonetrip-mongo-e2e mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1 && echo "ok" || echo "")
    api_ready=$(curl -s http://127.0.0.1:8000/ > /dev/null && echo "ok" || echo "")
    
    if [ -n "$mongo_ready" ] && [ -n "$api_ready" ]; then
        echo "✅ MongoDB y API están listos!"
        break
    fi
    sleep 1
    ((attempt++))
done

if [ $attempt -ge $max_attempts ]; then
    echo "❌ Infraestructura E2E no respondió a tiempo"
    exit 1
fi

echo ""
echo "============================================"
echo "📋 Inicia el frontend"
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


