import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!open) return; // solo cargar si el modal está abierto

    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (!seguits || seguits.length === 0) {
          setUsers([]);
          console.log("No hi ha usuaris a mostrar");
          return;
        }

        const fetchedUsers = await Promise.all(
          seguits.map(async (uid) => {
            const user = await getUserById(uid);
            console.log("Fetched user for UID", uid, user);
            return user;
          })
        );

        setUsers(fetchedUsers.filter(Boolean) as BackendUser[]); // filtramos posibles null/undefined
      } catch (err) {
        console.error("Error carregant seguits:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open, seguits]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="seguidores-card">
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
