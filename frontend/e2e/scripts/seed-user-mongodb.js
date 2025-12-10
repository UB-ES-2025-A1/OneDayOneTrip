/**
 * Script para crear el usuario de test E2E directamente en MongoDB
 * Se ejecuta antes de los tests para asegurar que el usuario existe
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/OneDayOneTrip_E2E';
const USER_UID = 'Cc2ug8QS2mTfoaQs48zTTL89QOi1';

async function seedUser() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Verificar si el usuario ya existe
    const existing = await usersCollection.findOne({ userId: USER_UID });
    
    if (existing) {
      console.log('✅ Usuario ya existe en MongoDB');
      return;
    }
    
    // Crear el usuario
    const user = {
      userId: USER_UID,
      username: 'testuser',
      fullName: 'Test User',
      email: 'testuser@testuser.com',
      bio: 'Usuario de prueba para tests E2E',
      profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
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
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedUser();

