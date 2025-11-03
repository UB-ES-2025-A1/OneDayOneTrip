import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase";
import { UserCircle } from "lucide-react";
import "../styles/RutaDetalls.css";

export default function RutaDetall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mainImage, setMainImage] = useState<string>("");

  // Detecta l’estat d’autenticació
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

  // Dades de prova (més endavant vindran de l’API)
  const routeData = {
    title: "Descobrint Barcelona",
    mainImage:
      "https://www.fodors.com/wp-content/uploads/2018/11/22-Parc-de-la-Ciutadella.jpg",
    location: "Barcelona, Catalunya",
    type: "Cultural, arquitectònica",
    distance: "8 km",
    duration: "5 hores",
    description:
      "Una ruta per descobrir els punts més emblemàtics de Barcelona: des de la Sagrada Família fins al Barri Gòtic, passant per la Rambla i el Passeig de Gràcia.",
    recommendations:
      "Porta calçat còmode i aigua. Evita les hores de més calor si la fas a l’estiu.",
    highlights: [
      "Sagrada Família",
      "Casa Batlló",
      "Barri Gòtic",
      "Parc de la Ciutadella",
    ],
    gallery: [
      "https://img2.huffingtonpost.es/files/og_thumbnail/uploads/2025/10/24/la-sagrada-familia-de-antonio-gaudi-en-barcelona-espana.jpeg",
      "https://th.bing.com/th/id/R.e8606b4befe61808babf6f0ce4b44964?rik=K7Vn%2fNqjosTs5w&pid=ImgRaw&r=0",
      "https://cdn.thecrazytourist.com/wp-content/uploads/2017/05/Barcelona-Cathedral.jpg",
    ],
    author: "Maria González",
  };

  useEffect(() => {
    setMainImage(routeData.mainImage);
  }, []);

  const [zoomImage, setZoomImage] = useState<string | null>(null);


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

      {/* GALERIA PRINCIPAL */}
      <div className="ruta-galeria-principal">
        <div className="imatge-gran">
          <img
            src={mainImage}
            alt="Imatge principal de la ruta"
            onClick={() => setZoomImage(mainImage)}
          />
        </div>
        <div className="miniatures">
          {routeData.gallery.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Miniatura ${index + 1}`}
              onClick={() => setZoomImage(img)}
              className={mainImage === img ? "active" : ""}
            />
          ))}
        </div>
      </div>

      {/* CONTINGUT DE LA RUTA */}
      <div className="ruta-detall">
        <div className="ruta-header">
          <h1>{routeData.title}</h1>

          {/* UBICACIÓ */}
          <div className="ubicacio">
            <img src="/images/ubi.png" alt="Ubicació" className="ubi-icon" />
            <span>{routeData.location}</span>
            <span className="tipus">{routeData.type}</span>
          </div>

          {/* AUTOR */}
          <div className="autor">
            <div className="autor-icon">
              <img src="/images/person.png"/>
            </div>
            <span className="autor-nom">{routeData.author}</span>
          </div>
        </div>




        <div className="ruta-info-extra">
          <div className="info-card">
            <div className="info-icon-bg blue-bg">
              <img src="/images/flecha.png" alt="Distància" className="info-icon" />
            </div>
            <div className="info-text">
              <span className="info-title">Distància</span>
              <span className="info-value">{routeData.distance}</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon-bg green-bg">
              <img src="/images/reloj.png" alt="Duració" className="info-icon" />
            </div>
            <div className="info-text">
              <span className="info-title">Duració</span>
              <span className="info-value">{routeData.duration}</span>
            </div>
          </div>
        </div>




        <div className="ruta-descripcio">
          <h2>Descripció general</h2>
          <p>{routeData.description}</p>
        </div>

        <div className="ruta-recomanacions">
          <h2>Recomanacions</h2>
          <p>{routeData.recommendations}</p>
        </div>

        <div className="ruta-punts">
          <h2>Punts destacats</h2>
          <ul>
            {routeData.highlights.map((p, i) => (
              <li key={i}>• {p}</li>
            ))}
          </ul>
        </div>
      </div>
      {zoomImage && (
        <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
          <div className="zoom-content">
            <img src={zoomImage} alt="Imatge ampliada" />
            <button
              className="close-zoom"
              onClick={(e) => {
                e.stopPropagation();
                setZoomImage(null);
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
