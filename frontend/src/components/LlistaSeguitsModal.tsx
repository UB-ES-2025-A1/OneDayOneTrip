import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { getUserById, followUser, unfollowUser } from "../api/client";
import "../styles/SeguidoresModal.css";

interface BackendUser {
  uid: string;
  nom_i_cognoms?: string;
  username?: string;
  url_foto_perfil?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  seguits: string[];
  currentUserId: string;
  goToProfile?: (uid: string) => void;
}

export default function LlistaSeguitsModal({
  open,
  onClose,
  seguits,
  currentUserId,
  goToProfile
}: Props) {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [localSeguits, setLocalSeguits] = useState<string[]>(seguits);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 🔄 Sync al actualitzar seguits des de fora
  useEffect(() => {
    setLocalSeguits(seguits);
  }, [seguits]);

  // 🔍 Carregar dades dels usuaris
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (!localSeguits || localSeguits.length === 0) {
          setUsers([]);
          return;
        }

        const fetchedUsers = await Promise.all(
          localSeguits.map(async (uid) => await getUserById(uid))
        );

        setUsers(fetchedUsers.filter(Boolean) as BackendUser[]);
      } catch (err) {
        console.error("Error carregant seguits:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open, localSeguits]);

  // ✨ Animacions
  useEffect(() => {
    if (!users || users.length === 0) return;
    const items = gsap.utils.toArray<HTMLElement>(".seguidor-item");
    gsap.fromTo(
      items,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }
    );
  }, [users]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="seguidores-card" ref={containerRef}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <h2 className="seguidores-title">Seguits</h2>

        {loading ? (
          <p className="seguidores-empty">Carregant...</p>
        ) : users.length === 0 ? (
          <p className="seguidores-empty">No segueixes a ningú.</p>
        ) : (
          <div className="seguidores-list">
            {users.map((u) => {
              const isFollowing = localSeguits.includes(u.uid);

              const handleToggleFollow = async (e: React.MouseEvent) => {
                e.stopPropagation(); // ❗ Evitar obrir el perfil al pulsar el botó

                try {
                  if (isFollowing) {
                    await unfollowUser(currentUserId, u.uid);
                    setLocalSeguits((prev) => prev.filter((id) => id !== u.uid));
                  } else {
                    await followUser(currentUserId, u.uid);
                    setLocalSeguits((prev) =>
                      prev.includes(u.uid) ? prev : [...prev, u.uid]
                    );
                  }
                } catch (err) {
                  console.error("Error canviant estat de seguir:", err);
                }
              };

              return (
                <div
                  key={u.uid}
                  className="seguidor-item"
                  onClick={() => goToProfile?.(u.uid)}
                >
                  <img
                    src={u.url_foto_perfil || "/images/default-profile.png"}
                    className="seguidor-foto"
                    alt={u.username || "usuari"}
                  />

                  <div className="seguidor-info">
                    <p className="seguidor-nom">{u.nom_i_cognoms || "Usuari"}</p>
                    <p className="seguidor-username">@{u.username || "unknown"}</p>
                  </div>

                  {/* 🔘 BOTÓ SEGUIR / DEIXAR DE SEGUIR */}
                  <button
                    className={
                      isFollowing
                        ? "seguidor-toggle-btn following"
                        : "seguidor-toggle-btn"
                    }
                    onClick={handleToggleFollow}
                  >
                    {isFollowing ? "Deixar de seguir" : "Seguir"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
