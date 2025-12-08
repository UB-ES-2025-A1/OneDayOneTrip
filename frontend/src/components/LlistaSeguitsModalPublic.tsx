import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { getUserById } from "../api/client";
import "../styles/LlistaS.css";
import AvatarFallback from "./AvatarFallback";
import { useTranslation } from 'react-i18next';

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

export default function LlistaSeguitsModalPublic({
  open,
  onClose,
  seguits,
  currentUserId,
  goToProfile
}: Props) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [localSeguits, setLocalSeguits] = useState<string[]>(seguits);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync al actualizar seguits
  useEffect(() => {
    setLocalSeguits(seguits);
  }, [seguits]);

  // Cargar datos de usuarios
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
        console.error(t('error_loading_followed'), err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open, localSeguits, t]);

  // Animaciones
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
        <button className="close-btn" onClick={onClose}>×</button>

        <h2 className="seguidores-title">{t('profile_stat_following')}</h2>

        {loading ? (
          <p className="seguidores-empty">{t('general_loading')}</p>
        ) : users.length === 0 ? (
          <p className="seguidores-empty">{t('following_modal_empty')}</p>
        ) : (
          <div className="seguidores-list">
            {users.map((u) => (
              <div key={u.uid} className="seguidor-item">
                <div
                  className="seguidor-click-zone"
                  onClick={() => goToProfile?.(u.uid)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
