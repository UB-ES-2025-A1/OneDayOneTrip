import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/RutaDetalls.css";
import EtapesList from "../components/EtapesList";
import Layout from "../components/Layout";

import {
  getTripById,
  getAllTrips,
  rateTrip,
  getTripComments,
  type Trip,
} from "../api/trips";

import dayjs from "dayjs";
import "dayjs/locale/ca";
import { getUserById, followUser, unfollowUser } from "../api/client";

const isMongoObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s || "");
const isNumericIndex = (s: string) => /^\d+$/.test(s || "");

export default function RutaDetall() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const [backendUser, setBackendUser] = useState<any | null>(null);
  const [tripData, setTripData] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mainImage, setMainImage] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showRatingModal, setShowRatingModal] = useState(false);

  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomGallery, setZoomGallery] = useState<string[] | null>(null);

  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);


  // 🔹 Cargar usuario Firebase + backendUser
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);

      if (fbUser) {
        try {
          const dbUser = await getUserById(fbUser.uid);
          setBackendUser(dbUser);
        } catch (err) {
          console.error("Error carregant backendUser:", err);
        }
      } else {
        setBackendUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    navigate("/");
  };

  // 🔹 Cargar ruta
  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) {
        setError("Identificador de la ruta no informat.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (isMongoObjectId(id)) {
          const data = await getTripById(id);
          setTripData(data);
          setMainImage(data.coverImage || data.gallery?.[0] || "");
        } else if (isNumericIndex(id)) {
          const trips = await getAllTrips(false);
          const idx = parseInt(id) - 1;

          const tripAtIndex = trips[idx];
          if (tripAtIndex?._id)
            navigate(`/ruta/${tripAtIndex._id}`, { replace: true });
        } else {
          setError("ID invàlid.");
        }
      } catch {
        setError("No s'ha pogut carregar la ruta.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id, navigate]);

  // 🔹 Datos del autor
  useEffect(() => {
    const loadAuthor = async () => {
      if (!tripData?.author?.userId || !tripData?._id) return;
      try {
        const author = await getUserById(tripData.author.userId);

        const count = author.llista_seguidors
          ? author.llista_seguidors.length
          : typeof author.seguidors === "number"
          ? author.seguidors
          : 0;

        setFollowersCount(count);

        if (currentUser) {
          const followersList: string[] = author.llista_seguidors || [];
          setIsFollowing(followersList.includes(currentUser.uid));

          const currentUserData = await getUserById(currentUser.uid);
          const savedTrips: string[] = currentUserData.guardades || [];
          setIsSaved(savedTrips.includes(tripData._id));
        }
      } catch (e) {
        console.error("Error carregant dades de l'autor", e);
      }
    };

    loadAuthor();
  }, [tripData, currentUser]);

  // 🔹 Seguir / Dejar de seguir
  const handleFollow = async () => {
    if (!currentUser || !tripData?.author?.userId) return;

    const userId = currentUser.uid;
    const targetId = tripData.author.userId;

    try {
      setFollowLoading(true);

      if (!isFollowing) {
        await followUser(userId, targetId);
        setIsFollowing(true);
        setFollowersCount((v) => (v ?? 0) + 1);
      } else {
        await unfollowUser(userId, targetId);
        setIsFollowing(false);
        setFollowersCount((v) => Math.max(0, (v ?? 0) - 1));
      }
    } catch (err) {
      console.error("Error seguint/seguixent:", err);
    } finally {
      setFollowLoading(false);
    }
  };


  const handleSaveTrip = async () => {
    if (!currentUser || !tripData?._id) return;
    
    try {
      setSaveLoading(true);
      
      if (!isSaved) {
        await saveTrip(currentUser.uid, tripData._id);
        setIsSaved(true);
      } else {
        await unsaveTrip(currentUser.uid, tripData._id);
        setIsSaved(false);
      }
    } catch (err) {
      console.error("Error canviant estat de guardar/desguardar:", err);
    } finally {
      setSaveLoading(false);
    }
  };


  // 🔹 Valorar ruta
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmitRating = async (value: number) => {
    if (!currentUser) {
      alert("Has d'iniciar sessió per valorar.");
      return;
    }
    if (!tripData?._id) return;

    try {
      const stats = await rateTrip(tripData._id, {
        userId: currentUser.uid,
        rating: value,
      });

      setTripData((prev) =>
        prev
          ? {
              ...prev,
              avgRating: stats.avgRating,
              numRatings: stats.numRatings,
            }
          : prev
      );

      setShowRatingModal(false);
    } catch {
      alert("No s'ha pogut enviar la valoració.");
    }
  };

  if (loading) return <div className="loading">Carregant ruta...</div>;
  if (error || !tripData)
    return (
      <div className="error">
        <p>{error || "No s'ha trobat la ruta"}</p>
        <button onClick={() => navigate(-1)}>← Tornar</button>
      </div>
    );

  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
      onLogin={() => navigate("/")}
      onRegister={() => navigate("/")}
      showBackButton
      onBack={() => navigate(-1)}
      variant="ruta"
    >
      {/* Galería */}
      <div className="ruta-galeria-principal">
        <div className="imatge-gran">
          {mainImage ? (
            <img src={mainImage} alt="Imatge principal" />
          ) : (
            <div className="no-image">Sense imatge</div>
          )}
        </div>

        <div className="miniatures">
          {tripData.gallery?.slice(0, 3).map((img, i) => (
            <img key={i} src={img} />
          ))}
        </div>
      </div>

      {/* Datos */}
      <div className="ruta-detall">
        <div className="ruta-header-line">
          <h1 className="ruta-titol">{tripData.title}</h1>
  
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            {/* Esquerra: Rating + Valorar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {tripData.avgRating != null && (
                <div className="rating-summary">
                  <span className="rating-star">★</span>
                  <span className="rating-value">{tripData.avgRating.toFixed(1)}</span>
                  <span className="rating-count">({tripData.numRatings})</span>
                </div>
              )}

              <button
                className="valorar-button"
                onClick={() => setShowRatingModal(true)}
              >
                <span className="valorar-icon">★</span>
                Valorar
              </button>
            </div>

            {/* Dreta: Botó Guardar */}
            <button
              type="button"
              className={`guardar-button ${isSaved ? "saved" : ""}`}
              onClick={handleSaveTrip}
              disabled={saveLoading}
            >
              <label className="ui-bookmark">
                <svg
                  className="bookmark"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 
                          2 8.5 2 5.42 4.42 3 7.5 3 
                          c1.74 0 3.41 0.81 4.5 2.09 
                          C13.09 3.81 14.76 3 16.5 3 
                          C19.58 3 22 5.42 22 8.5 
                          c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </label>
              <span className="guardar-text">
                {isSaved ? "Guardat" : saveLoading ? "Guardant..." : "Guardar"}
              </span>
            </button>
          </div>

        </div>
        
        <div className="ubicacio">
          <img src="/images/ubi.png" className="ubi-icon" />
          <span>{tripData.city}</span>
          {tripData.region && <span>, {tripData.region}</span>}
        </div>

        {/* Autor */}
        <div className="autor">
          <div
            className="autor-icon"
            onClick={() => tripData?.author?.userId && navigate(`/user/${tripData.author.userId}`)}
            style={{ cursor: "pointer" }}
          >
            <img
              src={tripData.author?.profilePic || "/images/person.png"}
              alt={tripData.author?.name || "Autor"}
              className="autor-foto"
            />
          </div>

          <div
            className="autor-info"
            onClick={() => tripData?.author?.userId && navigate(`/user/${tripData.author.userId}`)}
            style={{ cursor: "pointer" }}
          >
            <span className="autor-nombre">{tripData.author?.name}</span>
            {followersCount !== null && (
              <span className="autor-seguidors">
                {followersCount} seguidor{followersCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {currentUser && currentUser.uid !== tripData.author.userId && (
            <button
              className={`follow-button ${isFollowing ? "following" : ""}`}
              disabled={followLoading}
              onClick={handleFollow}
            >
              {isFollowing ? "Seguint" : "Seguir"}
            </button>
          )}
        </div>


        {/* Descripción */}
        <div className="ruta-descripcio">
          <h2>Descripció</h2>
          <p>{tripData.description}</p>
        </div>

        {/* Etapas */}
        <h2>Etapes de la Ruta</h2>
        <EtapesList
          etapes={tripData.trip_points.map((p, i) => ({
            id: i,
            titol: p.title,
            descripcio: p.description,
            ubicacio: p.location_name || `${p.coordinates?.lat}, ${p.coordinates?.lng}`,
            imatge: p.image,
          }))}
        />
      </div>

      {/* 🔥 Component de comentaris */}
      <Comments 
        tripId={tripData._id!} 
        currentUser={currentUser} 
        backendUser={backendUser}
      />

      {showRatingModal && (
        <div className="valorar-overlay" onClick={() => setShowRatingModal(false)}>
          <div className="valorar-modal" onClick={(e) => e.stopPropagation()}>
            <Valorar
              tripId={tripData._id!}
              onClose={() => setShowRatingModal(false)}
              onSubmit={handleSubmitRating}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
