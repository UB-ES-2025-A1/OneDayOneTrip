import { useEffect, useState } from "react";
import { getNotifications, markNotificationAsRead } from "../api/notifier";
import { getAuth } from "firebase/auth";
import type { Notification } from "../components/Mailbox";

export default function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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
    }

    fetchData();
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

  return { notifications, loading, markRead };
}
