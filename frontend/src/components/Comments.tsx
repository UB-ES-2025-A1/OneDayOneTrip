import "../styles/Comments.css";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ca";
import { createTripComment, getTripComments, type Comment } from "../api/trips";
import { useTranslation } from 'react-i18next'; // Importa el hook

interface CommentsProps {
  tripId: string;
  currentUser: any | null;
  backendUser: any | null;
}

export default function Comments({ tripId, currentUser, backendUser }: CommentsProps) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    const load = async () => {
        try {
        setLoading(true);

        const data = await getTripComments(tripId,20, 0, t);

        // 🔥 Assegurem ordre: més nou primer
        const sorted = (Array.isArray(data) ? data : []).sort(
            (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setComments(sorted);
        } catch (err) {
        console.error(t('comments_error_loading'), err);
        } finally {
        setLoading(false);
        }
    };
    load();
    }, [tripId]);




  // 🔹 Enviar nou comentari
  const handleSubmit = async () => {
    if (!currentUser) {
      alert(t('comments_have_to_login'));
      return;
    }
    if (!backendUser) {
      alert(t('comments_error_backend_user'));
      return;
    }
    if (!newComment.trim()) return;

    try {
      setSending(true);
      setError(null);

      const payload = {
        userId: backendUser.uid,
        userName:
          backendUser.nom_i_cognoms ||
          backendUser.username ||
          backendUser.mail?.split("@")[0] ||
          t('general_user'),
        userProfilePicture: backendUser.url_foto_perfil,
        text: newComment.trim(),
      };

      const created = await createTripComment(tripId, payload, t);

      setComments((prev) => [created, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error(t('comments_error_creating'), err);
      setError(t('comments_error_sending'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ruta-comentaris">
      <h2 className="comentaris-titol">{t('comments_title')} ({comments.length})</h2>

      {/* 🔹 Si està loguejat -> formulari */}
      {currentUser && backendUser ? (
        <div className="comentari-nou">
          <div className="comentari-nou-avatar">
            <img
              src={backendUser.url_foto_perfil || "/images/person.png"}
              alt={t('comments_person')}
            />
          </div>

          <div className="comentari-nou-main">
            <textarea
              className="comentari-nou-input"
              placeholder={t('comments_add_placeholder')}
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />

            <div className="comentari-nou-actions">
              {error && <span className="comentari-error">{error}</span>}
              <button
                className="comentari-submit-btn"
                disabled={sending || !newComment.trim()}
                onClick={handleSubmit}
              >
                {sending ? t('general_sending') : t('general_send')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="comentaris-login-hint">
          {t('comments_error_login_hint')}
        </p>
      )}

      {/* 🔹 Llista de comentaris */}
      {loading ? (
        <p className="comentaris-loading">{t('comments_loading')}</p>
      ) : comments.length === 0 ? (
        <p className="comentaris-buits">{t('comments_empty')}</p>
      ) : (
        <ul className="comentaris-llista">
          {comments.map((c) => (
            <li key={c._id} className="comentari-item">
              <div className="comentari-header">
                <div className="comentari-autor-info">
                  <div className="comentari-avatar">
                    <img
                      src={c.userProfilePicture || "/images/person.png"}
                      alt={c.userName}
                    />
                  </div>

                  <div>
                    <span className="comentari-autor">{c.userName}</span>

                    <span className="comentari-data">
                      {dayjs(c.createdAt)
                        .locale("ca")
                        .format("DD MMM YYYY - HH:mm")}
                    </span>
                  </div>
                </div>
              </div>

              <p className="comentari-contingut">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
