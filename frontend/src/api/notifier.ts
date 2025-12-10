import { getAuth } from "firebase/auth";


const API_URL = "https://onedayonetrip-api.onrender.com";

// ------------------------------
// Base helpers
// ------------------------------
async function apiGet(path: string) {
  const user = getAuth().currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}

async function apiPost(path: string, body: object) {
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

async function apiPut(path: string, body: object = {}) {
  const user = getAuth().currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
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
// 🔔 Notifications API
// ------------------------------

export async function getNotifications(userId: string, onlyUnread = false) {
  return apiGet(`/notifications/${userId}?unread=${onlyUnread}`);
}

export async function createNotification(data: {
  fromUserId: string;
  toUserId: string;
  type: "follow" | "comment" | "rating" | "follow_request" | "publication";
  message: string;
  extra?: object; // datos adicionales como nombre, avatar, título de ruta...
}) {
  return apiPost("/notifications", data);
}

export async function markNotificationAsRead(notificationId: string) {
  return apiPut(`/notifications/read/${notificationId}`);
}

export async function deleteNotification(notificationId: string) {
  const user = getAuth().currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch(`${API_URL}/notifications/${notificationId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}