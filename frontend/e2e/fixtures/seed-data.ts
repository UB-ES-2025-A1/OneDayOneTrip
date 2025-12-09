/**
 * 🌱 Seed Data para Tests E2E
 * 
 * Funciones para crear datos de prueba directamente via API
 * antes de ejecutar los tests que dependen de ellos.
 */

import { APIRequestContext } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'http://localhost:8001';

export interface TestTrip {
  _id?: string;
  title: string;
  description: string;
  category: string;
  region: string;
  country: string;
  city: string;
  difficulty: string;
  recommendedSeason: string;
  distance: number;
  duration: string;
  tags: string[];
  author: {
    userId: string;
    name: string;
    profilePic?: string;
  };
  routeMap: any[];
  trip_points: Array<{
    title: string;
    description: string;
    coordinates?: { lat: number; lng: number };
  }>;
}

export interface TestUser {
  userId: string;
  username: string;
  fullName: string;
  email: string;
}

// Usuario de prueba para E2E
export const TEST_USER: TestUser = {
  userId: 'e2e-test-user-001',
  username: 'e2e_tester',
  fullName: 'E2E Test User',
  email: 'e2e-test@onedayonetrip.com'
};

// Ruta de prueba para E2E
export const TEST_TRIP: TestTrip = {
  title: 'Ruta E2E de Prueba - Montserrat',
  description: 'Una ruta espectacular por la montaña de Montserrat creada para tests E2E. Incluye vistas panorámicas y puntos de interés histórico.',
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
    profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=e2e-tester'
  },
  routeMap: [],
  trip_points: [
    {
      title: 'Inicio - Monasterio',
      description: 'Punto de partida desde el monasterio de Montserrat',
      coordinates: { lat: 41.5933, lng: 1.8375 }
    },
    {
      title: 'Mirador Sant Joan',
      description: 'Vistas espectaculares del valle',
      coordinates: { lat: 41.6000, lng: 1.8400 }
    },
    {
      title: 'Cima - Sant Jeroni',
      description: 'Punto más alto de Montserrat a 1236m',
      coordinates: { lat: 41.6050, lng: 1.8350 }
    }
  ]
};

// Más rutas de prueba para tener variedad
export const ADDITIONAL_TEST_TRIPS: Partial<TestTrip>[] = [
  {
    title: 'Costa Brava - Camí de Ronda',
    description: 'Recorrido costero por los acantilados de la Costa Brava',
    category: 'Costanera',
    region: 'Catalunya',
    country: 'Espanya',
    city: 'Tossa de Mar',
    difficulty: 'Fàcil',
    recommendedSeason: 'Estiu',
    distance: 8,
    duration: '3h',
    tags: ['Platja', 'Mar', 'Natura'],
  },
  {
    title: 'Pirineos - Valle de Arán',
    description: 'Ruta por el espectacular Valle de Arán',
    category: 'Alta Muntanya',
    region: 'Catalunya',
    country: 'Espanya',
    city: 'Vielha',
    difficulty: 'Difícil',
    recommendedSeason: 'Estiu',
    distance: 18,
    duration: '8h',
    tags: ['Muntanya', 'Neu', 'Aventura'],
  }
];

/**
 * Crea un usuario de prueba en la base de datos
 */
export async function seedTestUser(request: APIRequestContext): Promise<TestUser> {
  try {
    const response = await request.post(`${API_URL}/users/register`, {
      data: {
        userId: TEST_USER.userId,
        username: TEST_USER.username,
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        bio: 'Usuario de prueba para E2E tests',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=e2e-tester'
      }
    });
    
    if (response.ok()) {
      console.log('✅ Usuario de prueba creado:', TEST_USER.username);
    } else {
      // El usuario puede ya existir, no es error
      console.log('ℹ️ Usuario de prueba ya existe o error:', response.status());
    }
    
    return TEST_USER;
  } catch (error) {
    console.log('⚠️ Error creando usuario de prueba:', error);
    return TEST_USER;
  }
}

/**
 * Crea una ruta de prueba en la base de datos
 */
export async function seedTestTrip(request: APIRequestContext, trip: TestTrip = TEST_TRIP): Promise<string | null> {
  try {
    // Primero asegurarnos de que el usuario existe
    await seedTestUser(request);
    
    // Crear la ruta usando el endpoint de trips
    const tripData = {
      title: trip.title,
      description: trip.description,
      category: trip.category,
      region: trip.region,
      country: trip.country,
      city: trip.city,
      difficulty: trip.difficulty,
      recommendedSeason: trip.recommendedSeason,
      distance: trip.distance,
      duration: trip.duration,
      tags: trip.tags,
      author: trip.author,
      routeMap: trip.routeMap || [],
      trip_points: trip.trip_points || []
    };

    const response = await request.post(`${API_URL}/trips/`, {
      multipart: {
        trip_json: JSON.stringify(tripData)
      }
    });
    
    if (response.ok()) {
      const data = await response.json();
      console.log('✅ Ruta de prueba creada:', trip.title);
      return data._id || data.id || null;
    } else {
      const errorText = await response.text();
      console.log('⚠️ Error creando ruta:', response.status(), errorText);
      return null;
    }
  } catch (error) {
    console.log('⚠️ Error en seedTestTrip:', error);
    return null;
  }
}

/**
 * Seed completo: crea usuario y varias rutas de prueba
 */
export async function seedDatabase(request: APIRequestContext): Promise<void> {
  console.log('🌱 Iniciando seed de base de datos E2E...');
  
  // Crear usuario de prueba
  await seedTestUser(request);
  
  // Crear ruta principal
  await seedTestTrip(request, TEST_TRIP);
  
  // Crear rutas adicionales
  for (const tripPartial of ADDITIONAL_TEST_TRIPS) {
    const fullTrip: TestTrip = {
      ...TEST_TRIP,
      ...tripPartial,
      _id: undefined,
      author: TEST_TRIP.author,
      routeMap: [],
      trip_points: TEST_TRIP.trip_points
    };
    await seedTestTrip(request, fullTrip);
  }
  
  console.log('✅ Seed completado');
}

/**
 * Limpia los datos de prueba
 */
export async function cleanupTestData(request: APIRequestContext): Promise<void> {
  try {
    // Eliminar rutas del usuario de prueba
    const response = await request.delete(`${API_URL}/users/${TEST_USER.userId}`);
    
    if (response.ok()) {
      console.log('🧹 Datos de prueba eliminados');
    }
  } catch (error) {
    console.log('⚠️ Error limpiando datos:', error);
  }
}

