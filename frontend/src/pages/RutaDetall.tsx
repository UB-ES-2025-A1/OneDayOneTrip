import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/RutaDetalls.css";
import EtapesList from "../components/EtapesList";
import Layout from "../components/Layout";
import { getTripById, getAllTrips, getTripComments, type Trip, type Comment } from "../api/trips";
import dayjs from "dayjs";
import "dayjs/locale/ca";
import { getUserById, followUser } from "../api/client";
import Valorar from "../components/Valorar";

import { getUserById, followUser, unfollowUser } from "../api/client";



const isMongoObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s || "");
const isNumericIndex = (s: string) => /^\d+$/.test(s || "");

export default function RutaDetall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tripData, setTripData] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomGallery, setZoomGallery] = useState<string[] | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);


  // 🔹 Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setCurrentUser);
    return () => unsubscribe();
  }, []);


  // 🔹 Logout
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
          if (tripAtIndex?._id) navigate(`/ruta/${tripAtIndex._id}`, { replace: true });
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

  useEffect(() => {
    const loadAuthorData = async () => {
      if (!tripData?.author?.userId) return;

      try {
        const author = await getUserById(tripData.author.userId); // GET /users/{userId}

        const seguidorsNumber = author.llista_seguidors
          ? author.llista_seguidors.length
          : (typeof author.seguidors === "number" ? author.seguidors : 0);


        setFollowersCount(seguidorsNumber);

        if (currentUser) {
          const followersList: string[] = author.llista_seguidors || [];
          setIsFollowing(followersList.includes(currentUser.uid));
        }
      } catch (err) {
        console.error("Error carregant dades de l'autor:", err);
      }
    };

    loadAuthorData();
  }, [tripData, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !tripData?.author?.userId) return;

    const userId = currentUser.uid;
    const targetId = tripData.author.userId;

    if (userId === targetId) return; // per si de cas, no pots seguir-te tu mateix

    try {
      setFollowLoading(true);

      if (!isFollowing) {
        await followUser(userId, targetId);
        setIsFollowing(true);
        setFollowersCount((prev) => (prev == null ? 1 : prev + 1));
      } else {
        await unfollowUser(userId, targetId);
        setIsFollowing(false);
        setFollowersCount((prev) =>
          prev == null || prev <= 0 ? 0 : prev - 1
        );
      }
    } catch (err) {
      console.error("Error canviant estat de seguir/seguir:", err);
    } finally {
      setFollowLoading(false);
    }
  };




  // 🔹 Comentaris
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
      {/* Galeria principal */}
      <div className="ruta-galeria-principal">
        <div className="imatge-gran">
          {mainImage ? (
            <img src={mainImage} alt="Imatge principal" onClick={() => setZoomImage(mainImage)} />
          ) : (
            <div className="no-image">Sense imatge</div>
          )}
        </div>
        <div className="miniatures">
          {tripData.gallery?.slice(0, 2).map((img, i) => (
            <img key={i} src={img} onClick={() => setZoomGallery([img])} />
          ))}
          {tripData.gallery && tripData.gallery.length > 2 && (
            <div className="mes-fotos" onClick={() => setZoomGallery(tripData.gallery.slice(2))}>
              <span>+{tripData.gallery.length - 2} fotos</span>
            </div>
          )}
        </div>
      </div>

      {/* Dades ruta */}
      <div className="ruta-detall">
        <div className="ruta-header-line">
          <h1 className="ruta-titol">{tripData.title}</h1>

          <button
            type="button"
            className="valorar-button"
            onClick={() => setShowRatingModal(true)}
          >
            <span className="valorar-icon">★</span>
            Valorar
          </button>
        </div>


        <div className="ubicacio">
          <img src="/images/ubi.png" alt="Ubicació" className="ubi-icon" />
          <span>
            {tripData.city}
            {tripData.region ? `, ${tripData.region}` : ""}
          </span>
          {tripData.category && <span className="tipus">{tripData.category}</span>}
        </div>

        <div className="autor">
          <div className="autor-icon">
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

          <div className="autor-info">
            <span className="autor-nombre">
              {tripData.author?.name || "Autor desconegut"}
            </span>
            {followersCount !== null && (
              <span className="autor-seguidors">
                {followersCount} seguidor{followersCount === 1 ? "" : "s"}
              </span>
            )}
          </div>



          {/* 🔘 botó Seguir / Seguint */}
          {currentUser && currentUser.uid !== tripData.author.userId && (
            <button
              className={`follow-button ${isFollowing ? "following" : ""}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {isFollowing
                ? "Seguint"
                : followLoading
                ? "Seguint..."
                : "Seguir"}
            </button>
          )}
        </div>



        <div className="ruta-descripcio">
          <h2>Descripció</h2>
          <p>{tripData.description}</p>
        </div>

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

      {/* 💬 Comentaris */}
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

      {showRatingModal && (
      <div
        className="valorar-overlay"
        onClick={() => setShowRatingModal(false)}
      >
        <div
          className="valorar-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <Valorar
            tripId={tripData._id!}
            onClose={() => setShowRatingModal(false)}
          />
        </div>
      </div>
    )}
      {/* Zoom imágenes */}
      {zoomImage && (
        <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
          <div className="zoom-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-zoom" onClick={() => setZoomImage(null)}>
              ✕
            </button>
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
            <button className="close-zoom" onClick={() => setZoomGallery(null)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
