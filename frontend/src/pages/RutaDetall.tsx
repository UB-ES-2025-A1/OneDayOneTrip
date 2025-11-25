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
import Valorar from "../components/Valorar";
import Comments from "../components/Comments";
import { getUserById, followUser, unfollowUser } from "../api/client";

const isMongoObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s || "");
const isNumericIndex = (s: string) => /^\d+$/.test(s || "");

export default function RutaDetall() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<any | null>(null);
  const [tripData, setTripData] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mainImage, setMainImage] = useState<string>("");
  const [showRatingModal, setShowRatingModal] = useState(false);

  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomGallery, setZoomGallery] = useState<string[] | null>(null);

  // Cargar usuario Firebase + backendUser
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

  // Cargar ruta
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

  // Cargar datos del autor
  useEffect(() => {
    const loadAuthor = async () => {
      if (!tripData?.author?.userId) return;
      try {
        const author = await getUserById(tripData.author.userId);
        const seguidorsNumber = author.llista_seguidors
          ? author.llista_seguidors.length
          : (typeof author.seguidors === "number" ? author.seguidors : 0);

        setFollowersCount(seguidorsNumber);

        if (currentUser) {
          const followers: string[] = author.llista_seguidors || [];
          setIsFollowing(followers.includes(currentUser.uid));
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

    if (userId === targetId) return;

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

  // 🔹 Cargar comentarios
  useEffect(() => {
    const fetchComments = async () => {
      if (!tripData?._id) return;
      try {
        setLoadingComments(true);
        const data = await getTripComments(tripData._id);
        setComments(data);
      } catch {
        console.error("Error carregant comentaris");
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [tripData]);
  // 🔹 Valorar ruta
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
    } catch (err) {
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
            {tripData.author?.profilePic ? (
              <img
                src={tripData.author.profilePic}
                alt={tripData.author.name}
                className="autor-foto"
              />
            ) : (
              <img
                src="/images/person.png"
                alt="Autor"
                className="author-icon"
              />
            )}
          </div>

          <div
            className="autor-info"
            onClick={() => tripData?.author?.userId && navigate(`/user/${tripData.author.userId}`)}
            style={{ cursor: "pointer" }}
          >
            <span className="autor-nombre">
              {tripData.author?.name || "Autor desconegut"}
            </span>
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

      {/* Comentarios */}
      <div className="ruta-comentaris">
        <h2>Comentaris</h2>
        {loadingComments ? (
          <p className="comentaris-loading">Carregant comentaris...</p>
        ) : comments.length === 0 ? (
          <p className="comentaris-buits">Encara no hi ha comentaris.</p>
        ) : (
          <ul className="comentaris-llista">
            {comments.map((c) => (
              <li key={c._id} className="comentari-item">
                <div className="comentari-header">
                  <div className="comentari-autor-info">
                    <div className="comentari-avatar">
                      <img src="/images/person.png" alt="Usuari" />
                    </div>
                    <div>
                      <span className="comentari-autor">{c.userName}</span>
                      <span className="comentari-data">
                        {dayjs(c.createdAt).locale("ca").format("DD MMM YYYY")}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="comentari-contingut">{c.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Zoom imágenes */}
      {zoomImage && (
        <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
          <div className="zoom-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-zoom" onClick={() => setZoomImage(null)}>✕</button>
            <img src={zoomImage} alt="Zoom" />
          </div>
        </div>
      )}

      {zoomGallery && (
        <div className="zoom-overlay" onClick={() => setZoomGallery(null)}>
          <div className="zoom-gallery" onClick={(e) => e.stopPropagation()}>
            {zoomGallery.map((img, i) => (
              <img key={i} src={img} alt={`Foto ${i + 1}`} />
            ))}
            <button className="close-zoom" onClick={() => setZoomGallery(null)}>✕</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
