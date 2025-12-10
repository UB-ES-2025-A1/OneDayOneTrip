import { getAuth } from "firebase/auth";
import { createNotification } from "../api/notifier";

const API_URL = "http://127.0.0.1:8000"; // o

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
  isPrivate?: boolean;
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
  const res = await apiPost(`/users/follow/${userId}/${targetId}`, {});

  try {
    const userData = await getUserById(userId);

    await createNotification({
      fromUserId: userId,
      toUserId: targetId,
      type: "follow",
      message: "ha començat a seguir-te",
      extra: {
        fromUserName: userData.nom_i_cognoms ?? userData.username ?? "",
        fromUserAvatar: userData.url_foto_perfil ?? "",
      },
    });
  } catch (e) {
    console.warn("⚠️ No s'ha pogut crear la notificació de follow:", e);
  }

  return res;
}

// Enviar sol·licitud de seguiment
export async function askToFollowUser(userId: string, targetId: string) {
  const res = await apiPost(`/users/askToFollowUser/${userId}/${targetId}`, {});

  try {
    const userData = await getUserById(userId);
    const targetUserData = await getUserById(targetId);

    if (targetUserData.isPrivate) {
      await createNotification({
        fromUserId: userId,
        toUserId: targetId,
        type: "follow_request",
        message: "t'ha enviat una sol·licitud de seguiment",
        extra: {
          fromUserName: userData.nom_i_cognoms ?? userData.username ?? "",
          fromUserAvatar: userData.url_foto_perfil ?? "",
          actionButton: true,
        },
      });
    }
  } catch (e) {
    console.warn("⚠️ No s'ha pogut crear la sol·licitud de follow:", e);
  }

  return res;
}

// Deixar de seguir un usuari
export async function unfollowUser(userId: string, targetId: string) {
  const res = await apiPost(`/users/unfollow/${userId}/${targetId}`, {});

  try {
    const userData = await getUserById(userId);

    await createNotification({
      fromUserId: userId,
      toUserId: targetId,
      type: "follow",
      message: "ha deixat de seguir-te",
      extra: {
        fromUserName: userData.nom_i_cognoms ?? userData.username ?? "",
        fromUserAvatar: userData.url_foto_perfil ?? "",
      },
    });
  } catch (e) {
    console.warn("⚠️ No s'ha pogut crear la notificació de unfollow:", e);
  }

  return res;
}

// Eliminar sol·licitud de seguiment
export async function cancel_follow_request(userId: string, targetId: string) {
  return apiPost(`/users/cancel_follow_request/${userId}/${targetId}`, {});
}

// Acceptar sol·licitud de seguiment
export async function accept_follow_request(userId: string, targetId: string) {
  return apiPost(`/users/accept_follow_request/${userId}/${targetId}`, {});
}

// Rebutjar sol·licitud de seguiment
export async function reject_follow_request(userId: string, targetId: string) {
  return apiPost(`/users/reject_follow_request/${userId}/${targetId}`, {});
}

// Guardar una ruta
export async function saveTrip(userId: string, tripId: string) {
  return apiPost(`/users/save/${userId}/${tripId}`, {});
}

// Deixar de guardar una ruta
export async function unsaveTrip(userId: string, tripId: string) {
  return apiPost(`/users/unsave/${userId}/${tripId}`, {});
}

// Bloquejar un usuari
export async function blockUser(userId: string, targetId: string) {
  return apiPost(`/users/block/${userId}/${targetId}`, {});
}
// Deixar de bloquejar un usuari
export async function unblockUser(userId: string, targetId: string) {
  return apiPost(`/users/unblock/${userId}/${targetId}`, {});
}

// 📌 Añadir una publicación al usuario
export async function addPublicationToUser(userId: string, tripId: string) {
  return apiPost(`/users/${userId}/publicacions/${tripId}`, {});
}

// Eliminar un follower
export async function removeFollower(userId: string, targetId: string) {
  return apiPost(`/users/removefollower/${userId}/${targetId}`, {});
}

// ------------------------------
// DELETE helpers
// ------------------------------
export async function apiDelete(path: string) {
  const user = getAuth().currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}

// Eliminar una trip (backend: DELETE /trips/{trip_id})
export async function deleteTripById(tripId: string) {
  return apiDelete(`/trips/${tripId}`);
}

// Eliminar una publicació de l’usuari
// backend: DELETE /users/{user_id}/publicacions/{trip_id}
export async function removePublication(userId: string, tripId: string) {
  return apiDelete(`/users/${userId}/publicacions/${tripId}`);
}

export async function deleteTripAndPublication(userId: string, tripId: string) {
  await deleteTripById(tripId);
  await removePublication(userId, tripId);
}

// eliminar compte completament (backend: DELETE /users/delete/{user_id})
export async function deleteAccount(userId: string) {
  return apiDelete(`/users/delete/${userId}`);
}
