import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase";
import { UserCircle } from "lucide-react";
import "../styles/RutaDetalls.css";
import EtapesList from "../components/EtapesList";

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
      "Aquesta ruta et portarà pels racons més emblemàtics de Barcelona, combinant història, art i cultura moderna. Començaràs al majestuós temple de la Sagrada Família, una de les obres més reconegudes de Gaudí, i continuaràs pel Passeig de Gràcia, on podràs admirar edificis modernistes com la Casa Batlló i La Pedrera. Després, et submergiràs en l’ambient històric del Barri Gòtic, amb carrers estrets i places plenes d’encant, per acabar gaudint d’un moment de calma al Parc de la Ciutadella, un dels espais verds més estimats pels barcelonins.",
    gallery: [
      "https://img2.huffingtonpost.es/files/og_thumbnail/uploads/2025/10/24/la-sagrada-familia-de-antonio-gaudi-en-barcelona-espana.jpeg",
      "https://th.bing.com/th/id/R.e8606b4befe61808babf6f0ce4b44964?rik=K7Vn%2fNqjosTs5w&pid=ImgRaw&r=0",
      "https://th.bing.com/th/id/R.ba1d1dcbb56bd815a5333a09ef1c1d6e?rik=jA8MvFABgkhGQQ&pid=ImgRaw&r=0",
      "https://a.cdn-hotels.com/gdcs/production90/d1945/826cf933-461d-4df0-957b-d3b602bf7baa.jpg"
      
    ],
    author: "Maria González",
  };

  useEffect(() => {
    setMainImage(routeData.mainImage);
  }, []);

  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomGallery, setZoomGallery] = useState<string[] | null>(null);


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
        {/* Miniatures */}
        <div className="miniatures">
          {routeData.gallery.slice(0, 2).map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Miniatura ${index + 1}`}
              onClick={() => setZoomGallery([img])}
              className={mainImage === img ? "active" : ""}
            />
          ))}

          {/* Targeta "Més fotos" */}
          {routeData.gallery.length > 2 && (
            <div
              className="mes-fotos"
              onClick={() =>
                setZoomGallery(routeData.gallery.slice(2)) // només les fotos que no es veuen
              }
            >
              <span>+{routeData.gallery.length - 2} fotos</span>
            </div>


          )}
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
          <h2>Descripció</h2>
          <p>{routeData.description}</p>
        </div>

        {/* ETAPES */}
        <div className="ruta-etapes">
          <h2>Etapes de la Ruta</h2>
          <EtapesList
            etapes={[
              {
                id: 1,
                titol: 'Plaça Catalunya',
                descripcio: 'Punt de partida emblemàtic on convergeixen diverses avingudes i la vida urbana barcelonina.',
                ubicacio: 'Plaça Catalunya, Barcelona'
              },
              {
                id: 2,
                titol: 'Passeig de Gràcia',
                descripcio: 'Avinguda icònica amb edificis modernistes com la Casa Batlló i La Pedrera.',
                ubicacio: 'Passeig de Gràcia, Barcelona'
              },
              {
                id: 3,
                titol: 'Sagrada Família',
                descripcio: 'Basílica monumental dissenyada per Antoni Gaudí, símbol de la ciutat.',
                ubicacio: 'Carrer de Mallorca, 401, Barcelona'
              }
            ]}
          />
        </div>        


      </div>
      {zoomImage && (
      <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
        <div className="zoom-content" onClick={(e) => e.stopPropagation()}>
          <button
            className="close-zoom"
            onClick={() => setZoomImage(null)}
          >
            ✕
          </button>

          {zoomImage === "all" ? (
            <div className="zoom-gallery">
              {routeData.gallery.map((img, index) => (
                <img key={index} src={img} alt={`Foto ${index + 1}`} />
              ))}
            </div>
          ) : (
            <img src={zoomImage} alt="Imatge ampliada" />
          )}
        </div>
      </div>
    )}

      {zoomGallery && (
        <div className="zoom-overlay" onClick={() => setZoomGallery(null)}>
          <div className="zoom-gallery" onClick={(e) => e.stopPropagation()}>
            {zoomGallery.map((img, i) => (
              <img key={i} src={img} alt={`Foto ${i + 1}`} />
            ))}
            <button
              className="close-zoom"
              onClick={() => setZoomGallery(null)}
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
