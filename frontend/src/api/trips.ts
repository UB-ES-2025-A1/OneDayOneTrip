import { createNotification } from "../api/notifier"; 
import { getUserById } from "../api/client";

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

export interface Comment {
  _id: string;
  tripId: string;
  userId: string;
  userName: string;
  userProfilePicture?: string | null;  // opcional / pot ser null
  text: string;
  createdAt: string;                   // ISO string des de el backend
}



// ==========================================================
// 🌍 Base URL
// ==========================================================

const RAW_BASE_URL = "http://127.0.0.1:8000";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

// ==========================================================
// 🔍 Obtenir totes les trips
// ==========================================================

export async function getAllTrips(includeStats: boolean = false): Promise<Trip[]> {
  const res = await fetch(`${BASE_URL}/trips?include_stats=${includeStats}`);
  if (!res.ok) throw new Error(`Error carregant les rutes: ${res.status}`);
  return await res.json();
}

// ==========================================================
// 🔍 Obtenir trip per ID
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
// 🔍 Obtenir comentaris d'una trip
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
    throw new Error(
      `Error carregant comentaris de la ruta: ${tripId}. ${text}`
    );
  }

  const data = await res.json();

  // Backend: { comments: [...] }
  const comments = (data?.comments ?? []) as Comment[];

  return comments;
}


// ==========================================================
// 📝 Crear un comentari per una trip
// ==========================================================
export async function createTripComment(
  tripId: string,
  data: {
    userId: string;
    userName: string;
    userProfilePicture?: string;
    text: string;
  }
): Promise<Comment> {

  // 1️⃣ Obtenemos la trip para saber quién es el autor
  const trip = await getTripById(tripId);
  const toUserId = trip.author.userId;

  // 2️⃣ Creamos el comentario en backend
  const url = `${BASE_URL}/trips/${encodeURIComponent(tripId)}/comments`;

  const payload = {
    tripId,
    userId: data.userId,
    userName: data.userName,
    userProfilePicture: data.userProfilePicture ?? "",
    text: data.text,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error creant comentari (${tripId}): ${text}`);
  }

  const dataRes = await res.json();
  const comment = dataRes.comment as Comment;

  // 3️⃣ NOTIFICACIÓN para el autor (si no comenta él mismo)
  if (data.userId !== toUserId) {
    await createNotification({
      fromUserId: data.userId,
      toUserId,
      type: "comment",
      message: "ha comentat la teva ruta",
      extra: {
        fromUserName: data.userName,
        fromUserAvatar: data.userProfilePicture,
        tripTitle: trip.title,
      },
    });
  }

  return comment;
}



// ==========================================================
// ✨ Payload per crear trips (TripCreateIn)
// ==========================================================

export interface TripCreatePayload {
  title: string;
  description: string;
  category?: string;
  tags: string[];

  author: {
    userId: string;
    name: string | null | undefined;
    profilePic?: string | null | undefined;
  };

  city: string;
  region?: string;
  country?: string;

  routeMap: Coordinates[];

  trip_points: {
    title: string;
    description: string;
    coordinates: { lat: number; lng: number };
  }[];

  distance?: number;
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

  // JSON requerit per FastAPI
  formData.append("trip_json", JSON.stringify(tripPayload));

  if (cover) {
    formData.append("cover", cover);
  }

  gallery.forEach((file) => {
    formData.append("gallery", file);
  });

  pointImages.forEach((file) => {
    if (file) formData.append("point_images", file);
  });

  // 1️⃣ Crear la nueva ruta en backend
  const res = await fetch(`${BASE_URL}/trips/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errMsg = await res.text().catch(() => "");
    throw new Error(errMsg || "Error creant la ruta");
  }

  const tripData = await res.json(); // contiene trip creada con _id

  // 2️⃣ Obtener seguidores del autor
  const authorId = tripPayload.author.userId;
  const authorName = tripPayload.author.name ?? "";
  const authorPic = tripPayload.author.profilePic ?? "";

  const authorBackendUser = await getUserById(authorId);
  const followers: string[] = authorBackendUser.llista_seguidors ?? [];

  // 3️⃣ Crear notificación para cada seguidor
  for (const followerId of followers) {
    await createNotification({
      fromUserId: authorId,
      toUserId: followerId,
      type: "publication",
      message: "ha publicat una nova ruta",
      extra: {
        fromUserName: authorName,
        fromUserAvatar: authorPic,
        tripTitle: tripPayload.title,
      },
    });
  }

  return tripData;
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
  rating: number;
  date?: string;
}

export async function rateTrip(
  tripId: string,
  payload: RateTripPayload & { userName?: string; userProfilePicture?: string }
): Promise<TripRatingStats> {
  
  // 1️⃣ Obtener info del autor para notificar
  const trip = await getTripById(tripId);
  const toUserId = trip.author.userId;

  // 2️⃣ Enviar rating al backend
  const res = await fetch(`${BASE_URL}/ratings/trip/${encodeURIComponent(tripId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: payload.userId,
      rating: payload.rating,
      date: payload.date ?? new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Error valorant la ruta: ${res.status}. ${text}`);
  }

  const stats = await res.json();

  // 3️⃣ NOTIFICACIÓN
  if (payload.userId !== toUserId) {
    await createNotification({
      fromUserId: payload.userId,
      toUserId,
      type: "rating",
      message: `ha valorat la teva ruta amb ${payload.rating} ★`,
      extra: {
        fromUserName: payload.userName,
        fromUserAvatar: payload.userProfilePicture,
        tripTitle: trip.title,
      },
    });
  }

  return stats;
}
