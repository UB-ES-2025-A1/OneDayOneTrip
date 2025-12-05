// src/components/Mailbox.tsx
import React from "react";
import { X, Mail, Bell, MessageCircle, Star } from "lucide-react";
import "../styles/Mailbox.css";

export type NotificationType = "follow" | "comment" | "rating";

export type Notification = {
  id: string;
  type: NotificationType;
  fromUserName: string;
  fromUserAvatar?: string;
  tripTitle?: string;
  text: string;
  createdAt: string; // ISO string o el que vulguis
  read: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  notifications?: Notification[]; // opcional, per quan tinguis backend
};

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "follow",
    fromUserName: "Anna",
    text: "Anna t'ha començat a seguir",
    createdAt: "2025-12-05T10:00:00Z",
    read: false,
  },
  {
    id: "2",
    type: "comment",
    fromUserName: "Marc",
    tripTitle: "Ruta per Montjuïc",
    text: "Marc ha comentat la teva ruta 'Ruta per Montjuïc'",
    createdAt: "2025-12-03T18:22:00Z",
    read: true,
  },
  {
    id: "3",
    type: "rating",
    fromUserName: "Clara",
    tripTitle: "Caminada per la Costa Brava",
    text: "Clara ha valorat la teva ruta amb 5 estrelles",
    createdAt: "2025-12-02T09:10:00Z",
    read: false,
  },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ca-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getIcon(type: NotificationType) {
  switch (type) {
    case "follow":
      return <Bell size={18} />;
    case "comment":
      return <MessageCircle size={18} />;
    case "rating":
      return <Star size={18} />;
    default:
      return <Mail size={18} />;
  }
}

export default function Mailbox({ open, onClose, notifications }: Props) {
  if (!open) return null;

  const items = notifications && notifications.length > 0
    ? notifications
    : mockNotifications;

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="mailbox-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="mailbox-panel">
        <header className="mailbox-header">
          <div className="mailbox-title">
            <Mail size={20} />
            <span>Notificacions</span>
            {unreadCount > 0 && (
              <span className="mailbox-badge">{unreadCount}</span>
            )}
          </div>
          <button className="mailbox-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="mailbox-body">
          {items.length === 0 ? (
            <div className="mailbox-empty">
              <p>No tens notificacions encara.</p>
              <span>Quan algú et segueixi, comenti o valori una ruta, ho veuràs aquí.</span>
            </div>
          ) : (
            <ul className="mailbox-list">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`mailbox-item ${n.read ? "read" : "unread"}`}
                >
                  <div className="mailbox-icon">
                    {getIcon(n.type)}
                  </div>

                  <div className="mailbox-content">
                    <div className="mailbox-text">
                      <strong>{n.fromUserName}</strong>
                      <span> · </span>
                      <span>{n.text}</span>
                    </div>
                    <div className="mailbox-meta">
                      <span className="mailbox-date">
                        {formatDate(n.createdAt)}
                      </span>
                      {n.tripTitle && (
                        <span className="mailbox-trip">
                          {n.tripTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {!n.read && <span className="mailbox-dot" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
