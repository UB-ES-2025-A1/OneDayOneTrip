/**
 * Script para crear el usuario de test E2E en Firebase
 * 
 * Ejecutar con: npx ts-node e2e/create-test-user.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Configuración de Firebase (debe coincidir con tu .env)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyALNA2dn61Rm2lsLYTpI_xB04Qz2a1fxHY",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "onedayonecity-c82dd.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "onedayonecity-c82dd",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "onedayonecity-c82dd.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "960538828647",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:960538828647:web:eb72e2ff1077a4bdee99c2",
};

// Credenciales del usuario de test
const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL || "testuser@testuser.com";
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "testuser";

async function createTestUser() {
  console.log('\n🔧 Creando usuario de test E2E en Firebase...\n');
  console.log('📧 Email:', E2E_TEST_EMAIL);
  console.log('🔑 Password:', E2E_TEST_PASSWORD);
  console.log('🔥 Proyecto:', firebaseConfig.projectId);
  console.log('');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Crear usuario
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      E2E_TEST_EMAIL,
      E2E_TEST_PASSWORD
    );

    console.log('✅ Usuario creado exitosamente!');
    console.log('📝 UID:', userCredential.user.uid);
    console.log('📧 Email:', userCredential.user.email);
    console.log('\n✨ Ahora puedes ejecutar los tests E2E: npm run test:e2e\n');

  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('✅ El usuario ya existe en Firebase');
      console.log('✨ Puedes ejecutar los tests E2E: npm run test:e2e\n');
    } else if (error.code === 'auth/weak-password') {
      console.log('❌ Error: La contraseña es demasiado débil (debe tener al menos 6 caracteres)');
      console.log('💡 Solución: Cambia E2E_TEST_PASSWORD en tu .env a una contraseña más fuerte\n');
    } else {
      console.error('❌ Error al crear usuario:', error.code || error.message);
      console.error('');
      throw error;
    }
  }
}

// Ejecutar
createTestUser().catch(console.error);

