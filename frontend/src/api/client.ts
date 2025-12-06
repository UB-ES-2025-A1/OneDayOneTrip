import { getAuth } from "firebase/auth";

const API_URL = "http://127.0.0.1:8000"; // o 

//url local = http://127.0.0.1:8000 

// url production = https://onedayonetrip-api.onrender.com

// url preproduction = https://onedayonetrip.onrender.com


// ------------------------------
// Funcions base genèriques
// ------------------------------
export async function apiGet(path: string) {
  const user = getAuth().currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}

export async function apiPost(path: string, body: object) {
  const user = getAuth().currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}

// ------------------------------
// Endpoints d'usuaris
// ------------------------------

// Registrar usuari (nou endpoint FastAPI)
export async function registerUser(data: {
  fullname: string;
  username: string;
  mail: string;
}) {
  return apiPost("/users/register", data);
}

// Obtenir l'usuari autenticat
export async function getCurrentUser() {
  return apiGet("/users/me");
}

// Obtenir un usuari pel seu ID (públic o autenticat)
export async function getUserById(userId: string) {
  return apiGet(`/users/${userId}`);
}

// Obtenir tots els usuaris (només si està autenticat)
export async function getAllUsers() {
  return apiGet("/users");
}
// Seguir un usuari
export async function followUser(userId: string, targetId: string) {
  return apiPost(`/users/follow/${userId}/${targetId}`, {});
}
// Deixar de seguir un usuari
export async function unfollowUser(userId: string, targetId: string) {
  return apiPost(`/users/unfollow/${userId}/${targetId}`, {});
}

// Guardar una ruta
export async function saveTrip(userId: string, tripId: string) {
  return apiPost(`/users/save/${userId}/${tripId}`, {});
}

// Treure una ruta guardada
export async function unsaveTrip(userId: string, tripId: string) {
  return apiPost(`/users/unsave/${userId}/${tripId}`, {});
}
  
// Afegir una publicació a l'usuari
export async function addPublicationToUser(userId: string, tripId: string) {
  return apiPost(`/users/${userId}/publicacions/${tripId}`, {});
}
