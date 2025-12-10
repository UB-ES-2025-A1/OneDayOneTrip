import { useEffect, useState } from "react";
import { getNotifications, markNotificationAsRead } from "../api/notifier";
import { getAuth } from "firebase/auth";
import type { Notification } from "../components/Mailbox";

export default function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const user = getAuth().currentUser;

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getNotifications(user.uid);
      setNotifications(data);
    } catch (err) {
      console.error("Error carregant notificacions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
    await fetchNotifications();
  };

  const removeLocal = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, loading, markRead, refreshNotifications, removeLocal };
}
