import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/Home.css";
import "../styles/LoginReg.css";

import Carousel from "../components/Carousel";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import MasonryGrid from "../components/MasonryGrid";
import Layout from "../components/Layout";

import { getAllTrips, type Trip } from "../api/trips";
import { getUserById } from "../api/client";
import { Search } from "lucide-react";

type SearchFilter = "all" | "user" | "country" | "city" | "monument"; // 🔹 nou

export default function Home() {
  const [modalOpen, setModalOpen] = useState<"login" | "register" | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<any | null>(null);
  const [selectedTab, setSelectedTab] = useState<"recomendados" | "siguiendo">("recomendados");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");                // 🔹 nou (ja el tenies)
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all"); // 🔹 nou

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const backendInfo = await getUserById(user.uid);
        setBackendUser(backendInfo);
      } else {
        setBackendUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setSelectedTab("recomendados");
  };

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const data = await getAllTrips(true);
        setTrips(data);
      } catch {
        setError("No s'han pogut carregar les rutes");
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  // 🔹 Primer filtre per "Seguint / Recomanats"
  const filteredTrips = trips.filter((t) => {
    if (selectedTab === "recomendados") {
      return true; // Mostrar totes les trips
    }

    if (!backendUser?.llista_seguits) return false;

    const authorId = t.author?.userId || "";
    return backendUser.llista_seguits.includes(authorId);
  });

  // 🔹 Després filtre per text + tipus de filtre
  const search = searchTerm.trim().toLowerCase();

  const visibleTrips = filteredTrips.filter((t) => {
    if (!search) return true;

    const title = (t.title || "").toLowerCase();
    const city = (t.city || "").toLowerCase();
    const country = (t.country || "").toLowerCase();
    const userName = (t.author?.name || "").toLowerCase();

    switch (searchFilter) {
      case "user":
        return userName.includes(search);
      case "country":
        return country.includes(search);
      case "city":
        return city.includes(search);
      case "monument":
        // aquí assumim que el "monument" és principalment el títol de la ruta
        return title.includes(search);
      case "all":
      default:
        return (
          title.includes(search) ||
          city.includes(search) ||
          country.includes(search) ||
          userName.includes(search)
        );
    }
  });

  const normalizeId = (id: any) =>
    typeof id === "string" ? id : id?.$oid || String(id || "");

  const placeholderMap: Record<SearchFilter, string> = {
    all: "Cerca per títol, ciutat, país o usuari...",
    user: "Cerca per nom d'usuari...",
    country: "Cerca per país...",
    city: "Cerca per ciutat...",
    monument: "Cerca per nom de la ruta / monument...",
  };

  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
      onLogin={() => setModalOpen("login")}
      onRegister={() => setModalOpen("register")}
      variant="home"
    >
      <Carousel />
      <section className="intro-text">
        <p>Descobreix rutes d’un dia ideals per escapades exprés!</p>
        <p>
          Rutes guiades amb horaris, dificultat i recomanacions locals perquè
          aprofitis al màxim cada ciutat.
        </p>
      </section>

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

            {/* 🔍 Barra de cerca amb filtre + input + lupa */}
      <div className="search-bar-container">
        <div className="search-bar">
          <select
            className="search-filter-select"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value as any)}
          >
            <option value="all">Tot</option>
            <option value="user">Usuari</option>
            <option value="country">País</option>
            <option value="city">Ciutat</option>
            <option value="monument">Monument</option>
          </select>

          <span className="search-divider" />

          <input
            type="text"
            className="search-input"
            placeholder={placeholderMap[searchFilter]}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Search className="search-icon" size={18} />
        </div>
      </div>


      <section className="trip-list-section">
        {loading && <p>Carregant rutes...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && visibleTrips.length > 0 ? (
          <MasonryGrid
            items={visibleTrips.map((t) => ({
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
        ) : (
          !loading &&
          !error && (
            <div className="no-trips-message">
              <img
                src={
                  selectedTab === "recomendados"
                    ? "https://cdn-icons-png.flaticon.com/512/7112/7112926.png"
                    : "https://cdn-icons-png.flaticon.com/512/4076/4076500.png"
                }
                alt="Sense rutes"
                className="no-trips-icon"
              />
              <p>
                {selectedTab === "recomendados"
                  ? "Encara no hi ha rutes recomanades per mostrar."
                  : "Encara no segueixes a ningú, comença a explorar!"}
              </p>
            </div>
          )
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
    </Layout>
  );
}
