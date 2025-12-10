/**
 * 🌱 Global Setup para Tests E2E
 * 
 * Este archivo se ejecuta UNA VEZ antes de todos los tests.
 * Crea datos de prueba en la base de datos.
 * 
 * COMPORTAMIENTO:
 * - Si STRICT_E2E_SETUP=true, falla si la API no está disponible
 * - Si la API no está disponible, los tests probablemente fallarán
 * - Crea usuario de test en MongoDB si no existe
 * - Siembra rutas de prueba para los tests
 */

// @ts-nocheck
/* eslint-disable @typescript-eslint/ban-ts-comment */
declare const process: { env: Record<string, string | undefined> };

import 'dotenv/config';
import { request } from '@playwright/test';
import { seedDatabase, getFirebaseIdToken } from './fixtures/seed-data';
import { MongoClient } from 'mongodb';

const API_URL =
  process.env.API_URL ||
  process.env.VITE_API_URL ||
  'http://127.0.0.1:8000';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/OneDayOneTrip_E2E';
const USER_UID = 'Cc2ug8QS2mTfoaQs48zTTL89QOi1';

// Si es true, el setup falla si la API no está disponible
const STRICT_MODE = process.env.STRICT_E2E_SETUP === 'true' || process.env.CI === 'true';

/**
 * Asigna las rutas creadas al perfil del usuario para que aparezcan en su perfil
 */
