import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../firebase";

import "../styles/Home.css";
import "../styles/LoginReg.css";

import Carousel from "../components/Carousel";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import MasonryGrid from "../components/MasonryGrid";
import UserCard from "../components/UserCard";
import Layout from "../components/Layout";

import { getVisibleTripsForUser, type Trip } from "../api/trips";
import { getUserById, searchUsers } from "../api/client";

import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

type SearchFilter = "all" | "user" | "country" | "city" | "monument";
type SearchMode = "trips" | "users";

/* -------------------------------------------------- */
/* Wilson Score                                       */
/* -------------------------------------------------- */
function wilsonScore(avgRating: number, numRatings: number): number {
  if (!avgRating || !numRatings) return 0;

  const z = 1.96;
  const p = avgRating / 5;

  const numerator =
    p +
    (z * z) / (2 * numRatings) -
    z *
      Math.sqrt(
        ((p * (1 - p)) + (z * z) / (4 * numRatings)) / numRatings
      );

  const denominator = 1 + (z * z) / numRatings;
  return numerator / denominator;
}

export default function Home() {
  const { t } = useTranslation();

  const [modalOpen, setModalOpen] =
    useState<"login" | "register" | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<any | null>(null);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTab, setSelectedTab] =
    useState<"recommended" | "following">("recommended");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] =
    useState<SearchFilter>("all");
  const [searchMode, setSearchMode] =
    useState<SearchMode>("trips");

  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const tripsLoadedRef = useRef(false);

  const getFirebaseUid = (u: any) =>
    String(
      u?.uid ||
        u?.firebase_uid ||
        u?.auth_uid ||
        u?.userId ||
        u?.firebaseUid ||
        ""
    );

  const followedIds = (backendUser?.llista_seguits || []).map(String);
  const followedSet = new Set(followedIds);

  const getAnyId = (u: any) =>
    String(
      getFirebaseUid(u) || u?._id || u?.userId || u?.id || u?.uid || ""
    );

  const visibleUsers =
    selectedTab === "following"
      ? users.filter((u) => followedSet.has(getAnyId(u)))
      : users;


  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        setBackendUser(null);
        return;
      }

      try {
        const backendInfo = await getUserById(user.uid);
        setBackendUser(backendInfo);
      } catch {
        setBackendUser(null);
      }
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setBackendUser(null);
    setTrips([]);
    tripsLoadedRef.current = false;
  };

  /* ---------------- TRIPS ---------------- */
  useEffect(() => {
    if (tripsLoadedRef.current) return;
    if (currentUser && !backendUser) return;

    let cancelled = false;

    const loadTrips = async () => {
      try {
        setLoadingTrips(true);
        setError(null);

        const data = await getVisibleTripsForUser(
          currentUser?.uid ?? null,
          backendUser,
          t
        );

        if (!cancelled) {
          setTrips(data);
          tripsLoadedRef.current = true;
        }
      } catch {
        if (!cancelled) {
          setError(t("home_error_loading_routes"));
        }
      } finally {
        if (!cancelled) {
          setLoadingTrips(false);
        }
      }
    };

    loadTrips();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid, backendUser, t]);

  /* ---------------- USERS ---------------- */
  useEffect(() => {
    if (searchMode !== "users" || !currentUser) return;

    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const blocked = backendUser?.llista_bloquejats || [];
        const q = searchTerm.trim(); // <--- usa el searchTerm
        const data = await searchUsers(q, currentUser.uid, blocked);
        setUsers(data);
      } catch {
        setError("Error carregant usuaris");
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, [searchMode, currentUser, backendUser, searchTerm]);

  /* ---------------- FILTERS ---------------- */
  const filteredTrips = trips
    .filter((trip) => {
      if (selectedTab === "recommended") return true;
      const followed = backendUser?.llista_seguits || [];
      return followed.includes(trip.author?.userId);
    })
    .sort((a, b) => {
      const sa = wilsonScore(a.avgRating || 0, a.numRatings || 0);
      const sb = wilsonScore(b.avgRating || 0, b.numRatings || 0);
      return sb - sa;
    });

  const search = searchTerm.trim().toLowerCase();

  const visibleTrips = filteredTrips.filter((trip) => {
    if (!search) return true;

    const title = trip.title?.toLowerCase() || "";
    const city = trip.city?.toLowerCase() || "";
    const country = trip.country?.toLowerCase() || "";
    const user = trip.author?.name?.toLowerCase() || "";

    switch (searchFilter) {
      case "user":
        return user.includes(search);
      case "city":
        return city.includes(search);
      case "country":
        return country.includes(search);
      case "monument":
        return title.includes(search);
      default:
        return (
          title.includes(search) ||
          city.includes(search) ||
          country.includes(search) ||
          user.includes(search)
        );
    }
  });

  /* ---------------- RENDER ---------------- */
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
          <p>{t("home_slogan_1")}</p>
          <p>{t("home_slogan_2")}</p>
        </section>

        {currentUser && (
          <div className="tabs-container" data-active={selectedTab}>
            <button
              className={`tab-btn ${
                selectedTab === "following" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("following")}
            >
              {t("home_tab_following")}
            </button>
            <button
              className={`tab-btn ${
                selectedTab === "recommended" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("recommended")}
            >
              {t("home_tab_recommended")}
            </button>
          </div>
        )}

        {currentUser && (
          <div className="search-bar-container">
            <div className="search-bar">
              <select
                className="search-filter-select"
                value={searchFilter}
                onChange={(e) => {
                  const f = e.target.value as SearchFilter;
                  setSearchFilter(f);
                  setSearchMode(f === "user" ? "users" : "trips");
                }}
              >
                <option value="all">{t("home_search_all")}</option>
                <option value="user">{t("home_search_user")}</option>
                <option value="country">{t("home_search_country")}</option>
                <option value="city">{t("home_search_city")}</option>
                <option value="monument">{t("home_search_monument")}</option>
              </select>

              <span className="search-divider" />

              <input
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  searchMode === "users"
                    ? "Cercar per nom o username..."
                    : t("home_placeholder_all")
                }
              />

              <Search className="search-icon" size={18} />
            </div>
          </div>
        )}

        <section className="trip-list-section">
          {(searchMode === "users" ? usersLoading : loadingTrips) && (
            <p>
              {searchMode === "users"
                ? "Carregant usuaris..."
                : t("home_loading_routes")}
            </p>
          )}

          {error && <p>{error}</p>}

          {!usersLoading &&
            searchMode === "users" &&
            visibleUsers.length > 0 && (
              <div className="users-grid">
                {visibleUsers.map((u) => (
                  <UserCard
                    key={getFirebaseUid(u)}
                    uid={getFirebaseUid(u)}
                    name={u.nom_i_cognoms || ""}
                    username={u.username}
                    profilePic={u.url_foto_perfil}
                  />
                ))}
              </div>
            )}

          {!loadingTrips &&
            searchMode === "trips" &&
            visibleTrips.length > 0 && (
              <MasonryGrid
                items={visibleTrips.map((trip) => ({
                  id: String(trip._id),
                  title: trip.title,
                  img:
                    trip.coverImage ||
                    trip.gallery?.[0] ||
                    "https://placehold.co/600x400",
                  user: trip.author?.name || "",
                  rating: trip.avgRating || 0,
                  temps: trip.duration || "—",
                  dificultat: trip.difficulty || "—",
                  authorPic: trip.author?.profilePic,
                  city: trip.city,
                  country: trip.country,
                }))}
                currentUser={currentUser}
                openRegister={() => setModalOpen("register")}
              />
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
