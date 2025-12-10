import { useEffect, useState, useRef } from "react"; 
import { gsap } from "gsap";
import { getUserById, followUser, unfollowUser } from "../api/client";
import "../styles/LlistaS.css";
import AvatarFallback from "../components/AvatarFallback";
import { useTranslation } from 'react-i18next';

interface BackendUser {
  uid: string;
  nom_i_cognoms?: string;
  username?: string;
  url_foto_perfil?: string;
  llista_seguidors?: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  seguidors: string[];
  currentUserId: string;       
  goToProfile?: (uid: string) => void;
}

export default function LlistaSeguidorsModalPublic({
  open,
  onClose,
  seguidors,
  currentUserId,
  goToProfile
}: Props) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [followState, setFollowState] = useState<{ [uid: string]: boolean }>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sincronizar seguidors cuando cambian
  useEffect(() => {
    setUsers([]);
    setFollowState({});
  }, [seguidors]);

  // Cargar datos de usuarios
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
          seguidors.map(async uid => {
            const u = await getUserById(uid);
            return u ? { ...u } : null;
          })
        );

        const validUsers = fetchedUsers.filter(Boolean) as BackendUser[];
        setUsers(validUsers);

        // Inicializar estado de seguimiento
        const initialFollow: { [uid: string]: boolean } = {};
        validUsers.forEach(u => {
          initialFollow[u.uid] = u.llista_seguidors?.includes(currentUserId) ?? false;
        });
        setFollowState(initialFollow);

      } catch (err) {
        console.error(t('error_loading_followers'), err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [open, seguidors, currentUserId, t]);

  // Animaciones GSAP
  useEffect(() => {
    if (!users || users.length === 0) return;
    const items = gsap.utils.toArray<HTMLElement>(".seguidor-item");
    gsap.fromTo(
      items,
      { opacity: 0, y: 20, filter: "blur(5px)" },
      { opacity: 1, y: 0, filter: "blur(0)", duration: 0.5, stagger: 0.1 }
    );
  }, [users]);

  // Seguir / dejar de seguir con actualización instantánea
  const handleToggleFollow = async (uid: string, e: React.MouseEvent) => {
    e.stopPropagation(); // evitar que abra perfil al hacer click
    const currentlyFollowing = followState[uid];

    // Actualización optimista
    setFollowState(prev => ({ ...prev, [uid]: !currentlyFollowing }));

    try {
      if (currentlyFollowing) {
        await unfollowUser(currentUserId, uid);
      } else {
        await followUser(currentUserId, uid);
      }
    } catch (err) {
      console.error(t('error_changing_state'), err);
      // Revertir si falla
      setFollowState(prev => ({ ...prev, [uid]: currentlyFollowing }));
      alert(t('error_changing_state'));
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
            {users.map(u => (
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

                {currentUserId !== u.uid && (
                  <button
                    className={`seguidor-toggle-btn ${followState[u.uid] ? "following" : ""}`}
                    onClick={(e) => handleToggleFollow(u.uid, e)}
                  >
                    {followState[u.uid] ? t('route_detail_following') : t('route_detail_follow')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
