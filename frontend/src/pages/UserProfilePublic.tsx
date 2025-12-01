import { useEffect, useMemo, useState } from "react"; 
import { onAuthStateChanged, type User as FirebaseUser, signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../firebase";
import { getUserById, followUser, unfollowUser, blockUser, unblockUser } from "../api/client";
import { getAllTrips, type Trip } from "../api/trips";
import "../styles/UserProfile.css";
import { ImageOff } from "lucide-react"; 
import MasonryGrid from "../components/MasonryGrid";
import Layout from "../components/Layout";
import LlistaSeguitsModal from "../components/LlistaSeguitsModal";
import LlistaSeguidorsModal from "../components/LlistaSeguidorsModal";

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
/*
type GridItem = {
  id: string;
  title: string;
  img: string;
  user: string;
  rating: number;
  temps: string;
  dificultat: string;
  authorPic?: string;
  city?: string;
  country?: string;
};*/

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

  // 🔹 estat bloqueig
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [imBlocked, setImBlocked] = useState(false);
  const [blockStateLoaded, setBlockStateLoaded] = useState(false);
  const profileHidden = isBlocked || imBlocked;


  // Detectar usuario logueado
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // Cargar perfil público y trips
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

  // 🔹 Saber si el currentUser ha bloquejat aquest perfil
  useEffect(() => {
    if (!currentUser || !profile) {
      setIsBlocked(false);
      return;
    }
    const blocked = profile.llista_bloquejadors || [];
    setIsBlocked(blocked.includes(currentUser.uid));
  }, [currentUser, profile]);

  // 🔹 Saber si el currentUser ha estat bloquejat pel propietari d'aquest perfil
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

  // 🔹 Seguir / deixar de seguir (mateixa lògica que RutaDetall)
  const handleFollow = async () => {
    if (!currentUser) {
      alert("Has d'iniciar sessió per seguir usuaris");
      return;
    }
    if (!profile) return;

    // No permetre seguir si aquest usuari està bloquejat pel currentUser
    if (isBlocked) {
      alert("No pots seguir un usuari que has bloquejat.");
      return;
    }

    const userId = currentUser.uid;
    const targetId = profile.uid;

    try {
      setFollowLoading(true);

      if (!isFollowing) {
        await followUser(userId, targetId);
        setIsFollowing(true);

        // Actualitzem localment la llista de seguidors
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
      console.error("Error seguint/seguint deixant:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  // 🔹 Bloquejar / desbloquejar
  const handleBlock = async () => {
    if (!currentUser) {
      alert("Has d'iniciar sessió per bloquejar usuaris");
      return;
    }
    if (!profile) return;

    const userId = currentUser.uid;
    const targetId = profile.uid;

    try {
      setBlockLoading(true);

      if (!isBlocked) {
        await blockUser(userId, targetId);

        setIsFollowing(false);

        // Actualitzem localment la llista de seguidors, seguits i bloquejadors
        setProfile((prev) =>
          prev
            ? ({
                  ...prev,
                llista_seguidors: (prev.llista_seguidors || []).filter(
                  (uid) => uid !== userId
                ),
                llista_seguits: (prev.llista_seguits || []).filter(
                  (uid) => uid !== userId
                ),
                llista_bloquejadors: [...(prev.llista_bloquejadors || []), userId],
              } as BackendUser)
            : prev
        );

        setIsBlocked(true);
        
      } else {
        await unblockUser(userId, targetId);
        setIsBlocked(false);

        // Actualitzem localment la llista de bloquejadors
        setProfile((prev) =>
          prev
            ? ({
                ...prev,
                llista_bloquejadors: (prev.llista_bloquejadors || []).filter(
                  (uid) => uid !== userId
                ),
              } as BackendUser)
            : prev
        );
      }
    } catch (err) {
      console.error("Error bloquejant/desbloquejant:", err);
    } finally {
      setBlockLoading(false);
    }
  };

  // Conversión Trip → GridItem
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

  const displayName = imBlocked ? "Usuari desconegut" : (profile?.nom_i_cognoms || profile?.username || "Usuari");
  const photoUrl = imBlocked ? "/images/person.png" : (profile?.url_foto_perfil || "/images/person.png");
  const panelUrl = imBlocked ? "/images/ny.jpg" : (profile?.url_foto_panell || "/images/ny.jpg");

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
      {loading && <div className="loading-state">Carregant...</div>}
      {error && !loading && <div className="error-state">{error}</div>}

      {profile && !loading && blockStateLoaded && (
        <>
          <div
            className="user-profile"
            style={{
              background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${panelUrl}) center/cover no-repeat`,
            }}
          >
            <div className="user-photo">
              <img src={photoUrl} alt="Foto de perfil" />
            </div>

            <div className="user-details">
              <div className="user-info">
                <h2>{displayName}</h2>

                {/* 🔹 BOTÓ SEGUIR SOTA EL NOM */}
                {currentUser && currentUser.uid !== profile.uid && !imBlocked && (
                  <button
                    className={`follow-button ${isFollowing ? "following" : ""}`}
                    disabled={followLoading || isBlocked}
                    onClick={handleFollow}
                    title={isBlocked ? "Has bloquejat aquest usuari" : undefined}
                  >
                    {isFollowing ? "Seguint" : "Seguir"}
                  </button>
                )}
                
                {/* 🔹 BOTÓ BLOQUEJAR SOTA EL NOM */}
                {currentUser && currentUser.uid !== profile.uid && !imBlocked && (
                  <button
                    className={`follow-button block-button ${isBlocked ? "blocked" : ""}`}
                    disabled={blockLoading}
                    onClick={handleBlock}
                  >
                    {isBlocked ? "Desbloquejar" : "Bloquejar"}
                  </button>
                )}
              </div>

              <div className="user-stats">
                <div
                  className={`stat ${profileHidden ? "blocked" : ""}`}
                  onClick={() => !profileHidden && setSeguidoresModalOpen(true)}
                >
                  <span className="number">{profileHidden ? "?" : seguidors}</span>
                  <span className="label">Seguidors</span>
                </div>

                <div
                  className={`stat ${profileHidden ? "blocked" : ""}`}
                  onClick={() => !profileHidden && setSeguitsModalOpen(true)}
                >
                  <span className="number">{profileHidden ? "?" : seguits}</span>
                  <span className="label">Seguits</span>
                </div>

                <div className={`stat ${profileHidden ? "blocked" : ""}`}>
                  <span className="number">{profileHidden ? "?" : publicacionsItems.length}</span>
                  <span className="label">Publicacions</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tabs-container1">
            <h2 className="tab-title">Rutes Publicades</h2>
          </div>

          <section className="trip-list">
            {isBlocked ? (
              // CurrentUser ha bloquejat l'usuari
              <div className="empty-state">
                <h3>Has bloquejat aquest usuari.</h3>
              </div>

            ) : imBlocked ? (
              // CurrentUser està bloquejat per l'usuari
              <div className="empty-state">
                <ImageOff className="empty-icon" size={60} />
                <h3>No hi ha publicacions.</h3>
              </div>

            ) : (
              <>
                <MasonryGrid
                  items={publicacionsItems}
                  currentUser={currentUser}
                  openRegister={() =>
                    alert("Has de iniciar sessió per interactuar")
                  }
                  showCreateButton={false}
                />

                {publicacionsItems.length === 0 && (
                  <div className="empty-state">
                    <ImageOff className="empty-icon" size={60} />
                    <h3>No hi ha publicacions.</h3>
                  </div>
                )}
              </>
            )}
          </section>

          {seguitsModalOpen && profile && !isBlocked && (
            <LlistaSeguitsModal
              open={seguitsModalOpen}
              onClose={() => setSeguitsModalOpen(false)}
              seguits={profile.llista_seguits || []}
              goToProfile={goToProfile} currentUserId={""}            />
          )}

          {seguidoresModalOpen && profile && !isBlocked && (
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
