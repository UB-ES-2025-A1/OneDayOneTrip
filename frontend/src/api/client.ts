import { getAuth } from "firebase/auth";
import { createNotification } from "../api/notifier";

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) throw new Error("❌ VITE_API_URL is not defined");

// ------------------------------
// Helpers base
// ------------------------------
async function getAuthHeaders(): Promise<Headers> {
  const headers = new Headers();

  const user = getAuth().currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: await getAuthHeaders(), // Headers es válido como HeadersInit
  });

  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}

export async function apiPost(path: string, body: object) {
  const headers = await getAuthHeaders();
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}

// ------------------------------
// Usuarios
// ------------------------------
export async function registerUser(data: {
  fullname: string;
  username: string;
  mail: string;
  isPrivate?: boolean;
}) {
  return apiPost("/users/register", data);
}

export async function getCurrentUser() {
  return apiGet("/users/me");
}

export async function getUserById(userId: string) {
  return apiGet(`/users/${userId}`);
}

export async function getAllUsers() {
  return apiGet("/users");
}

export async function searchUsers(
  query: string,
  currentUserId?: string,
  blockedByMe?: string[]
) {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  if (currentUserId) params.append("current_user_id", currentUserId);
  if (blockedByMe?.length) {
    params.append("blocked_by_me", JSON.stringify(blockedByMe));
  }

  return apiGet(`/users/search?${params.toString()}`);
}

// ------------------------------
// 🔥 Actualizar usuario (multipart)
// ------------------------------
export async function updateUser(
  userId: string,
  jsonData: Record<string, any>,
  fotoPerfil?: File | null,
  fotoPanell?: File | null
) {
  const headers = await getAuthHeaders();

  const formData = new FormData();
  formData.append("user_json", JSON.stringify(jsonData));
  if (fotoPerfil) formData.append("foto_perfil", fotoPerfil);
  if (fotoPanell) formData.append("foto_panell", fotoPanell);

  const res = await fetch(`${API_URL}/users/update/${userId}`, {
    method: "PATCH",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Error updating user");
  }

  return res.json();
}


// ------------------------------
// Follows
// ------------------------------
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
    console.warn("⚠️ No s'ha pogut crear notificació d'unfollow:", e);
  }

  return res;
}

export async function cancel_follow_request(userId: string, targetId: string) {
  return apiPost(`/users/cancel_follow_request/${userId}/${targetId}`, {});
}

export async function accept_follow_request(userId: string, targetId: string) {
  return apiPost(`/users/accept_follow_request/${userId}/${targetId}`, {});
}

export async function reject_follow_request(userId: string, targetId: string) {
  return apiPost(`/users/reject_follow_request/${userId}/${targetId}`, {});
}

// ------------------------------
// Saves, blocks, publicaciones
// ------------------------------
export async function saveTrip(userId: string, tripId: string) {
  return apiPost(`/users/save/${userId}/${tripId}`, {});
}

export async function unsaveTrip(userId: string, tripId: string) {
  return apiPost(`/users/unsave/${userId}/${tripId}`, {});
}

export async function blockUser(userId: string, targetId: string) {
  return apiPost(`/users/block/${userId}/${targetId}`, {});
}

export async function unblockUser(userId: string, targetId: string) {
  return apiPost(`/users/unblock/${userId}/${targetId}`, {});
}

export async function addPublicationToUser(userId: string, tripId: string) {
  return apiPost(`/users/${userId}/publicacions/${tripId}`, {});
}

export async function removeFollower(userId: string, targetId: string) {
  return apiPost(`/users/removefollower/${userId}/${targetId}`, {});
}

export async function deleteTripById(tripId: string) {
  return apiDelete(`/trips/${tripId}`);
}

export async function removePublication(userId: string, tripId: string) {
  return apiDelete(`/users/${userId}/publicacions/${tripId}`);
}

export async function deleteTripAndPublication(userId: string, tripId: string) {
  await deleteTripById(tripId);
  await removePublication(userId, tripId);
}

export async function deleteAccount(userId: string) {
  return apiDelete(`/users/delete/${userId}`);
}
