import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser, signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../firebase";
import { getUserById, followUser, unfollowUser, blockUser, unblockUser } from "../api/client";
import { getAllTrips, type Trip } from "../api/trips";
import "../styles/UserProfile.css";
import { ImageOff, UserX } from "lucide-react";
import MasonryGrid from "../components/MasonryGrid";
import Layout from "../components/Layout";
import LlistaSeguitsModal from "../components/LlistaSeguitsModalPublic";
import LlistaSeguidorsModal from "../components/LlistaSeguidorsModalPublic";
import ConfirmBlockModal from "../components/ConfirmBlockModal";
import ConfirmUnblockModal from "../components/ConfirmUnblockModal";
import AvatarFallback from "../components/AvatarFallback";
import { useTranslation } from 'react-i18next';

export type BackendUser = {
  uid: string;
  nom_i_cognoms?: string;
  mail?: string;
  username?: string;
  seguidors?: number;
  seguits?: number;
  llista_seguidors?: string[];
  llista_seguits?: string[];
  publicacions?: string[];
  url_foto_perfil?: string;
  url_foto_panell?: string;
  llista_bloquejats?: string[];
  llista_bloquejadors?: string[];
};

export default function UserProfilePublic() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<BackendUser | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [seguitsModalOpen, setSeguitsModalOpen] = useState(false);
  const [seguidoresModalOpen, setSeguidoresModalOpen] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Estats de bloqueig (Staging)
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [imBlocked, setImBlocked] = useState(false);
  const [blockStateLoaded, setBlockStateLoaded] = useState(false);

  const profileHidden = isBlocked || imBlocked;

  // Modals de bloqueig (Staging)
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [confirmUnblockOpen, setConfirmUnblockOpen] = useState(false);

  // Detectar usuari loguejat
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // Carregar perfil
  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const backendUser = await getUserById(id);
        if (!backendUser) {
          setError(t('profile_public_error_not_found'));
          setProfile(null);
          setTrips([]);
          return;
        }
        // Assegurar arrays
        backendUser.llista_seguidors = backendUser.llista_seguidors || [];
        backendUser.llista_seguits = backendUser.llista_seguits || [];
        backendUser.publicacions = backendUser.publicacions || [];
        backendUser.llista_bloquejats = backendUser.llista_bloquejats || [];
        backendUser.llista_bloquejadors = backendUser.llista_bloquejadors || [];

        setProfile(backendUser as BackendUser);

        const allTrips = await getAllTrips(true);
        const pubIds = new Set((backendUser.publicacions || []).map(String));
        const userTrips = allTrips.filter((t) => pubIds.has(String(t._id)));
        setTrips(userTrips);
      } catch (err) {
        console.error(err);
        setError(t('profile_public_error_loading'));
        setProfile(null);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, t]);

  // Saber si el seguim
  useEffect(() => {
    if (!currentUser || !profile) {
      setIsFollowing(false);
      return;
    }
    const followers = profile.llista_seguidors || [];
    setIsFollowing(followers.includes(currentUser.uid));
  }, [currentUser, profile]);

  // Saber si l'hem bloquejat (Staging)
  useEffect(() => {
    if (!currentUser || !profile) {
      setIsBlocked(false);
      return;
    }
    const blocked = profile.llista_bloquejadors || [];
    setIsBlocked(blocked.includes(currentUser.uid));
  }, [currentUser, profile]);

  // Saber si ens ha bloquejat (Staging)
  useEffect(() => {
    if (!currentUser || !profile) {
      setImBlocked(false);
      setBlockStateLoaded(true);
      return;
    }
    const blockedBy = profile.llista_bloquejats || [];
    setImBlocked(blockedBy.includes(currentUser.uid));
    setBlockStateLoaded(true);
  }, [currentUser, profile]);

  // Handle Follow (Fusionat)
  const handleFollow = async () => {
    if (!currentUser) {
      alert(t('profile_public_login_follow_hint'));
      return;
    }
    if (!profile) return;
    if (isBlocked) return alert("No pots seguir un usuari que has bloquejat."); 

    try {
      setFollowLoading(true);
      const userId = currentUser.uid;
      const targetId = profile.uid;

      if (!isFollowing) {
        await followUser(userId, targetId);
        setIsFollowing(true);
        setProfile((prev) =>
          prev
            ? { ...prev, llista_seguidors: [...(prev.llista_seguidors || []), userId] }
            : prev
        );
      } else {
        await unfollowUser(userId, targetId);
        setIsFollowing(false);
        setProfile((prev) =>
          prev
            ? { ...prev, llista_seguidors: (prev.llista_seguidors || []).filter((uid) => uid !== userId) }
            : prev
        );
      }
    } catch (err) {
      console.error(t('profile_error_unfollowing'), err);
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle Block (Staging)
  const handleBlock = async () => {
    if (!currentUser || !profile) return;

    try {
      setBlockLoading(true);
      const userId = currentUser.uid;
      const targetId = profile.uid;

      if (!isBlocked) {
        await blockUser(userId, targetId);
        setIsBlocked(true);
        setIsFollowing(false);

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                llista_seguidors: (prev.llista_seguidors || []).filter((uid) => uid !== userId),
                llista_seguits: (prev.llista_seguits || []).filter((uid) => uid !== userId),
                llista_bloquejadors: [...(prev.llista_bloquejadors || []), userId],
              }
            : prev
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBlockLoading(false);
    }
  };

  // Handle Unblock (Staging)
  const handleUnblock = async () => {
    if (!currentUser || !profile) return;

    try {
      setBlockLoading(true);
      const userId = currentUser.uid;
      const targetId = profile.uid;

      await unblockUser(userId, targetId);
      setIsBlocked(false);

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              llista_bloquejadors: (prev.llista_bloquejadors || []).filter((uid) => uid !== userId),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
    } finally {
      setBlockLoading(false);
    }
  };

  const publicacionsItems = useMemo(() => {
    const pubIds = new Set((profile?.publicacions || []).map(String));
    return trips
      .filter((t) => pubIds.has(String(t._id)))
      .map((t) => ({
        id: String(t._id),
        title: t.title || t('general_no_title'),
        img:
          t.coverImage ||
          (t.gallery && t.gallery[0]) ||
          t('general_placeholder_no_image_public'),
        user: t.author?.name || t('general_anonymous'),
        rating: typeof t.avgRating === "number" ? t.avgRating : 0,
        temps: t.duration || "—",
        dificultat: t.difficulty || "—",
        authorPic: t.author?.profilePic || "",
        city: t.city || "",
        country: t.country || "",
      }));
  }, [trips, profile, t]);

  // Variables visuals fusionades
  const displayName = profile?.nom_i_cognoms || profile?.username || t('general_user');
  
  const panelUrl = profileHidden
    ? "" 
    : profile?.url_foto_panell || "/images/ny.jpg";

  const seguidors = profile?.llista_seguidors?.length ?? 0;
  const seguits = profile?.llista_seguits?.length ?? 0;

  const goToProfile = (uid: string) => {
    navigate(`/user/${uid}`);
    setSeguidoresModalOpen(false);
    setSeguitsModalOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
      onLogin={() => navigate("/")}
      onRegister={() => navigate("/")}
      variant="perfil"
    >
      {loading && <div className="loading-state">{t('general_loading')}</div>}
      {error && !loading && <div className="error-state">{error}</div>}

      {profile && !loading && blockStateLoaded && (
        <>
          <div
            className="user-profile"
            style={{
              background: profileHidden
                ? "rgba(74, 73, 73, 0.67)"
                : `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${panelUrl}) center/cover no-repeat`,
              position: "relative",
            }}
          >
            {/* Botó de bloqueig */}
            {currentUser && currentUser.uid !== profile.uid && !imBlocked && (
              <button
                className={`block-button ${isBlocked ? "blocked" : ""}`}
                onClick={() => {
                  if (!isBlocked) setConfirmBlockOpen(true);
                  else setConfirmUnblockOpen(true);
                }}
                title={isBlocked ? "Desbloquejar usuari" : "Bloquejar usuari"}
              >
                <UserX size={22} />
              </button>
            )}

            <ConfirmBlockModal
              open={confirmBlockOpen}
              onClose={() => setConfirmBlockOpen(false)}
              onConfirm={() => {
                handleBlock();
                setConfirmBlockOpen(false);
              }}
              username={profile?.username || profile?.nom_i_cognoms}
            />

            <ConfirmUnblockModal
              open={confirmUnblockOpen}
              onClose={() => setConfirmUnblockOpen(false)}
              onConfirm={() => {
                handleUnblock();
                setConfirmUnblockOpen(false);
              }}
              username={profile?.username || profile?.nom_i_cognoms}
            />

            <div className="user-photo">
              {profile.url_foto_perfil ? (
                <img src={profile.url_foto_perfil} alt={t('edit_profile_profile_photo')} />
              ) : (
                <AvatarFallback name={displayName} size={160}/>
              )}
            </div>

            <div className="user-details">
              <div className="user-info">
                <h2>{displayName}</h2>

                {currentUser && currentUser.uid !== profile.uid && !imBlocked && (
                  <button
                    className={`follow-button ${isFollowing ? "following" : ""}`}
                    disabled={followLoading || isBlocked}
                    onClick={handleFollow}
                  >
                    {isFollowing ? t('route_detail_following') : t('route_detail_follow')}
                  </button>
                )}
              </div>

              <div className="user-stats">
                <div
                  className={`stat ${profileHidden ? "blocked" : ""}`}
                  onClick={() => !profileHidden && setSeguidoresModalOpen(true)}
                >
                  <span className="number">{profileHidden ? "?" : seguidors}</span>
                  <span className="label">{t('profile_stat_followers')}</span>
                </div>

                <div
                  className={`stat ${profileHidden ? "blocked" : ""}`}
                  onClick={() => !profileHidden && setSeguitsModalOpen(true)}
                >
                  <span className="number">{profileHidden ? "?" : seguits}</span>
                  <span className="label">{t('profile_stat_following')}</span>
                </div>

                <div className={`stat ${profileHidden ? "blocked" : ""}`}>
                  <span className="number">{profileHidden ? "?" : publicacionsItems.length}</span>
                  <span className="label">{t('profile_stat_publications')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tabs-container1">
            <h2 className="tab-title">{t('profile_public_title_publications')}</h2>
          </div>

          <section className="trip-list">
            {isBlocked ? (
              <div className="empty-state">
                <h3>Has bloquejat aquest usuari.</h3> 
              </div>
            ) : imBlocked ? (
              <div className="empty-state">
                <ImageOff className="empty-icon" size={60} />
                <h3>{t('profile_public_empty_publications')}</h3>
              </div>
            ) : (
              <MasonryGrid
                items={publicacionsItems}
                currentUser={currentUser}
                openRegister={() => alert(t('profile_have_to_login'))}
                showCreateButton={false}
              />
            )}

            {!isBlocked && !imBlocked && publicacionsItems.length === 0 && (
                <div className="empty-state">
                    <ImageOff className="empty-icon" size={60} />
                    <h3>{t('profile_public_empty_publications')}</h3>
                </div>
            )}
          </section>

          {seguitsModalOpen && profile && !isBlocked && (
            <LlistaSeguitsModal
              open={seguitsModalOpen}
              onClose={() => setSeguitsModalOpen(false)}
              seguits={profile.llista_seguits || []}
              goToProfile={goToProfile} 
              currentUserId={currentUser?.uid || ""}
            />
          )}

          {seguidoresModalOpen && profile && !isBlocked && (
            <LlistaSeguidorsModal
              open={seguidoresModalOpen}
              onClose={() => setSeguidoresModalOpen(false)}
              seguidors={profile.llista_seguidors || []}
              goToProfile={goToProfile}
              currentUserId={currentUser?.uid || ""}
            />
          )}
        </>
      )}
    </Layout>
  );
}