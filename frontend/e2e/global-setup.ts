/**
 * 🌱 Global Setup para Tests E2E
 * 
 * Este archivo se ejecuta UNA VEZ antes de todos los tests.
 * Crea datos de prueba en la base de datos.
 */

import 'dotenv/config';
import { request } from '@playwright/test';
import { seedDatabase, getFirebaseIdToken } from './fixtures/seed-data';

const API_URL =
  process.env.API_URL ||
  process.env.VITE_API_URL ||
  'http://localhost:8000';

async function globalSetup() {
  console.log('\n🌱 ========================================');
  console.log('   GLOBAL SETUP - Creando datos de prueba');
  console.log('   ========================================\n');
  
  const context = await request.newContext({
    baseURL: API_URL
  });
  
  try {
    // 1. Verificar que la API está disponible
    console.log('🔍 Verificando conexión con API...');
    const healthCheck = await context.get('/').catch(() => null);
    
    if (!healthCheck || !healthCheck.ok()) {
      console.log('⚠️  API no disponible en', API_URL);
      console.log('   Los tests continuarán pero pueden fallar algunas verificaciones\n');
      await context.dispose();
      return;
    }
    console.log('✅ API disponible\n');
    
    // 2. Obtener token Firebase si no se proporcionó explícitamente
    let authToken = process.env.E2E_AUTH_TOKEN;
    if (!authToken) {
      authToken = await getFirebaseIdToken(
        process.env.E2E_TEST_EMAIL,
        process.env.E2E_TEST_PASSWORD,
        process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
        true
      ) || undefined;
    }
    
    // 3. Sembrar datos usando el helper centralizado
    await seedDatabase(context, true, authToken);
    
    console.log('\n✅ Setup completado\n');
    console.log('========================================\n');
    
  } catch (error) {
    console.log('❌ Error en global setup:', error);
  } finally {
    await context.dispose();
  }
}

export default globalSetup;

