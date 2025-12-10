/**
 * 🌱 Seed Data para Tests E2E
 * 
 * Funciones para crear datos de prueba directamente via API
 * antes de ejecutar los tests que dependen de ellos.
 */

import { APIRequestContext } from '@playwright/test';

const API_URL =
  process.env.API_URL ||
  process.env.VITE_API_URL ||
  'http://127.0.0.1:8000';

/**
 * Obtiene un idToken de Firebase Auth usando REST.
 * Devuelve null si falta alguna credencial o la petición falla.
 */
export async function getFirebaseIdToken(
  email: string | undefined,
  password: string | undefined,
  apiKey: string | undefined,
  verbose = false
): Promise<string | null> {
  if (!email || !password || !apiKey) {
    if (verbose) {
      console.log('⚠️ Falta email/password/apiKey para obtener idToken de Firebase');
    }
    return null;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    if (!res.ok) {
      if (verbose) {
        console.log('⚠️ Firebase Auth devolvió error', res.status, await res.text());
      }
      return null;
    }

    const data = (await res.json()) as { idToken?: string };
    if (verbose) {
      console.log('✅ idToken obtenido de Firebase');
    }
    return data.idToken || null;
  } catch (error) {
    if (verbose) {
      console.log('⚠️ Error obteniendo idToken de Firebase:', error);
    }
    return null;
  }
}

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
  coverImage?: string;
  gallery?: string[];
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
    image?: string;
  }>;
}

export interface TestUser {
  userId: string;
  username: string;
  fullName: string;
  email: string;
}

// Usuario de prueba para E2E (debe coincidir con el usuario real de Firebase)
export const TEST_USER: TestUser = {
  userId: 'Cc2ug8QS2mTfoaQs48zTTL89QOi1',  // UID real del usuario testuser@testuser.com en Firebase
  username: 'testuser',
  fullName: 'Test User E2E',
  email: 'testuser@testuser.com'  // Email real del usuario de Firebase
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
  // Imágenes de placeholder para tests E2E
  coverImage: 'https://picsum.photos/seed/montserrat1/800/600',
  gallery: [
    'https://picsum.photos/seed/montserrat1/800/600',
    'https://picsum.photos/seed/montserrat2/800/600',
    'https://picsum.photos/seed/montserrat3/800/600'
  ],
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
      coordinates: { lat: 41.5933, lng: 1.8375 },
      image: 'https://picsum.photos/seed/montserrat-point1/800/600'
    },
    {
      title: 'Mirador Sant Joan',
      description: 'Vistas espectaculares del valle',
      coordinates: { lat: 41.6000, lng: 1.8400 },
      image: 'https://picsum.photos/seed/montserrat-point2/800/600'
    },
    {
      title: 'Cima - Sant Jeroni',
      description: 'Punto más alto de Montserrat a 1236m',
      coordinates: { lat: 41.6050, lng: 1.8350 },
      image: 'https://picsum.photos/seed/montserrat-point3/800/600'
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
    coverImage: 'https://picsum.photos/seed/costabrava1/800/600',
    gallery: [
      'https://picsum.photos/seed/costabrava1/800/600',
      'https://picsum.photos/seed/costabrava2/800/600'
    ],
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
    coverImage: 'https://picsum.photos/seed/pirineos1/800/600',
    gallery: [
      'https://picsum.photos/seed/pirineos1/800/600',
      'https://picsum.photos/seed/pirineos2/800/600'
    ],
  }
];

/**
 * Crea un usuario de prueba en la base de datos
 * NOTA: Esta función es llamada por global-setup.ts, no debería llamarse desde tests individuales
 */
export async function seedTestUser(
  request: APIRequestContext,
  verbose = false,
  authToken?: string
): Promise<TestUser> {
  try {
    const response = await request.post(`${API_URL}/users/register`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      data: {
        userId: TEST_USER.userId,
        username: TEST_USER.username,
        fullName: TEST_USER.fullName,
        email: TEST_USER.email,
        bio: 'Usuario de prueba para E2E tests',
        profilePicture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=e2e-tester'
      }
    });
    
    if (verbose) {
      if (response.ok()) {
        console.log('✅ Usuario de prueba creado:', TEST_USER.username);
      } else {
        console.log('ℹ️ Usuario ya existe o requiere auth:', response.status());
      }
    }
    
    return TEST_USER;
  } catch (error) {
    if (verbose) {
      console.log('⚠️ Error creando usuario:', error);
    }
    return TEST_USER;
  }
}

/**
 * Crea una ruta de prueba en la base de datos
 * NOTA: Esta función es llamada por global-setup.ts, no debería llamarse desde tests individuales
 */
export async function seedTestTrip(
  request: APIRequestContext,
  trip: TestTrip = TEST_TRIP,
  verbose = false
): Promise<string> {
  try {
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
      const tripId = data._id || data.id;
      if (verbose) {
        console.log('✅ Ruta creada:', trip.title, `(ID: ${tripId})`);
      }
      return tripId;
    } else {
      if (verbose) {
        const errorText = await response.text();
        console.log('⚠️ Error creando ruta:', response.status(), errorText);
      }
      throw new Error(`Failed to create trip: ${response.status()}`);
    }
  } catch (error) {
    if (verbose) {
      console.log('⚠️ Error en seedTestTrip:', error);
    }
    throw error;
  }
}

/**
 * Seed completo: crea usuario y varias rutas de prueba
 * Esta función se llama desde global-setup.ts con verbose=true
 */
export async function seedDatabase(
  request: APIRequestContext,
  verbose = true,
  authToken?: string
): Promise<string[]> {
  if (verbose) console.log('🌱 Iniciando seed de base de datos E2E...');

  const createdTripIds: string[] = [];

  // Crear usuario de prueba
  await seedTestUser(request, verbose, authToken);

  // Crear ruta principal
  try {
    const mainTripId = await seedTestTrip(request, TEST_TRIP, verbose);
    if (mainTripId) createdTripIds.push(mainTripId);
  } catch (error) {
    console.log('⚠️ Error creando ruta principal, continuando...');
  }

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
    try {
      const tripId = await seedTestTrip(request, fullTrip, verbose);
      if (tripId) createdTripIds.push(tripId);
    } catch (error) {
      console.log(`⚠️ Error creando ruta adicional "${tripPartial.title}", continuando...`);
    }
  }

  if (verbose) console.log(`✅ Seed completado - ${createdTripIds.length} rutas creadas`);

  return createdTripIds;
}

/**
 * Limpia los datos de prueba
 */
export async function cleanupTestData(request: APIRequestContext): Promise<void> {
  try {
    const tripsResponse = await request.get(`${API_URL}/trips/`);
    if (tripsResponse.ok()) {
      const trips = await tripsResponse.json();
      const candidates = trips.filter(
        (trip: any) =>
          trip?.author?.userId === TEST_USER.userId ||
          String(trip?.title || '').toLowerCase().includes('e2e')
      );

      for (const trip of candidates) {
        const res = await request.delete(`${API_URL}/trips/${trip._id}`);
        if (res.ok()) {
          console.log(`🧹 Eliminada trip de prueba: ${trip.title}`);
        }
      }
    }

    // Intentar eliminar usuario si existe (requerirá auth si el backend lo exige)
    await request.delete(`${API_URL}/users/${TEST_USER.userId}`).catch(() => null);
  } catch (error) {
    console.log('⚠️ Error limpiando datos:', error);
  }
}

