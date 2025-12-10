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

import { useTranslation } from 'react-i18next'; // Importa el hook

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
  const { t } = useTranslation();

  const [modalOpen, setModalOpen] = useState<"login" | "register" | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<any | null>(null);
  const [selectedTab, setSelectedTab] = useState<"recommended" | "following">("recommended");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const backendInfo = await getUserById(user.uid);
          setBackendUser(backendInfo);
        } catch (err) {
          console.error('Error loading backend user:', err);
          setBackendUser(null);
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
    setSelectedTab("recommended");
  };

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const data = await getAllTrips(true, t);
        
        // Si no hi ha usuari loguejat, mostrar només les rutes de perfils públics
        if (!currentUser) {
          const filteredData = await Promise.all(
            data.map(async (trip) => {
              const authorId = trip.author?.userId;
              if (!authorId) return trip;

              try {
                const author = await getUserById(authorId);
                // Si el perfil és privat, ocultar la ruta
                if (author?.isPrivate) {
                  return null;
                }
                return trip;
              } catch {
                return trip;
              }
            })
          );
          setTrips(filteredData.filter((trip) => trip !== null) as Trip[]);
          return;
        }

        // Si hi ha usuari loguejat, filtrar segons bloquejats i privats
        const filteredData = await Promise.all(
          data.map(async (trip) => {
            const authorId = trip.author?.userId;
            if (!authorId) return trip;

            try {
              // Comprovar si l'usuari m'ha bloquejat
              const bloquejatsForm = backendUser?.llista_bloquejadors || [];
              if (bloquejatsForm.includes(authorId)) {
                return null;
              }

              // Comprovar si jo he bloquejat l'usuari
              const bloquejats = backendUser?.llista_bloquejats || [];
              if (bloquejats.includes(authorId)) {
                return null;
              }

              const author = await getUserById(authorId);
              
              // Si el perfil és privat i no el segueixo i no sóc jo, ocultar la ruta
              if (author?.isPrivate) {
                const seguits = backendUser?.llista_seguits || [];
                const isOwner = currentUser?.uid === authorId;
                
                // Si no segueixo i no sóc propietari, retornar null
                if (!isOwner && !seguits.includes(authorId)) {
                  return null;
                }
              }
              
              return trip;
            } catch {
              return trip;
            }
          })
        );
        
        // Eliminar les rutes null
        setTrips(filteredData.filter((trip) => trip !== null) as Trip[]);
      } catch {
        setError(t('home_error_loading_routes'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrips();
  }, [currentUser, backendUser, t]);

    const filteredTrips = trips

        // Mostrem les rutes dels usuaris que no seguim
        .filter((t) => {
            if (selectedTab === "recommended") return true;

            const seguits = backendUser?.llista_seguits || [];
            const authorId = t.author?.userId || "";

            return seguits.includes(authorId);
        })

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
    all: t('home_placeholder_all'),
    user: t('home_placeholder_user'),
    country:t('home_placeholder_country'),
    city: t('home_placeholder_city'),
    monument: t('home_placeholder_monument'),
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
        <p>{t('home_slogan_1')}</p>
        <p>
            {t('home_slogan_2')}
        </p>
      </section>

      {currentUser && (
        <div className="tabs-container" data-active={selectedTab}>
          <button
            className={`tab-btn ${selectedTab === "following" ? "active" : ""}`}
            onClick={() => setSelectedTab("following")}
          >
              {t('home_tab_following')}
          </button>
          <button
            className={`tab-btn ${selectedTab === "recommended" ? "active" : ""}`}
            onClick={() => setSelectedTab("recommended")}
          >
              {t('home_tab_recommended')}
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
              <option value="all">{t('home_search_all')}</option>
              <option value="user">{t('home_search_user')}</option>
              <option value="country">{t('home_search_country')}</option>
              <option value="city">{t('home_search_city')}</option>
              <option value="monument">{t('home_search_monument')}</option>
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
        {loading && <p>{t('home_loading_routes')}</p>}
        {error && <p>{error}</p>}

        {!loading && !error && visibleTrips.length > 0 ? (
          <MasonryGrid
            items={visibleTrips.map((trip) => ({
              id: normalizeId(trip._id),
              title: trip.title || t('general_no_title'),
              img:
                  trip.coverImage ||
                (trip.gallery && trip.gallery[0]) ||
                "https://placehold.co/600x400?text=Ruta+Sense+Imatge",
              user: trip.author?.name || t('general_anonymous'),
              rating: typeof trip.avgRating === "number" ? trip.avgRating : 0,
              temps: trip.duration || "—",
              dificultat: trip.difficulty || "—",
              authorPic: trip.author?.profilePic || undefined,
              city: trip.city || "",
              country: trip.country || "",
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
                    : selectedTab === "recommended"
                    ? "https://cdn-icons-png.flaticon.com/512/7112/7112926.png"
                    : "https://cdn-icons-png.flaticon.com/512/4076/4076500.png"
                }
                alt="Sense rutes"
                className="no-trips-icon"
              />
              <p>
                {isFiltering
                  ? t('home_no_results_filter')
                  : selectedTab === "recommended"
                  ? t('home_no_recommended_routes')
                  : t('home_no_following')
                }
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
