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

type SearchFilter = "all" | "user" | "country" | "city" | "monument";

function wilsonScore(avgRating: number, numRatings: number): number {
    // Si no hi ha rating o no hi ha valoracions → score = 0
    if (!avgRating || !numRatings) return 0;

    // Valor z per a un interval de confiança del 95%
    // Com més gran és z, més penalitza la manca de vots
    const z = 1.96; // 95% confidence

    // Convertim el rating de 1–5 a probabilitat 0–1
    const p = avgRating / 5;

    // Fórmula del Wilson Score - Combina la proporció p amb un terme de correcció pel nombre de vots
    const numerator =
        p + (z * z) / (2 * numRatings) -
        z *
        Math.sqrt(
            ((p * (1 - p)) + (z * z) / (4 * numRatings)) / numRatings
        );

    // Normalitza el càlcul segons la confiança estadística
    const denominator = 1 + (z * z) / numRatings;

    return numerator / denominator;
}

export default function Home() {
  const [modalOpen, setModalOpen] = useState<"login" | "register" | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<any | null>(null);
  const [selectedTab, setSelectedTab] = useState<"recomenats" | "seguint">("recomenats");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");

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
    setSelectedTab("recomenats");
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

    const filteredTrips = trips
        // Eliminem les rutes dels usuaris que tenim bloquejats
        .filter((t) => {
            const authorId = t.author?.userId;
            const bloquejats = backendUser?.llista_bloquejats || [];
            return !bloquejats.includes(authorId);
        })

        // Mostrem les rutes dels usuaris que no seguim
        .filter((t) => {
            if (selectedTab === "recomenats") return true;

            const seguits = backendUser?.llista_seguits || [];
            const authorId = t.author?.userId || "";

            return seguits.includes(authorId);
        })
  const filteredTrips = trips.filter((t) => {
    if (selectedTab === "recomendados") {
      return true; // Mostrar totes les trips
    }

        // Mostrem segons la funció de Wilson Score
        .sort((a, b) => {
            const scoreA = wilsonScore(a.avgRating || 0, a.numRatings || 0);
            const scoreB = wilsonScore(b.avgRating || 0, b.numRatings || 0);
            return scoreB - scoreA;
        });


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
        // assumim que el "monument" es correspon sobretot amb el títol
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

  const isFiltering = search.length > 0 || searchFilter !== "all";

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
      <div className="home">
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
            className={`tab-btn ${selectedTab === "seguint" ? "active" : ""}`}
            onClick={() => setSelectedTab("seguint")}
          >
            Seguint
          </button>
          <button
            className={`tab-btn ${selectedTab === "recomenats" ? "active" : ""}`}
            onClick={() => setSelectedTab("recomenats")}
          >
            Recomanats
          </button>
        </div>
      )}

      {/* Barra de cerca amb filtre + input + lupa (només per usuaris loguejats) */}
      {currentUser && (
        <div className="search-bar-container">
          <div className="search-bar">
            <select
              className="search-filter-select"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value as SearchFilter)}
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
      )}

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
                  isFiltering
                    ? "https://static.vecteezy.com/system/resources/previews/027/771/065/non_2x/reject-icon-image-vector.jpg" // icona “sense resultats”
                    : selectedTab === "recomendados"
                    ? "https://cdn-icons-png.flaticon.com/512/7112/7112926.png"
                    : "https://cdn-icons-png.flaticon.com/512/4076/4076500.png"
                }
                alt="Sense rutes"
                className="no-trips-icon"
              />
              <p>
                {isFiltering
                  ? "No s’han trobat resultats per al filtre actual."
                  : selectedTab === "recomendados"
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
    </div>
    </Layout>
  );
}
