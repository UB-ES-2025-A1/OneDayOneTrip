// Home.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase.ts";
import "../styles/Home.css";
import "../styles/LoginReg.css";
import Carousel from "../components/Carousel";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import Footer from "../components/Footer";
// import { UserCircle } from "lucide-react"; // puedes usar este icono o el tuyo
import MasonryGrid from "../components/MasonryGrid";
import { UserCircle } from 'iconoir-react';   
import { getAllTrips, type Trip } from "../api/trips";

export default function Home() {
  const [modalOpen, setModalOpen] = useState<"login" | "register" | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTab, setSelectedTab] = useState<"recomendados" | "siguiendo">("recomendados");
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setSelectedTab("recomendados");
  };

  // Cargar trips reales desde FastAPI
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const data = await getAllTrips(true);
        setTrips(data);
      } catch (err: any) {
        console.error("Error obtenint rutes:", err);
        setError("No s'han pogut carregar les rutes");
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  function normalizeId(id: any): string {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (typeof id === "object" && "$oid" in id) return (id as any)["$oid"];
    return String(id);
  }

  //  Filtrado de trips según pestaña seleccionada 
  const filteredTrips = trips.filter((t) => {
    const authorId = t.author?.userId || "";
    if (selectedTab === "recomendados") {
      return authorId == "uid_000";
    }
    if (selectedTab === "siguiendo") {
      return authorId !== "uid_000";
    }
    return true;
  });

  return (
    <div className="home">
      <header className="home-header">
        <h1 className="logo">OneDayOneTrip</h1>

        <div className="header-buttons">
          {currentUser ? (
            <>
              <button onClick={() => navigate("/userprofile")} className="header-btn-user">
                  <UserCircle width={30} height={30} color="white" />
              </button>
              <button onClick={handleLogout} className="header-btn">
                Tancar sessió
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setModalOpen("login")} className="header-btn">
                Iniciar sessió
              </button>
              <button onClick={() => setModalOpen("register")} className="header-btn">
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

      {/* 🔹 Tabs en català */}
      {currentUser && (
        <div className="tabs-container" data-active={selectedTab}>
          <button
            className={`tab-btn ${selectedTab === "siguiendo" ? "active" : ""}`}
            onClick={() => setSelectedTab("siguiendo")}
          >
            Seguint
          </button>
          <button
            className={`tab-btn ${selectedTab === "recomendados" ? "active" : ""}`}
            onClick={() => setSelectedTab("recomendados")}
          >
            Recomanats
          </button>
        </div>
      )}

      <section className="trip-list-section">
        {loading && <p className="loading">Carregant rutes...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && filteredTrips.length > 0 && (
          <MasonryGrid
            items={filteredTrips.map((t) => ({
              id: normalizeId(t._id),
              title: t.title || "Sense títol",
              img:
                t.coverImage ||
                (t.gallery && t.gallery[0]) ||
                "https://placehold.co/600x400?text=Ruta+Sense+Imatge",
              user: t.author?.name || "Anònim",
              rating: typeof t.avgRating === "number" ? t.avgRating : 0,
              temps: t.duration || "—",
              dificultat: t.difficulty || "—",
              authorPic: t.author?.profilePic || undefined,
              city: t.city || "",
              country: t.country || "",
            }))}
            openRegister={() => setModalOpen("register")}
            currentUser={currentUser}
          />
        )}

        {/* 🔹 Mensaje bonito si no hay rutas */}
        {!loading && !error && filteredTrips.length === 0 && (
          <div className="no-trips-pretty">
            {selectedTab === "siguiendo" ? (
              <>
                <Users size={48} className="no-trips-icon" />
                <p className="no-trips-text">
                  Encara no segueixes cap autor. <br />
                  Troba rutes inspiradores i comença a seguir viatgers!
                </p>
              </>
            ) : (
              <>
                <Compass size={48} className="no-trips-icon" />
                <p className="no-trips-text">
                  De moment no hi ha rutes recomanades. <br />
                  Els administradors hi estan treballant!
                </p>
              </>
            )}
          </div>
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

