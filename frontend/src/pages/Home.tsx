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
import MasonryGrid from "../components/MasonryGrid";


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
    {
      id: "1",
      title: "Un dia per València",
      img: "https://www.saltinourhair.com/wp-content/uploads/2019/07/valencia-spain-city-arts-sciences.jpg",
      user: "María González",
      rating: 4.8,
      temps: "5 hores",
      dificultat: "Fàcil",
    },
    {
      id: "2",
      title: "Barcelona en un dia",
      img: "https://tse4.mm.bing.net/th/id/OIP.xHRrbk9fp8E3ixh-jbeCEwHaE7?pid=Api&P=0&h=180",
      user: "Pedro Martínez",
      rating: 4.6,
      temps: "6 hores",
      dificultat: "Mitjana",
    },
    {
      id: "3",
      title: "Ruta gastronòmica a Madrid",
      img: "https://tse3.mm.bing.net/th/id/OIP.O2p1K5kRge8QkgbscMu7IwHaFj?pid=Api&P=0&h=180",
      user: "Juana López",
      rating: 4.9,
      temps: "4 hores",
      dificultat: "Fàcil",
    },
    {
      id: "4",
      title: "Descobrint Sevilla",
      img: "https://th.bing.com/th/id/R.756df7df9c567148ef25303fe5e6dcd6?rik=FCX09fvWm6ulew&riu=http%3a%2f%2fsevillaintercambio.com%2fwp-content%2fuploads%2fPlaza-Espa%c3%b1a-Sevilla.jpg&ehk=eo3yevR0cdGsjmz04lMxmOY5qr3HucYYJ5Srk%2blgOjc%3d&risl=&pid=ImgRaw&r=0",
      user: "Lourdes Fernández",
      rating: 4.7,
      temps: "7 hores",
      dificultat: "Difícil",
    },
    {
      id: "5",
      title: "Passeig exprés per Lisboa",
      img: "https://www.transfeero.com/wp-content/uploads/2020/07/lisbon-2048x1366.jpg",
      user: "Clara Rodríguez",
      rating: 4.6,
      temps: "6 hores",
      dificultat: "Fàcil",
    },
    {
      id: "6",
      title: "Ruta històrica a Roma",
      img: "https://www.enroma.com/wp-content/uploads/2017/02/Tour-Coliseo-Foro-y-Palatino-3-2048x1365.jpg",
      user: "Giulia Rossi",
      rating: 4.9,
      temps: "9 hores",
      dificultat: "Fàcil",
    }
  ];

  return (
    <div className="home">
      <header className="home-header">
        <h1 className="logo">OneDayOneTrip</h1>

        <div className="header-buttons">
          {currentUser ? (
            <>
              <button
                className="profile-btn"
                title="Veure perfil"
                onClick={() => alert("Perfil próximament")}
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
                Iniciar sessió
              </button>
              <button
                onClick={() => setModalOpen("register")}
                className="header-btn"
              >
                Registrar-se
              </button>
            </>
          )}
        </div>

      </header>

      <Carousel />  

      <section className="intro-text">
        <p>Descobreix rutes d’un dia ideals per escapades exprés!</p>
        <p>Rutes guiades amb horaris, dificultat i recomanacions locals perquè aprofitis al màxim cada ciutat.</p>
      </section>

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
          <MasonryGrid items={data} openRegister={() => setModalOpen("register")} />
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

