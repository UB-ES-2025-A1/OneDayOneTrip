import { X, Mail, Bell, MessageCircle, Star } from "lucide-react";
import "../styles/MailBox.css";

export type NotificationType = "follow" | "comment" | "rating";

export type Notification = {
  id: string;
  type: NotificationType;
  fromUserName: string;
  fromUserAvatar?: string;
  tripTitle?: string;
  text: string;
  createdAt: string; 
  read: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  notifications?: Notification[];
  onMarkRead?: (id: string) => void; // NUEVO
};

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

export default function Mailbox({ open, onClose, notifications, onMarkRead }: Props) {
  if (!open) return null;

  const items = notifications || [];
  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div
      className="mailbox-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
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
              <span>
                Quan algú et segueixi, comenti o valori una ruta, ho veuràs aquí.
              </span>
            </div>
          ) : (
            <ul className="mailbox-list">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`mailbox-item ${n.read ? "read" : "unread"}`}
                  onClick={() => {
                    if (!n.read && onMarkRead) onMarkRead(n.id);
                  }}
                >
                  <div className="mailbox-icon">{getIcon(n.type)}</div>

                  <div className="mailbox-content">
                    <div className="mailbox-text">
                      <strong>{n.fromUserName}</strong>
                      <span> · </span>
                      <span>{n.text}</span>
                    </div>

                    <div className="mailbox-meta">
                      <span className="mailbox-date">{formatDate(n.createdAt)}</span>
                      {n.tripTitle && (
                        <span className="mailbox-trip">{n.tripTitle}</span>
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
