import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { getUserById, removeFollower } from "../api/client";
import "../styles/LlistaSeguidors.css";
import AvatarFallback from "../components/AvatarFallback";
import { useTranslation } from 'react-i18next'; // Importa el hook

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
  currentUserId: string;       
  goToProfile?: (uid: string) => void;
}

export default function LlistaSeguidorsModal({
  open,
  onClose,
  seguidors,
  currentUserId,
  goToProfile
}: Props) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [localSeguidors, setLocalSeguidors] = useState<string[]>(seguidors);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync cuando lleguen nuevos seguidors
  useEffect(() => {
    setLocalSeguidors(seguidors);
  }, [seguidors]);

  // Cargar usuarios
  useEffect(() => {
    if (!open) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (!localSeguidors || localSeguidors.length === 0) {
          setUsers([]);
          return;
        }

        const fetchedUsers = await Promise.all(
          localSeguidors.map(async (uid) => {
            const u = await getUserById(uid);
            return u ? { ...u } : null;
          })
        );
        setUsers(fetchedUsers.filter(Boolean) as BackendUser[]);
      } catch (err) {
        console.error(t('error_loading_followers'), err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open, localSeguidors, t]);

  // Animaciones
  useEffect(() => {
    if (!users || !users.length) return;
    const items = gsap.utils.toArray<HTMLElement>(".seguidor-item");
    gsap.fromTo(
      items,
      { opacity: 0, y: 20, filter: "blur(5px)" },
      { opacity: 1, y: 0, filter: "blur(0)", duration: 0.5, stagger: 0.1 }
    );
  }, [users]);

  // Función para eliminar seguidor
  const handleRemoveFollower = async (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFollower(currentUserId, uid);
      // Actualizamos estado local
      setLocalSeguidors((prev) => prev.filter((id) => id !== uid));
      setUsers((prev) => prev.filter((user) => user.uid !== uid));
    } catch (err) {
      console.error("Error eliminant seguidor:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="seguidores-card" ref={containerRef}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2 className="seguidores-title">{t('profile_stat_followers')}</h2>

        {loading ? (
          <p className="seguidores-empty">{t('general_loading')}</p>
        ) : users.length === 0 ? (
          <p className="seguidores-empty">{t('followers_modal_empty')}</p>
        ) : (
          <div className="seguidores-list">
            {users.map((u) => (
              <div key={u.uid} className="seguidor-item">
                <div
                  className="seguidor-click-zone"
                  onClick={() => goToProfile ? goToProfile(u.uid) : null}
                >
                  <div className="seguidor-foto">
                    {u.url_foto_perfil ? (
                      <img src={u.url_foto_perfil} alt={u.username || t('home_search_user')} />
                    ) : (
                      <AvatarFallback name={u.nom_i_cognoms || u.username || "?"} />
                    )}
                  </div>

                  <div className="seguidor-info">
                    <p className="seguidor-nom">{u.nom_i_cognoms || t('home_search_user')}</p>
                    <p className="seguidor-username">@{u.username || "unknown"}</p>
                  </div>
                </div>

                {/* BOTÓN ELIMINAR SEGUIDOR */}
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