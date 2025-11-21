import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getUserById } from "../api/client";
import { getAllTrips, type Trip } from "../api/trips";
import "../styles/UserProfile.css";
import { ImageOff, Pencil } from "lucide-react"; 
import MasonryGrid from "../components/MasonryGrid";
import Layout from "../components/Layout";

type BackendUser = {
  uid: string;
  nom_i_cognoms?: string;
  mail?: string;
  username?: string;
  seguidors?: number;
  seguits?: number;
  publicacions?: string[]; 
  guardades?: string[];
  url_foto_perfil?: string;
  url_foto_panell?: string;
};

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
};

export default function UserProfile() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<BackendUser | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTab, setSelectedTab] = useState<"publicacions" | "guardat">("publicacions");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  // Cargar usuario y sus trips
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (!fbUser) {
        setProfile(null);
        setTrips([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const backendUser = await getUserById(fbUser.uid);
        setProfile(backendUser as BackendUser);

        // Obtener todas las trips
        const allTrips = await getAllTrips(true);

        // Filtrar solo las del usuario
        const pubIds = new Set((backendUser.publicacions || []).map(String));
        const guardIds = new Set((backendUser.guardades || []).map(String));

        const userTrips = allTrips.filter(
          (t) => pubIds.has(String(t._id)) || guardIds.has(String(t._id))
        );

        setTrips(userTrips);
      } catch (e: any) {
        console.error("Error carregant perfil:", e);
        setError(e?.message || "No s'ha pogut carregar el perfil.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const openRegister = () => alert("Has d'iniciar sessió per continuar.");

  // 🔹 Conversion de Trip → GridItem
  const toGridItems = (trips: Trip[]): GridItem[] =>
    trips.map((t) => ({
      id: String(t._id),
      title: t.title || "Sense títol",
      img:
        t.coverImage ||
        (t.gallery && t.gallery[0]) ||
        "https://placehold.co/600x400?text=Ruta+Sense+Imatge",
      user: t.author?.name || "Anònim",
      rating: typeof t.avgRating === "number" ? t.avgRating : 0,
      temps: t.duration || "—",
      dificultat: t.difficulty || "—",
      authorPic: t.author?.profilePic || "",
      city: t.city || "",
      country: t.country || "",
    }));

  // Derivados visuales
  const displayName = profile?.nom_i_cognoms || currentUser?.displayName || profile?.username || "Usuari";
  const displayMail = profile?.mail || currentUser?.email || "";
  const photoUrl = profile?.url_foto_perfil || "/images/person.png";
  const panelUrl = profile?.url_foto_panell || "/images/ny.jpg";

  const seguidors = profile?.seguidors ?? 0;
  const seguits = profile?.seguits ?? 0;

  // Separar por pestaña
  const publicacionsItems = useMemo(() => {
    const pubIds = new Set((profile?.publicacions || []).map(String));
    return toGridItems(trips.filter((t) => pubIds.has(String(t._id))));
  }, [trips, profile?.publicacions]);

  const guardadesItems = useMemo(() => {
    const guardIds = new Set((profile?.guardades || []).map(String));
    return toGridItems(trips.filter((t) => guardIds.has(String(t._id))));
  }, [trips, profile?.guardades]);

  const gridItems = selectedTab === "publicacions" ? publicacionsItems : guardadesItems;

  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
      onLogin={() => navigate("/")}
      onRegister={() => navigate("/")}
      variant="perfil"
    >
      {loading && <div className="loading-state">Carregant perfil...</div>}
      {error && !loading && <div className="error-state">{error}</div>}

      {currentUser && profile && !loading && (
        <>
          <div
            className="user-profile"
            style={{
              background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${panelUrl}) center/cover no-repeat`,
              position:"relative",
            }}
            >
            <button className="edit-profile-btn" onClick={() => navigate("/edit-profile")}> <Pencil size={22} /></button>
          
            <div className="user-photo">
              <img src={photoUrl} alt="Foto de perfil" />
            </div>
            <div className="user-details">
              <div className="user-info">
                <h2>{displayName}</h2>
                <h3>{displayMail}</h3>
              </div>
              <div className="user-stats">
                <div className="stat"><span className="number">{seguidors}</span><span className="label">Seguidors</span></div>
                <div className="stat"><span className="number">{seguits}</span><span className="label">Seguits</span></div>
                <div className="stat"><span className="number">{publicacionsItems.length}</span><span className="label">Publicacions</span></div>
                <div className="stat"><span className="number">{guardadesItems.length}</span><span className="label">Guardades</span></div>
              </div>
            </div>
          </div>

          <div className="tabs-container" data-active={selectedTab}>
            <button className={`tab-btn ${selectedTab === "publicacions" ? "active" : ""}`} onClick={() => setSelectedTab("publicacions")}>Publicacions</button>
            <button className={`tab-btn ${selectedTab === "guardat" ? "active" : ""}`} onClick={() => setSelectedTab("guardat")}>Guardat</button>
          </div>

          <section className="trip-list">
            {gridItems.length > 0 ? (
              <MasonryGrid items={gridItems} openRegister={openRegister} currentUser={currentUser} />
            ) : (
              <div className="empty-state">
                <ImageOff className="empty-icon" size={60} />
                {selectedTab === "publicacions" ? (
                  <>
                    <h3>Encara no has publicat cap ruta</h3>
                    <p>Comparteix les teves aventures amb la comunitat!</p>
                  </>
                ) : (
                  <>
                    <h3>Encara no has desat cap ruta</h3>
                    <p>Explora i desa les teves preferides per més tard.</p>
                  </>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