async function assignTripsToUserProfile(tripIds: string[]): Promise<void> {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB para asignar rutas');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Actualizar el perfil del usuario agregando las rutas a su array de publicacions
    const result = await usersCollection.updateOne(
      { userId: USER_UID },
      {
        $set: {
          publicacions: tripIds,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Asignadas ${tripIds.length} rutas al perfil del usuario`);
    } else {
      console.log('⚠️ No se pudo actualizar el perfil del usuario');
    }

  } catch (error: any) {
    console.log('⚠️ Error asignando rutas al perfil:', error.message);
  } finally {
    await client.close();
  }
}

async function createUserInMongoDB(): Promise<boolean> {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Verificar si el usuario ya existe
    const existing = await usersCollection.findOne({ userId: USER_UID });
    
    if (existing) {
      // Asegurar que el perfil es público para que las rutas sean visibles
      await usersCollection.updateOne(
        { userId: USER_UID },
        { $set: { isPrivate: false } }
      );
      console.log('✅ Usuario ya existe en MongoDB (perfil público verificado)');
      return true;
    }
    
    // Crear el usuario con perfil público para que las rutas sean visibles
    const user = {
      userId: USER_UID,
      username: 'testuser',
      fullName: 'Test User',
      email: 'testuser@testuser.com',
      bio: 'Usuario de prueba para tests E2E',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
      isPrivate: false, // Perfil público para que las rutas sean visibles sin autenticación
      llista_seguidors: [],
      llista_seguits: [],
      publicacions: [],
      guardades: [],
      llista_bloquejats: [],
      llista_bloquejadors: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await usersCollection.insertOne(user);
    console.log('✅ Usuario creado en MongoDB:', user.username);
    return true;
    
  } catch (error: any) {
    console.log('❌ Error con MongoDB:', error.message);
    if (STRICT_MODE) {
      throw new Error(`MongoDB no disponible: ${error.message}`);
    }
    return false;
  } finally {
    await client.close();
  }
}

/**
 * Crea el usuario de test en Firestore (donde la API busca usuarios)
 * Este es necesario porque la API de usuarios usa Firestore, no MongoDB
 */
async function createUserInFirestore(authToken?: string): Promise<boolean> {
  if (!authToken) {
    console.log('⚠️ No hay token de auth, no se puede crear usuario en Firestore');
    return false;
  }
  
  try {
    // Verificar si el usuario ya existe en Firestore via API
    const checkResponse = await fetch(`${API_URL}/users/${USER_UID}`);
    
    if (checkResponse.ok) {
      console.log('✅ Usuario ya existe en Firestore');
      return true;
    }
    
    // El usuario no existe, pero no podemos crearlo directamente sin autenticación
    // La creación en Firestore se hace al registrar via /users/register con token
    console.log('⚠️ Usuario no existe en Firestore - se creará al autenticarse');
    return false;
    
  } catch (error: any) {
    console.log('⚠️ Error verificando usuario en Firestore:', error.message);
    return false;
  }
}

async function verifyAPIAvailable(context: any): Promise<boolean> {
  console.log('🔍 Verificando conexión con API en', API_URL);
  
  try {
    const healthCheck = await context.get('/', { timeout: 10000 });
    
    if (healthCheck.ok()) {
      console.log('✅ API disponible');
      return true;
    }
    
    console.log(`❌ API respondió con status ${healthCheck.status()}`);
    return false;
  } catch (error: any) {
    console.log('❌ API no disponible:', error.message);
    return false;
  }
}

async function verifyTripsExist(context: any): Promise<number> {
  try {
    const response = await context.get('/trips', { timeout: 10000 });
    
    if (!response.ok()) {
      console.log(`⚠️ API /trips respondió con status ${response.status()}`);
      return 0;
    }
    
    const data = await response.json();
    const count = Array.isArray(data) ? data.length : 0;
    
    return count;
  } catch (error: any) {
    console.log('⚠️ Error verificando trips:', error.message);
    return 0;
  }
}

async function globalSetup() {
  console.log('\n🌱 ========================================');
  console.log('   GLOBAL SETUP - Creando datos de prueba');
  console.log(`   Modo: ${STRICT_MODE ? 'ESTRICTO' : 'PERMISIVO'}`);
  console.log('   ========================================\n');
  
  let setupSuccess = true;
  
  // 1. Crear usuario directamente en MongoDB
  console.log('🔧 Paso 1: Creando usuario de test en MongoDB...');
  const userCreated = await createUserInMongoDB();
  if (!userCreated && STRICT_MODE) {
    throw new Error('No se pudo crear/verificar usuario en MongoDB');
  }
  console.log();
  
  const context = await request.newContext({
    baseURL: API_URL,
    timeout: 30000
  });
  
  try {
    // 2. Verificar que la API está disponible
    console.log('🔧 Paso 2: Verificando API...');
    const apiAvailable = await verifyAPIAvailable(context);
    
    if (!apiAvailable) {
      if (STRICT_MODE) {
        throw new Error(`API no disponible en ${API_URL}. Los tests E2E no pueden ejecutarse sin backend.`);
      } else {
        console.log('⚠️ API no disponible. Los tests continuarán pero muchos fallarán.');
        console.log('   Para tests exitosos, inicie el backend con:');
        console.log('   cd api && uvicorn app.main:app --port 8000');
        console.log();
        await context.dispose();
        return;
      }
    }
    console.log();
    
    // 3. Obtener token Firebase si no se proporcionó explícitamente
    console.log('🔧 Paso 3: Obteniendo token de autenticación...');
    let authToken = process.env.E2E_AUTH_TOKEN;
    if (!authToken) {
      authToken = await getFirebaseIdToken(
        process.env.E2E_TEST_EMAIL,
        process.env.E2E_TEST_PASSWORD,
        process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
        true
      ) || undefined;
      
      if (authToken) {
        console.log('✅ Token de Firebase obtenido');
      } else {
        console.log('⚠️ No se pudo obtener token. Algunos tests requerirán autenticación.');
      }
    } else {
      console.log('✅ Token proporcionado via E2E_AUTH_TOKEN');
    }
    console.log();
    
    // 4. Sembrar trips de prueba
    console.log('🔧 Paso 4: Sembrando datos de prueba...');
    const tripIds = await seedDatabase(context, true, authToken);
    
    if (tripIds && tripIds.length > 0) {
      console.log(`✅ ${tripIds.length} rutas creadas`);
      
      // 5. Asignar las rutas creadas al perfil del usuario
      console.log('🔧 Paso 5: Asignando rutas al perfil del usuario...');
      await assignTripsToUserProfile(tripIds);
    } else {
      console.log('⚠️ No se crearon rutas nuevas');
    }
    console.log();
    
    // 6. Verificar que hay datos disponibles
    console.log('🔧 Paso 6: Verificando datos de prueba...');
    const tripCount = await verifyTripsExist(context);
    
    if (tripCount > 0) {
      console.log(`✅ ${tripCount} rutas disponibles para tests`);
    } else {
      if (STRICT_MODE) {
        throw new Error('No hay rutas disponibles para tests. El seed falló.');
      }
      console.log('⚠️ No hay rutas disponibles. Algunos tests fallarán.');
      setupSuccess = false;
    }
    
    console.log('\n========================================');
    if (setupSuccess) {
      console.log('✅ SETUP COMPLETADO EXITOSAMENTE');
    } else {
      console.log('⚠️ SETUP COMPLETADO CON ADVERTENCIAS');
    }
    console.log('========================================\n');
    
  } catch (error: any) {
    console.log('\n========================================');
    console.log('❌ ERROR EN GLOBAL SETUP');
    console.log('========================================');
    console.log('Error:', error.message);
    console.log();
    
    if (STRICT_MODE) {
      throw error;
    }
    
    console.log('Continuando en modo permisivo. Los tests probablemente fallarán.\n');
  } finally {
    await context.dispose();
  }
}

export default globalSetup;
