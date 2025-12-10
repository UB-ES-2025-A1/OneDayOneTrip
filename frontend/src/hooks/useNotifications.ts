import { useEffect, useState } from "react";
import { getNotifications, markNotificationAsRead } from "../api/notifier";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { Notification } from "../components/Mailbox";

export default function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  const fetchNotifications = async (userId?: string) => {
    const uid = userId || auth.currentUser?.uid;

    if (!uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getNotifications(uid);
      setNotifications(data);
    } catch (err) {
      console.error("Error carregant notificacions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      fetchNotifications(user.uid);
    });

    return () => unsubscribe();
  }, [auth]);

  const markRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Error marcant com llegida:", err);
    }
  };

  const refreshNotifications = async () => {
    setLoading(true);
    await fetchNotifications();
  };

  const removeLocal = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, loading, markRead, refreshNotifications, removeLocal };
}
