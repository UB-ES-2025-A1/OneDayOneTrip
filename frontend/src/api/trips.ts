export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TripPoint {
  title: string;
  description: string;
  coordinates: Coordinates;
  image?: string;
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
  routeMap?: string;
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

const RAW_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

/**
 * Obté totes les rutes disponibles.
 * @param includeStats Si és true, inclou estadístiques (avgRating, numRatings)
 */
export async function getAllTrips(includeStats: boolean = false): Promise<Trip[]> {
  const res = await fetch(`${BASE_URL}/trips?include_stats=${includeStats}`);
  if (!res.ok) {
    throw new Error(`Error carregant les rutes: ${res.status}`);
  }
  return await res.json();
}

/**
 * Obté una ruta concreta pel seu ID (ObjectId de Mongo).
 * @param tripId ID de la ruta (24 caràcters hex)
 */
export async function getTripById(tripId: string): Promise<Trip> {
  const res = await fetch(`${BASE_URL}/trips/${encodeURIComponent(tripId)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ruta no trobada o id invàlid: ${tripId}. ${text}`);
  }
  return await res.json();
}

/**
 * Crea una nova ruta amb dades i imatges (multipart/form-data)
 * @param tripData Dades principals del viatge
 * @param cover Imatge de portada
 * @param gallery Galeria d’imatges
 * @param pointImages Imatges dels punts de la ruta
 */
export async function createTrip(
  tripData: Trip,
  cover?: File | null,
  gallery?: File[],
  pointImages?: File[]
): Promise<any> {
  const formData = new FormData();
  formData.append("trip_json", JSON.stringify(tripData));

  if (cover) formData.append("cover", cover);
  if (gallery) gallery.forEach((img) => formData.append("gallery", img));
  if (pointImages) pointImages.forEach((img) => formData.append("point_images", img));

  const res = await fetch(`${BASE_URL}/trips/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Error creant la ruta: ${errorText || res.status}`);
  }

  return await res.json();
}
