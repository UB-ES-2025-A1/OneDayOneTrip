import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { getUserById } from "../api/client";
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
  goToProfile?: (uid: string) => void;
}

export default function LlistaSeguitsModal({ open, onClose, seguits, goToProfile }: Props) {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (!seguits || seguits.length === 0) {
          setUsers([]);
          return;
        }

        const fetchedUsers = await Promise.all(
          seguits.map(async (uid) => await getUserById(uid))
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
  }, [open, seguits]);

  // Animación GSAP al mostrar usuarios
  useEffect(() => {
    if (!users || users.length === 0) return;
    const items = gsap.utils.toArray<HTMLElement>(".seguidor-item");
    gsap.fromTo(
      items,
      { opacity: 0, y: 20, filter: "blur(5px)" },
      { opacity: 1, y: 0, filter: "blur(0)", duration: 0.5, stagger: 0.1, ease: "power2.out" }
    );
  }, [users]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="seguidores-card" ref={containerRef}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="seguidores-title">Seguits</h2>

        {loading ? (
          <p className="seguidores-empty">Carregant...</p>
        ) : users.length === 0 ? (
          <p className="seguidores-empty">No segueixes ningú.</p>
        ) : (
          <div className="seguidores-list">
            {users.map((u) => (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
