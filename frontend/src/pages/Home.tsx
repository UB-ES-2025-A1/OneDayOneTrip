import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase.ts";
import "../styles/Home.css";
import "../styles/LoginReg.css";
import Carousel from "../components/Carousel";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import Footer from "../components/Footer";
import { UserCircle } from "lucide-react"; // puedes usar este icono o el tuyo

export default function Home() {
  const [modalOpen, setModalOpen] = useState<"login" | "register" | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTab, setSelectedTab] = useState<"recomendados" | "siguiendo">(
    "recomendados"
  );

  // Detecta el estado de sesión
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setSelectedTab("recomendados");
  };

  const data = [ 
    { Nombre: "Un dia per València", 
      Descripcio: "Un dia explorant la ciutat de les arts i les ciències", 
      Imatge: "https://www.saltinourhair.com/wp-content/uploads/2019/07/valencia-spain-city-arts-sciences.jpg", 
      usuari: "María González", 
      temps: "8 hores", 
      valoracio: 4.8, 
      dificultat: "Moderat", 
    }, 
    { Nombre: "Barcelona en un dia", 
      Descripcio: "Els imprescindibles de la ciutat de Barcelona", 
      Imatge: "https://tse4.mm.bing.net/th/id/OIP.xHRrbk9fp8E3ixh-jbeCEwHaE7?pid=Api&P=0&h=180", 
      usuari: "Pedro Martínez", 
      temps: "5 hores", 
      valoracio: 4.6, 
      dificultat: "Fàcil", 
    }, 
    { Nombre: "Ruta gastronòmica a Madrid", 
      Descripcio: "Gaudeix dels millors sabors locals a Madrid", 
      Imatge: "https://tse3.mm.bing.net/th/id/OIP.O2p1K5kRge8QkgbscMu7IwHaFj?pid=Api&P=0&h=180", 
      usuari: "Juana López", 
      temps: "7 hores", 
      valoracio: 4.9, 
      dificultat: "Fàcil", 
    }, 
    { Nombre: "Descobrint Sevilla", 
      Descripcio: "Un dia ple d'història i cultura a Sevilla", 
      Imatge: "https://www.tripsavvy.com/thmb/O3YIUMm2yYDv_d4FqFaMGIarf78=/3865x2576/filters:no_upscale():max_bytes(150000):strip_icc()/plaza-de-espa-a-at-dusk--seville--spain-499790854-5aa55d6c1f4e130037937244.jpg", 
      usuari: "Lourdes Fernández", 
      temps: "6 hores", 
      valoracio: 4.7, 
      dificultat: "Moderat", 
    } 
  ];

  const renderList = (data: any[]) =>
    data.map((item, index) => (
      <div className="trip-card" key={index}>
        <img src={item.Imatge} alt={item.Nombre} className="trip-image" />
        <div className="trip-info">
          <h3 className="trip-title">{item.Nombre}</h3>
          <p className="trip-description">{item.Descripcio}</p>
          <div className="trip-details">
            <span className="trip-user">👤 {item.usuari}</span>
            <span className="trip-rating">⭐ {item.valoracio}</span>
            <span className="trip-time">⏱ {item.temps}</span>
            <span className="trip-difficulty">{item.dificultat}</span>
          </div>
        </div>
        <button className="trip-button">Ver Ruta</button>
      </div>
    ));

  return (
    <div className="home">
      <header className="home-header">
        <h1 className="logo">OneDayOneTrip</h1>

        <div className="header-buttons">
          {currentUser ? (
            <>
              <button
                className="profile-btn"
                title="Ver perfil"
                onClick={() => alert("Perfil próximamente")}
              >
                <UserCircle size={28} />
              </button>
              <button onClick={handleLogout} className="header-btn">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setModalOpen("login")}
                className="header-btn"
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => setModalOpen("register")}
                className="header-btn"
              >
                Registrarse
              </button>
            </>
          )}
        </div>
      </header>

      <Carousel />  

      {/* Tabs (solo visibles si hay sesión) */}
      {currentUser && (
        <div
          className="tabs-container"
          data-active={selectedTab} // <- necesario para mover el deslizador
        >
          <button
            className={`tab-btn ${selectedTab === "siguiendo" ? "active" : ""}`}
            onClick={() => setSelectedTab("siguiendo")}
          >
            Siguiendo
          </button>
          <button
            className={`tab-btn ${selectedTab === "recomendados" ? "active" : ""}`}
            onClick={() => setSelectedTab("recomendados")}
          >
            Recomendados
          </button>
        </div>
      )}


      <section className="trip-list-section">
        {selectedTab === "siguiendo" && currentUser ? (
          <div className="trip-list empty">
            <p>Aún no sigues a nadie. ¡Explora rutas y conecta con otros!</p>
          </div>
        ) : (
          <div className="trip-list">{renderList(data)}</div>
        )}
      </section>

      {modalOpen === "login" && (
        <LoginModal
          onClose={() => setModalOpen(null)}
          openRegister={() => setModalOpen("register")}
        />
      )}

      {modalOpen === "register" && (
        <RegisterModal
          onClose={() => setModalOpen(null)}
          openLogin={() => setModalOpen("login")}
        />
      )}

      <Footer />
    </div>
  );
}
