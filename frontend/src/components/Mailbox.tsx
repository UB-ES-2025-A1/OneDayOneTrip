import { X, Mail, Bell, MessageCircle, Star } from "lucide-react";
import "../styles/MailBox.css";
import { accept_follow_request, reject_follow_request } from "../api/client";
import { auth } from "../firebase";
import { deleteNotification } from "../api/notifier";
import { useTranslation } from 'react-i18next';

export type NotificationType = "follow" | "follow_request" | "comment" | "rating";

export type Notification = {
  id: string;
  type: NotificationType;
  fromUserId: string;
  toUserId: string;
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
  onMarkRead?: (id: string) => void;
  onAfterAccept?: (id: string) => Promise<void> | void;
  onAfterReject?: (id: string) => Promise<void> | void;
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
    case "follow_request":
      return <Mail size={18} />;
    case "comment":
      return <MessageCircle size={18} />;
    case "rating":
      return <Star size={18} />;
    default:
      return <Mail size={18} />;
  }
}

export default function Mailbox({ open, onClose, notifications, onMarkRead, onAfterAccept, onAfterReject }: Props) {
    const { t } = useTranslation();
    if (!open) return null;

  const items = notifications || [];
  const unreadCount = items.filter((n) => !n.read).length;

  const handleAccept = async (notification: Notification) => {
    if (!auth.currentUser) return;

    const currentUserId = auth.currentUser.uid;
    const fromUserId = notification.fromUserId;

    try {
      if (!fromUserId) {
        alert(t('error_accepting'));
      } else {
        await accept_follow_request(currentUserId, fromUserId);
      }
    } catch (err) {
      console.error(err);
      alert();
    } finally {
      await deleteNotification(notification.id);
      if (onAfterAccept) {
        try {
          await onAfterAccept(notification.id);
        } catch (cbErr) {
          console.error(t('error_after_accept'), cbErr);
        }
      }
    }
  };

const handleReject = async (notification: Notification) => {
  if (!auth.currentUser) return;

  const currentUserId = auth.currentUser.uid;
  const fromUserId = notification.fromUserId;

  try {
    if (!fromUserId) {
      alert(t('error_rejecting'));
    } else {
      await reject_follow_request(currentUserId, fromUserId); // rebutjar la sol·licitud
    }
  } catch (err) {
    console.error(err);
    alert(t('error_rejecting_request'));
  } finally {
    await deleteNotification(notification.id);  // eliminar la notificació
    if (onAfterReject) {
      try {
        await onAfterReject(notification.id);
      } catch (cbErr) {
        console.error(t('error_after_reject'), cbErr);
      }
    }
  }
};

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
            <span>{t('notifications')}</span>
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
              <p>{t('no_notifications')}</p>
              <span>
                {t('info_mailbox')}
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

                  {n.type === "follow_request" && !n.read && (
                    <div className="follow-request-actions">
                      <button onClick={() => handleAccept(n)}>{t('accept')}</button>
                      <button onClick={() => handleReject(n)}>{t('reject')}</button>
                    </div>
                  )}

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
