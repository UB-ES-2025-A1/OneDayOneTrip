import { useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  type User as FirebaseUser,
  signOut,
} from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../firebase";
import { getUserById, followUser, unfollowUser } from "../api/client";
import { getAllTrips, type Trip } from "../api/trips";
import "../styles/UserProfile.css";
import { ImageOff } from "lucide-react";
import MasonryGrid from "../components/MasonryGrid";
import Layout from "../components/Layout";
import LlistaSeguitsModal from "../components/LlistaSeguitsModal";
import LlistaSeguidorsModal from "../components/LlistaSeguidorsModal";
import AvatarFallback from "../components/AvatarFallback";

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
  isPrivate?: boolean;
};

export default function UserProfilePublic() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<BackendUser | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [seguitsModalOpen, setSeguitsModalOpen] = useState(false);
  const [seguidoresModalOpen, setSeguidoresModalOpen] = useState(false);

  // 🔹 estat follow
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Detectar usuari loguejat
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // Carregar perfil públic i trips
  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const backendUser = await getUserById(id);
        if (!backendUser) {
          setError("Usuari no trobat");
          setProfile(null);
          setTrips([]);
          return;
        }

        backendUser.llista_seguidors = backendUser.llista_seguidors || [];
        backendUser.llista_seguits = backendUser.llista_seguits || [];
        backendUser.publicacions = backendUser.publicacions || [];

        setProfile(backendUser as BackendUser);

        const allTrips = await getAllTrips(true);
        const pubIds = new Set((backendUser.publicacions || []).map(String));
        const userTrips = allTrips.filter((t) => pubIds.has(String(t._id)));
        setTrips(userTrips);
      } catch (err) {
        console.error(err);
        setError("No s'ha pogut carregar el perfil.");
        setProfile(null);
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // 🔹 Saber si el currentUser segueix aquest perfil
  useEffect(() => {
    if (!currentUser || !profile) {
      setIsFollowing(false);
      return;
    }
    const followers = profile.llista_seguidors || [];
    setIsFollowing(followers.includes(currentUser.uid));
  }, [currentUser, profile]);

  // 🔹 Seguir / deixar de seguir
  const handleFollow = async () => {
    if (!currentUser) {
      alert("Has d'iniciar sessió per seguir usuaris");
      return;
    }
    if (!profile) return;

    const userId = currentUser.uid;
    const targetId = profile.uid;

    try {
      setFollowLoading(true);

      if (!isFollowing) {
        await followUser(userId, targetId);
        setIsFollowing(true);

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                llista_seguidors: [...(prev.llista_seguidors || []), userId],
              }
            : prev
        );
      } else {
        await unfollowUser(userId, targetId);
        setIsFollowing(false);

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                llista_seguidors: (prev.llista_seguidors || []).filter(
                  (uid) => uid !== userId
                ),
              }
            : prev
        );
      }
    } catch (err) {
      console.error("Error seguint/deixant de seguir:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  // Convertir Trips → items de grid
  const publicacionsItems = useMemo(() => {
    const pubIds = new Set((profile?.publicacions || []).map(String));
    return trips
      .filter((t) => pubIds.has(String(t._id)))
      .map((t) => ({
        id: String(t._id),
        title: t.title || "Sense títol",
        img:
          t.coverImage ||
          (t.gallery && t.gallery[0]) ||
          "https://placehold.co/600x400?text=Sense+Imatge",
        user: t.author?.name || "Anònim",
        rating: typeof t.avgRating === "number" ? t.avgRating : 0,
        temps: t.duration || "—",
        dificultat: t.difficulty || "—",
        authorPic: t.author?.profilePic || "",
        city: t.city || "",
        country: t.country || "",
      }));
  }, [trips, profile]);

  const displayName = profile?.nom_i_cognoms || profile?.username || "Usuari";
  const panelUrl = profile?.url_foto_panell || "/images/ny.jpg";

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

  // 🔐 PRIVACITAT
  const isOwner =
    currentUser && profile ? currentUser.uid === profile.uid : false;

  const isPrivate = !!profile?.isPrivate;

  // Pot veure el contingut si:
  // - el perfil NO és privat
  // - o és el propietari
  // - o ja el segueix
  const canViewContent = !isPrivate || isOwner || isFollowing;

  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
      onLogin={() => navigate("/")}
      onRegister={() => navigate("/")}
      variant="perfil"
    >
      {loading && <div className="loading-state">Carregant...</div>}
      {error && !loading && <div className="error-state">{error}</div>}

      {profile && !loading && (
        <>
          <div
            className="user-profile"
            style={{
              background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${panelUrl}) center/cover no-repeat`,
            }}
          >
            <div className="user-photo">
              {profile.url_foto_perfil ? (
                <img src={profile.url_foto_perfil} alt="Foto de perfil" />
              ) : (
                <AvatarFallback name={displayName} />
              )}
            </div>

            <div className="user-details">
              <div className="user-info">
                <h2>{displayName}</h2>

                {/* Badge de perfil privat opcional */}
                {isPrivate && (
                  <span className="private-badge">Perfil privat</span>
                )}

                {/* Botó seguir sota el nom */}
                {currentUser && currentUser.uid !== profile.uid && (
                  <button
                    className={`follow-button ${
                      isFollowing ? "following" : ""
                    }`}
                    disabled={followLoading}
                    onClick={handleFollow}
                  >
                    {isFollowing ? "Seguint" : "Seguir"}
                  </button>
                )}
              </div>

              <div className="user-stats">
                <div
                  className="stat"
                  onClick={() => setSeguidoresModalOpen(true)}
                >
                  <span className="number">{seguidors}</span>
                  <span className="label">Seguidors</span>
                </div>

                <div className="stat" onClick={() => setSeguitsModalOpen(true)}>
                  <span className="number">{seguits}</span>
                  <span className="label">Seguits</span>
                </div>

                <div className="stat">
                  <span className="number">{publicacionsItems.length}</span>
                  <span className="label">Publicacions</span>
                </div>
              </div>
            </div>
          </div>

          {canViewContent ? (
            <>
              <div className="tabs-container1">
                <h2 className="tab-title">Rutes publicades</h2>
              </div>

              <section className="trip-list">
                <MasonryGrid
                  items={publicacionsItems}
                  currentUser={currentUser}
                  openRegister={() =>
                    alert("Has d'iniciar sessió per interactuar")
                  }
                  showCreateButton={false}
                />

                {publicacionsItems.length === 0 && (
                  <div className="empty-state">
                    <ImageOff className="empty-icon" size={60} />
                    <h3>No hi ha publicacions.</h3>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="trip-list">
              <div className="private-profile-box">
                <h3>Perfil privat</h3>
                <p>
                  Aquest usuari només comparteix les seves rutes amb seguidors
                  aprovats.
                </p>

                {!currentUser && (
                  <button
                    className="btn-primary"
                    onClick={() =>
                      alert(
                        "Inicia sessió per poder seguir aquest usuari."
                      )
                    }
                  >
                    Inicia sessió per seguir
                  </button>
                )}

                {currentUser &&
                  !isFollowing &&
                  currentUser.uid !== profile.uid && (
                    <button
                      className="btn-primary"
                      onClick={handleFollow}
                      disabled={followLoading}
                    >
                      {followLoading ? "Processant..." : "Seguir usuari"}
                    </button>
                  )}

                {currentUser &&
                  (isFollowing || currentUser.uid === profile.uid) && (
                    <p className="private-hint">
                      Ja tens accés concedit. Si us plau, recarrega la pàgina si
                      no veus les rutes.
                    </p>
                  )}
              </div>
            </section>
          )}

          {seguitsModalOpen && profile && (
            <LlistaSeguitsModal
              open={seguitsModalOpen}
              onClose={() => setSeguitsModalOpen(false)}
              seguits={profile.llista_seguits || []}
              goToProfile={goToProfile}
              currentUserId={currentUser?.uid || ""}
            />
          )}

          {seguidoresModalOpen && profile && (
            <LlistaSeguidorsModal
              open={seguidoresModalOpen}
              onClose={() => setSeguidoresModalOpen(false)}
              seguidors={profile.llista_seguidors || []}
              goToProfile={goToProfile}
            />
          )}
        </>
      )}
    </Layout>
  );
}
