import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase";
import { UserCircle } from "lucide-react";
import "../styles/RutaDetalls.css";
import EtapesList from "../components/EtapesList";
import { getTripById, getAllTrips, type Trip } from "../api/trips";

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    navigate("/");
  };

  useEffect(() => {
    const fetchTrip = async () => {
      if (!id) {
        setError("Identificador de la ruta no informat.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (isMongoObjectId(id)) {
          const data = await getTripById(id);
          setTripData(data);
          const firstGallery = data.gallery && data.gallery.length > 0 ? data.gallery[0] : "";
          setMainImage(data.coverImage || firstGallery || "");
          return;
        }

        if (isNumericIndex(id)) {
          const oneBased = parseInt(id, 10);
          const idx = Number.isFinite(oneBased) ? oneBased - 1 : -1; // 1-based → 0-based

          const trips = await getAllTrips(false);

          if (!trips || trips.length === 0) {
            setError("Encara no hi ha cap ruta disponible.");
            return;
          }

          const tripAtIndex = trips[idx];

          if (tripAtIndex?._id) {
            navigate(`/ruta/${tripAtIndex._id}`, { replace: true });
            return;
          }

          const first = trips[0];
          if (first?._id) {
            navigate(`/ruta/${first._id}`, { replace: true });
            return;
          }

          setError(`No s'ha trobat cap ruta a la posició ${oneBased}.`);
          return;
        }

        setError(`ID invàlid: "${id}".`);
      } catch (err: any) {
        console.error("Error carregant la ruta:", err);
        setError("No s'ha pogut carregar la ruta");
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [id, navigate]);

  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomGallery, setZoomGallery] = useState<string[] | null>(null);

  if (loading) {
    return <div className="loading">Carregant ruta...</div>;
  }

  if (error || !tripData) {
    return (
      <div className="error">
        <p>{error || "No s'ha trobat la ruta"}</p>
        <button onClick={() => navigate(-1)}>← Tornar</button>
      </div>
    );
  }

  return (
    <div className="ruta-detall-page">
      <header className="home-header">
        <button className="back-btn-header" onClick={() => navigate(-1)}>
          ← Tornar
        </button>

        <h1 className="logo" onClick={() => navigate("/")}>
          OneDayOneTrip
        </h1>

        <div className="header-buttons">
          {currentUser && (
            <>
              <button
                className="profile-btn"
                title="Veure perfil"
                onClick={() => alert("Perfil próximament")}
              >
                <UserCircle size={28} />
              </button>
              <button onClick={handleLogout} className="header-btn">
                Tancar sessió
              </button>
            </>
          )}
        </div>
      </header>

      <div className="ruta-galeria-principal">
        <div className="imatge-gran">
          {mainImage ? (
            <img
              src={mainImage}
              alt="Imatge principal de la ruta"
              onClick={() => setZoomImage(mainImage)}
            />
          ) : (
            <div className="no-image">Sense imatge</div>
          )}
        </div>

        <div className="miniatures">
          {tripData.gallery?.slice(0, 2).map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Miniatura ${index + 1}`}
              onClick={() => setZoomGallery([img])}
              className={mainImage === img ? "active" : ""}
            />
          ))}

          {tripData.gallery && tripData.gallery.length > 2 && (
            <div
              className="mes-fotos"
              onClick={() => setZoomGallery(tripData.gallery.slice(2))}
            >
              <span>+{tripData.gallery.length - 2} fotos</span>
            </div>
          )}
        </div>
      </div>

      <div className="ruta-detall">
        <div className="ruta-header">
          <h1>{tripData.title}</h1>

        {/* UBICACIÓ */}
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
              <img src="/images/person.png" alt="Autor" className="author-icon" />
            </div>
            <span className="autor-nom">{tripData.author.name}</span>
          </div>
        </div>

        <div className="ruta-info-extra">
          <div className="info-card">
            <div className="info-icon-bg blue-bg">
              <img src="/images/flecha.png" alt="Distància" className="info-icon" />
            </div>
            <div className="info-text">
              <span className="info-title">Distància</span>
              <span className="info-value">
                {typeof tripData.distance === "number" ? `${tripData.distance} km` : "—"}
              </span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon-bg green-bg">
              <img src="/images/reloj.png" alt="Duració" className="info-icon" />
            </div>
            <div className="info-text">
              <span className="info-title">Duració</span>
              <span className="info-value">{tripData.duration || "—"}</span>
            </div>
          </div>
        </div>

        <div className="ruta-descripcio">
          <h2>Descripció</h2>
          <p>{tripData.description}</p>
        </div>

        <div className="ruta-etapes">
          <h2>Etapes de la Ruta</h2>
          <EtapesList
            etapes={tripData.trip_points.map((p, i) => ({
              id: i,
              titol: p.title,
              descripcio: p.description,
              ubicacio: `${p.coordinates.lat}, ${p.coordinates.lng}`,
              imatge: p.image,
            }))}
          />
        </div>
      </div>

      {zoomImage && (
        <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
          <div className="zoom-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-zoom" onClick={() => setZoomImage(null)}>
              ✕
            </button>
            <img src={zoomImage} alt="Imatge ampliada" />
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

      <Footer />
    </div>
  );
}
