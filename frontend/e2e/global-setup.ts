/**
 * 🌱 Global Setup para Tests E2E
 * 
 * Este archivo se ejecuta UNA VEZ antes de todos los tests.
 * Crea datos de prueba en la base de datos.
 */

import { request } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'http://localhost:8001';

// Usuario de prueba
const TEST_USER = {
  userId: 'e2e-test-user-001',
  username: 'e2e_tester',
  fullName: 'E2E Test User',
  email: 'e2e-test@onedayonetrip.com',
  bio: 'Usuario de prueba para E2E tests',
  profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=e2e-tester'
};

// Rutas de prueba (formato según TripCreateIn model)
const TEST_TRIPS = [
  {
    title: 'Montserrat - Ruta del Monasterio',
    description: 'Una ruta espectacular por la montaña de Montserrat. Ideal para un día de senderismo con vistas impresionantes.',
    category: 'Senderisme',
    region: 'Catalunya',
    country: 'Espanya',
    city: 'Montserrat',
    difficulty: 'Mitjana',
    recommendedSeason: 'Primavera',
    distance: 12.5,
    duration: '5h',
    tags: ['Muntanya', 'Natura', 'Cultura'],
    author: {
      userId: TEST_USER.userId,
      name: TEST_USER.fullName,
      profilePic: TEST_USER.profilePicture
    },
    routeMap: [],
    trip_points: [
      { title: 'Monasterio', description: 'Inicio', coordinates: { lat: 41.5933, lng: 1.8375 } },
      { title: 'Sant Joan', description: 'Mirador', coordinates: { lat: 41.6000, lng: 1.8400 } },
      { title: 'Sant Jeroni', description: 'Cima', coordinates: { lat: 41.6050, lng: 1.8350 } }
    ]
  },
  {
    title: 'Costa Brava - Camí de Ronda',
    description: 'Recorrido costero por los acantilados de la Costa Brava, pasando por calas escondidas.',
    category: 'Costanera',
    region: 'Catalunya',
    country: 'Espanya',
    city: 'Tossa de Mar',
    difficulty: 'Fàcil',
    recommendedSeason: 'Estiu',
    distance: 8,
    duration: '3h',
    tags: ['Platja', 'Mar', 'Natura'],
    author: {
      userId: TEST_USER.userId,
      name: TEST_USER.fullName,
      profilePic: TEST_USER.profilePicture
    },
    routeMap: [],
    trip_points: [
      { title: 'Tossa de Mar', description: 'Inicio', coordinates: { lat: 41.7189, lng: 2.9319 } },
      { title: 'Cala Pola', description: 'Cala', coordinates: { lat: 41.7150, lng: 2.9400 } }
    ]
  },
  {
    title: 'Barcelona - Ruta Modernista',
    description: 'Descubre las joyas del modernismo catalán: Sagrada Familia, Casa Batlló, Park Güell.',
    category: 'Urbana',
    region: 'Catalunya',
    country: 'Espanya',
    city: 'Barcelona',
    difficulty: 'Fàcil',
    recommendedSeason: 'Tot lany',
    distance: 6,
    duration: '4h',
    tags: ['Cultura', 'Arquitectura', 'Ciutat'],
    author: {
      userId: TEST_USER.userId,
      name: TEST_USER.fullName,
      profilePic: TEST_USER.profilePicture
    },
    routeMap: [],
    trip_points: [
      { title: 'Sagrada Familia', description: 'Inicio', coordinates: { lat: 41.4036, lng: 2.1744 } },
      { title: 'Casa Batlló', description: 'Passeig de Gràcia', coordinates: { lat: 41.3916, lng: 2.1649 } },
      { title: 'Park Güell', description: 'Final', coordinates: { lat: 41.4145, lng: 2.1527 } }
    ]
  }
];

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
    
    // 2. Crear usuario de prueba
    console.log('👤 Creando usuario de prueba...');
    const userResponse = await context.post('/users/register', {
      data: TEST_USER
    }).catch(() => null);
    
    if (userResponse?.ok()) {
      console.log('✅ Usuario creado:', TEST_USER.username);
    } else {
      console.log('ℹ️  Usuario ya existe o error:', userResponse?.status() || 'sin respuesta');
    }
    
    // 3. Crear rutas de prueba
    console.log('\n📍 Creando rutas de prueba...');
    for (const trip of TEST_TRIPS) {
      const tripResponse = await context.post('/trips/', {
        multipart: {
          trip_json: JSON.stringify(trip)
        }
      }).catch(() => null);
      
      if (tripResponse?.ok()) {
        console.log(`   ✅ ${trip.title}`);
      } else {
        console.log(`   ⚠️  ${trip.title} - Error:`, tripResponse?.status() || 'sin respuesta');
      }
    }
    
    console.log('\n✅ Setup completado\n');
    console.log('========================================\n');
    
  } catch (error) {
    console.log('❌ Error en global setup:', error);
  } finally {
    await context.dispose();
  }
}

export default globalSetup;

