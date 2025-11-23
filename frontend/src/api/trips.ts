// ==========================================================
// 📌 Interfaces base (Trip, TripPoint, Comment…)
// ==========================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TripPoint {
  title: string;
  description: string;
  coordinates: Coordinates;
  image?: string;
  location_name?: string;
}

export interface Author {
  userId: string;
  name: string;
  profilePic?: string;
}

export interface Trip {
  _id?: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  author: Author;
  city: string;
  region?: string;
  country?: string;
  routeMap: Coordinates[];        // <-- siempre array
  trip_points: TripPoint[];
  distance?: number;
  duration?: string;
  difficulty?: string;
  recommendedSeason?: string;
  coverImage?: string;
  gallery: string[];
  avgRating?: number;
  numRatings?: number;
}

// Comentarios
export interface Comment {
  _id: string;
  tripId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string; // ISO string
}

// ==========================================================
// 🌍 Base URL
// ==========================================================

const RAW_BASE_URL = "http://127.0.0.1:8000";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

// ==========================================================
// 🔍 Obtener todas las trips
// ==========================================================

export async function getAllTrips(includeStats: boolean = false): Promise<Trip[]> {
  const res = await fetch(`${BASE_URL}/trips?include_stats=${includeStats}`);
  if (!res.ok) throw new Error(`Error carregant les rutes: ${res.status}`);
  return await res.json();
}

// ==========================================================
// 🔍 Obtener trip por ID
// ==========================================================

export async function getTripById(tripId: string): Promise<Trip> {
  const res = await fetch(`${BASE_URL}/trips/${encodeURIComponent(tripId)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ruta no trobada o id invàlid: ${tripId}. ${text}`);
  }
  return await res.json();
}

// ==========================================================
// 🔍 Obtener comentarios de una trip
// ==========================================================

export async function getTripComments(
  tripId: string,
  limit: number = 20,
  skip: number = 0
): Promise<Comment[]> {
  const url = `${BASE_URL}/trips/${encodeURIComponent(tripId)}/comments?limit=${limit}&skip=${skip}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error carregant comentaris de la ruta: ${tripId}. ${text}`);
  }

  const data = await res.json();
  return data.comments || [];
}

// ==========================================================
// ✨ Payload para crear trips (TripCreateIn)
// ==========================================================

export interface TripCreatePayload {
  title: string;
  description: string;
  category?: string;
  tags: string[];

  author: {
    userId: string;                     // <-- corregido
    name: string | null | undefined;
    profilePic?: string | null | undefined;
  };

  city: string;
  region?: string;
  country?: string;

  routeMap: Coordinates[];             // <-- DEBE ser array

  trip_points: {
    title: string;
    description: string;
    coordinates: { lat: number; lng: number };
  }[];

  distance?: number;                   // <-- corregido (número)
  duration?: string;
  difficulty?: string;
  recommendedSeason?: string;
}

// ==========================================================
// 🚀 Crear trip (multipart/form-data)
// ==========================================================

export async function createTripMultipart(
  tripPayload: TripCreatePayload,
  cover: File | null,
  gallery: File[],
  pointImages: (File | null)[]
) {
  const formData = new FormData();

  // JSON requerido por FastAPI
  formData.append("trip_json", JSON.stringify(tripPayload));

  // portada
  if (cover) {
    formData.append("cover", cover);
  }

  // galería
  gallery.forEach((file) => {
    formData.append("gallery", file);
  });

  // imágenes de cada punto
  pointImages.forEach((file) => {
    if (file) formData.append("point_images", file);
  });

  const res = await fetch(`${BASE_URL}/trips/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errMsg = await res.text().catch(() => "");
    throw new Error(errMsg || "Error creant la ruta");
  }

  return await res.json();
}


// ==========================================================
// ⭐ Valorar una trip
// ==========================================================

export interface TripRatingStats {
  tripId: string;
  avgRating: number;
  numRatings: number;
}

export interface RateTripPayload {
  userId: string;
  rating: number;      // por ejemplo 1-5
  date?: string;       // ISO string opcional
}

export async function rateTrip(
  tripId: string,
  payload: RateTripPayload
): Promise<TripRatingStats> {
  const res = await fetch(`${BASE_URL}/ratings/trip/${encodeURIComponent(tripId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: payload.userId,
      rating: payload.rating,
      // si no viene date, mandamos la fecha actual
      date: payload.date ?? new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error valorant la ruta: ${res.status}. ${text}`);
  }

  // 👇 aquí el backend devuelve lo que saque get_trip_rating_stats(trip_id)
  const data = await res.json();
  return data as TripRatingStats;
}
