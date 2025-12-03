import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { getUserById } from "../api/client";
import { removeFollower } from "../api/client"; // ⭐ AFEGIT
import "../styles/LlistaSeguidors.css";

interface BackendUser {
  uid: string;
  nom_i_cognoms?: string;
  username?: string;
  url_foto_perfil?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  seguidors: string[];
  goToProfile?: (uid: string) => void;
}

export default function LlistaSeguidorsModal({ open, onClose, seguidors, goToProfile }: Props) {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ⭐ FUNCION PARA ELIMINAR UN SEGUIDOR
  const handleRemoveFollower = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // evita navegar al perfil

    try {
      const currentUser = localStorage.getItem("uid");
      if (!currentUser) return;

      await removeFollower(currentUser, targetId);

      // Quitarlo de la UI sin recargar
      setUsers((prev) => prev.filter((u) => u.uid !== targetId));
    } catch (err) {
      console.error("Error eliminant seguidor:", err);
    }
  };

  // ---------------- LOAD USERS ----------------
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (!seguidors || seguidors.length === 0) {
          setUsers([]);
          return;
        }

        const fetchedUsers = await Promise.all(
          seguidors.map(async (uid) => {
            const u = await getUserById(uid);
            return u ? { ...u } : null;
          })
        );

        setUsers(fetchedUsers.filter(Boolean) as BackendUser[]);
      } catch (err) {
        console.error("Error carregant seguidors:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open, seguidors]);

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
        <h2 className="seguidores-title">Seguidors</h2>

        {loading ? (
          <p className="seguidores-empty">Carregant...</p>
        ) : users.length === 0 ? (
          <p className="seguidores-empty">Encara no tens cap seguidor</p>
        ) : (
          <div className="seguidores-list">
            {users.map((u) => (
              <div
                key={u.uid}
                className="seguidor-item"
                onClick={() => goToProfile ? goToProfile(u.uid) : null}
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

                {/* ⭐ BOTÓN ELIMINAR */}
                <button
                  className="remove-follower-btn"
                  onClick={(e) => handleRemoveFollower(u.uid, e)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
