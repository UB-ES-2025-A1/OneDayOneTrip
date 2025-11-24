import "../styles/Comments.css";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ca";
import { createTripComment, getTripComments, type Comment } from "../api/trips";

interface CommentsProps {
  tripId: string;
  currentUser: any | null;
  backendUser: any | null;
}

export default function Comments({ tripId, currentUser, backendUser }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    const load = async () => {
        try {
        setLoading(true);

        const data = await getTripComments(tripId);

        // 🔥 Aseguramos orden: MÁS NUEVO ARRIBA
        const sorted = (Array.isArray(data) ? data : []).sort(
            (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setComments(sorted);
        } catch (err) {
        console.error("Error carregant comentaris:", err);
        } finally {
        setLoading(false);
        }
    };
    load();
    }, [tripId]);




  // 🔹 Enviar nuevo comentario
  const handleSubmit = async () => {
    if (!currentUser) {
      alert("Has d'iniciar sessió per escriure un comentari.");
      return;
    }
    if (!backendUser) {
      alert("Error: usuari backend no carregat.");
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
          "Usuari",
        userProfilePicture: backendUser.url_foto_perfil,
        text: newComment.trim(),
      };

      const created = await createTripComment(tripId, payload);

      setComments((prev) => [created, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error("Error creant comentari:", err);
      setError("No s'ha pogut enviar el comentari.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ruta-comentaris">
      <h2 className="comentaris-titol">Comentaris ({comments.length})</h2>

      {/* 🔹 Si está logueado -> formulario */}
      {currentUser && backendUser ? (
        <div className="comentari-nou">
          <div className="comentari-nou-avatar">
            <img
              src={backendUser.url_foto_perfil || "/images/person.png"}
              alt="Tu"
            />
          </div>

          <div className="comentari-nou-main">
            <textarea
              className="comentari-nou-input"
              placeholder="Afegeix un comentari..."
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
                {sending ? "Enviant..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="comentaris-login-hint">
          Inicia sessió per deixar un comentari.
        </p>
      )}

      {/* 🔹 Lista de comentarios */}
      {loading ? (
        <p className="comentaris-loading">Carregant comentaris...</p>
      ) : comments.length === 0 ? (
        <p className="comentaris-buits">Encara no hi ha comentaris.</p>
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
