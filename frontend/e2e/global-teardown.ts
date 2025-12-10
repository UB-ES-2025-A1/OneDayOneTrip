/**
 * 🧹 Global Teardown para Tests E2E
 * 
 * Este archivo se ejecuta UNA VEZ después de todos los tests.
 * Limpia los datos de prueba de la base de datos.
 */

import { request } from '@playwright/test';
import { cleanupTestData } from './fixtures/seed-data';

const API_URL =
  process.env.API_URL ||
  process.env.VITE_API_URL ||
  'http://localhost:8000';

async function globalTeardown() {
  console.log('\n🧹 ========================================');
  console.log('   GLOBAL TEARDOWN - Limpiando datos de prueba');
  console.log('   ========================================\n');
  
  const context = await request.newContext({
    baseURL: API_URL
  });
  
  try {
    // Verificar que la API está disponible
    const healthCheck = await context.get('/').catch(() => null);
    
    if (!healthCheck || !healthCheck.ok()) {
      console.log('⚠️  API no disponible, saltando limpieza\n');
      await context.dispose();
      return;
    }
    
    await cleanupTestData(context);
    
    console.log('\n✅ Limpieza completada');
    console.log('========================================\n');
    
  } catch (error) {
    console.log('⚠️ Error en limpieza:', error);
  } finally {
    await context.dispose();
  }
}

export default globalTeardown;

