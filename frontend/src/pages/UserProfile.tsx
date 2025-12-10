import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { getUserById, deleteTripAndPublication } from "../api/client";
import { getAllTrips, type Trip } from "../api/trips";
import "../styles/UserProfile.css";
import { Settings } from "lucide-react";
import { ImageOff, Pencil, Mail} from "lucide-react";
import MasonryGrid from "../components/MasonryGrid";
import Layout from "../components/Layout";
import LlistaSeguits from "../components/LlistaSeguitsModal";
import EditarPerfil from "../components/EditarPerfilModal";
import LlistaSeguidors from "../components/LlistaSeguidorsModal";
import CreateTripForm from "../components/CreateTripForm";
import UserSettings from "../components/UserSettings";
import { useTranslation } from 'react-i18next'; // Importa el hook
import AvatarFallback from "../components/AvatarFallback"; 
import Mailbox from "../components/Mailbox";
import useNotifications from "../hooks/useNotifications";

export type BackendUser = {
  uid: string;
  nom_i_cognoms?: string;
  mail?: string;
  username?: string;
  seguidors?: number;
  seguits?: number;
  llista_seguidors?: string[];
  llista_seguits?: string[];
  llista_solicitud_seguidors?: string[];
  llista_solicitud_seguits?: string[];
  llista_bloquejats?: string[];
  llista_bloquejadors?: string[];
  publicacions?: string[];
  guardades?: string[];
  url_foto_perfil?: string;
  url_foto_panell?: string;
  isPrivate?: boolean;
};

type GridItem = {
  id: string;
  title: string;
  img: string;
  user: string;
  rating: number;
  temps: string;
  dificultat: string;
  authorPic?: string;
  city?: string;
  country?: string;
};

export default function UserProfile() {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<BackendUser | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTab, setSelectedTab] = useState<"publicacions" | "guardat">(
    "publicacions"
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [openEdit, setOpenEdit] = useState(false);
  const [modalOpen, setModalOpen] = useState<"createTrip" | null>(null);
  const [seguitsModalOpen, setSeguitsModalOpen] = useState(false);
  const [seguidoresModalOpen, setSeguidoresModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const {
    notifications,
    markRead,
    refreshNotifications,
    removeLocal,
  } = useNotifications();


  const navigate = useNavigate();

  const refreshProfile = async () => {
    if (!currentUser) return;
    try {
      const updatedProfile = await getUserById(currentUser.uid);
      updatedProfile.llista_seguidors = updatedProfile.llista_seguidors || [];
      updatedProfile.llista_seguits = updatedProfile.llista_seguits || [];
      updatedProfile.llista_solicitud_seguidors = updatedProfile.llista_solicitud_seguidors || [];
      updatedProfile.llista_solicitud_seguits = updatedProfile.llista_solicitud_seguits || [];
      updatedProfile.publicacions = updatedProfile.publicacions || [];
      updatedProfile.guardades = updatedProfile.guardades || [];
      updatedProfile.llista_bloquejats = updatedProfile.llista_bloquejats || [];
      updatedProfile.llista_bloquejadors = updatedProfile.llista_bloquejadors || [];

      setProfile(updatedProfile as BackendUser);
    } catch (err) {
      console.error("Error refrescant el perfil", err);
    }
  };

  // ---------------------------
  // Carregar usuari i trips
  // ---------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (!fbUser) {
        setProfile(null);
        setTrips([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const backendUser = await getUserById(fbUser.uid);
        backendUser.llista_seguidors = backendUser.llista_seguidors || [];
        backendUser.llista_seguits = backendUser.llista_seguits || [];
        backendUser.llista_solicitud_seguidors = backendUser.llista_solicitud_seguidors || [];
        backendUser.llista_solicitud_seguits = backendUser.llista_solicitud_seguits || [];
        backendUser.publicacions = backendUser.publicacions || [];
        backendUser.guardades = backendUser.guardades || [];
        backendUser.llista_bloquejats = backendUser.llista_bloquejats || [];
        backendUser.llista_bloquejadors = backendUser.llista_bloquejadors || [];

        setProfile(backendUser as BackendUser);

        const allTrips = await getAllTrips(true);
        const pubIds = new Set(backendUser.publicacions.map(String));
        const guardIds = new Set(backendUser.guardades.map(String));
        const userTrips = allTrips.filter(
          (t) => pubIds.has(String(t._id)) || guardIds.has(String(t._id))
        );
        setTrips(userTrips);
      } catch (e: any) {
        console.error(t('profile_error_loading_profile'), e);
        setError(e?.message || t('profile_error_loading'));
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // ---------------------------
  // Funcions
  // ---------------------------
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const openRegister = () => alert(t('profile_login'));

  const openSeguidorsModal = async () => {
    if (!profile) return;
    try {
      const updatedProfile = await getUserById(profile.uid);
      updatedProfile.llista_seguidors = updatedProfile.llista_seguidors || [];
      setProfile(updatedProfile as BackendUser);
      setSeguidoresModalOpen(true);
    } catch (err) {
      console.error(t('followers_modal_loading'), err);
    }
  };

  const openSeguitsModal = async () => {
    if (!profile) return;
    try {
      const updatedProfile = await getUserById(profile.uid);
      updatedProfile.llista_seguits = updatedProfile.llista_seguits || [];
      setProfile(updatedProfile as BackendUser);
      setSeguitsModalOpen(true);
    } catch (err) {
      console.error(t('profile_reloading_following'), err);
    }
  };

  // 🔹 Funció per navegar a altre perfil
  const goToProfile = (uid: string) => {
    navigate(`/user/${uid}`);
    setSeguidoresModalOpen(false);
    setSeguitsModalOpen(false);
  };

  const toGridItems = (trips: Trip[]): GridItem[] =>
    trips.map((trip) => ({
      id: String(trip._id),
      title: trip.title || t('general_no_title'),
      img:
        trip.coverImage ||
        (trip.gallery && trip.gallery[0]) ||
        "https://placehold.co/600x400?text=Ruta+Sense+Imatge",
      user: trip.author?.name || t('general_anonymous'),
      rating: typeof trip.avgRating === "number" ? trip.avgRating : 0,
      temps: trip.duration || "—",
      dificultat: trip.difficulty || "—",
      authorPic: trip.author?.profilePic || "",
      city: trip.city || "",
      country: trip.country || "",
    }));

  const askDeleteTrip = (tripId: string) => {
    setTripToDelete(tripId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteTrip = async () => {
    if (!currentUser || !profile || !tripToDelete) return;

    try {
      await deleteTripAndPublication(profile.uid, tripToDelete);

      // Treure-la de trips
      setTrips((prev) =>
        prev.filter((t) => String(t._id) !== String(tripToDelete))
      );

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              publicacions: (prev.publicacions || []).filter(
                (id) => String(id) !== String(tripToDelete)
              ),
            }
          : prev
      );
    } catch (err: any) {
      console.error(t('profile_error_deleting_route'), err);
      alert(err?.message || t('profile_error_deleting_route'));
    } finally {
      setDeleteModalOpen(false);
      setTripToDelete(null);
    }
  };

  const handleCancelDeleteTrip = () => {
    setDeleteModalOpen(false);
    setTripToDelete(null);
  };

  // ---------------------------
  // Derivats visuals
  // ---------------------------
  const displayName =
    profile?.nom_i_cognoms ||
    currentUser?.displayName ||
    profile?.username ||
    t('home_search_user');
  const displayMail = profile?.mail || currentUser?.email || "";
  const panelUrl = profile?.url_foto_panell || "/images/ny.jpg";

  const seguidors =
    profile?.llista_seguidors?.length ?? profile?.seguidors ?? 0;
  const seguits = profile?.llista_seguits?.length ?? profile?.seguits ?? 0;

  const publicacionsItems = useMemo(() => {
    const pubIds = new Set((profile?.publicacions || []).map(String));
    return toGridItems(trips.filter((t) => pubIds.has(String(t._id))));
  }, [trips, profile?.publicacions]);

  const guardadesItems = useMemo(() => {
    const guardIds = new Set((profile?.guardades || []).map(String));
    return toGridItems(trips.filter((t) => guardIds.has(String(t._id))));
  }, [trips, profile?.guardades]);

  const gridItems =
    selectedTab === "publicacions" ? publicacionsItems : guardadesItems;

  
  const openMailbox = () => {
    setMailboxOpen(true);
  };

  const handleAfterAcceptNotification = async (notificationId: string) => {
    removeLocal(notificationId);
    await refreshNotifications();
    await refreshProfile();
  };

  const handleAfterRejectNotification = async (notificationId: string) => {
    removeLocal(notificationId);
    await refreshNotifications();
  };


  // Render
  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
      onLogin={() => navigate("/")}
      onRegister={() => navigate("/")}
      variant="perfil"
    >
      {loading && <div className="loading-state">{t('profile_loading')}</div>}
      {error && !loading && <div className="error-state">{error}</div>}

      {currentUser && profile && !loading && (
        <>
          <div
            className="user-profile"
            style={{
              background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${panelUrl}) center/cover no-repeat`,
              position: "relative",
            }}
          >
          {currentUser && profile && currentUser.uid === profile.uid && (
              <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
                <Settings size={36} />
              </button>
            )}

            <button className="edit-profile-btn" onClick={() => setOpenEdit(true)}> <Pencil size={22} /></button>
          
            <button className="edit-profile-btn" onClick={() => setOpenEdit(true)}>
              <Pencil size={22} />
            </button>

             <button className="mailbox-btn" onClick={openMailbox}>
              <Mail size={24} />

              {/* BADGE DE NOTIFICACIONES SIN LEER */}
              {notifications && notifications.some((n) => !n.read) && (
                <span className="mailbox-badge-icon">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>


            <div className="user-photo">
              {profile.url_foto_perfil ? (
                <img src={profile.url_foto_perfil} alt={t('edit_profile_profile_photo')} />
              ) : (
                <AvatarFallback name={displayName} />
              )}
            </div>

            <div className="user-details">
              <div className="user-info">
                <h2>{displayName}</h2>
                <h3>{displayMail}</h3>
              </div>

              <div className="user-stats">
                <div className="stat" onClick={openSeguidorsModal}>
                  <span className="number">{seguidors}</span>
                  <span className="label">{t('followers_modal_title')}</span>
                </div>

                <div className="stat" onClick={openSeguitsModal}>
                  <span className="number">{seguits}</span>
                  <span className="label">{t('following_modal_title')}</span>
                </div>

                <div className="stat">
                  <span className="number">{publicacionsItems.length}</span>
                  <span className="label">{t('profile_tab_publications')}</span>
                </div>

                <div className="stat">
                  <span className="number">{guardadesItems.length}</span>
                  <span className="label">{t('profile_stat_saved')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tabs-container" data-active={selectedTab}>
            <button
              className={`tab-btn ${
                selectedTab === "publicacions" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("publicacions")}
            >
                {t('profile_stat_publications')}
            </button>
            <button
              className={`tab-btn ${
                selectedTab === "guardat" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("guardat")}
            >
                {t('profile_tab_saved')}
            </button>
          </div>

          <section className="trip-list">
            <MasonryGrid
              items={gridItems}
              openRegister={openRegister}
              currentUser={currentUser}
              showCreateButton={selectedTab === "publicacions"}
              onCreateTripClick={() => setModalOpen("createTrip")}
              showDeleteIcon={selectedTab === "publicacions"}
              onDeleteTrip={askDeleteTrip} 
            />

            {gridItems.length === 0 && (
              <div className="empty-state">
                <ImageOff className="empty-icon" size={60} />
                {selectedTab === "publicacions" ? (
                  <>
                    <h3>{t('profile_empty_publications_title')}</h3>
                    <p>{t('profile_empty_publications_text')}</p>
                  </>
                ) : (
                  <>
                    <h3>{t('profile_empty_saved_title')}</h3>
                    <p>{t('profile_empty_saved_text')}</p>
                  </>
                )}
              </div>
            )}

            {modalOpen === "createTrip" && currentUser && profile && (
              <CreateTripForm
                onClose={() => setModalOpen(null)}
                currentUser={currentUser}
                backendUser={profile}
              />
            )}
          </section>

          {/* ---------------- Modales ---------------- */}
          {seguitsModalOpen && profile && (
            <LlistaSeguits
              open={seguitsModalOpen}
              onClose={() => setSeguitsModalOpen(false)}
              seguits={profile.llista_seguits || []}
              currentUserId={currentUser.uid}
              goToProfile={goToProfile}
            />
          )}

          {seguidoresModalOpen && profile && (
            <LlistaSeguidors
              open={seguidoresModalOpen}
              onClose={() => setSeguidoresModalOpen(false)}
              seguidors={profile.llista_seguidors || []}
              currentUserId={currentUser.uid}
              goToProfile={goToProfile} 
            />
          )}
          <UserSettings 
            open={settingsOpen} 
            onClose={() => setSettingsOpen(false)}
            profile={profile}
            onSavePrivacy={(updatedProfile) => setProfile(updatedProfile)}
          />

          {openEdit && profile && (
            <EditarPerfil
              profile={profile}
              onClose={() => setOpenEdit(false)}
              onSave={(updated) => {
                setProfile(updated);
                setOpenEdit(false);
              }}
            />
          )}

          {deleteModalOpen && ( 
          <div className="confirm-delete-backdrop">
            <div className="confirm-delete-modal">
              <h3>{t('profile_confirm_delete_title')}</h3>
              <p>
                  {t('profile_confirm_delete_text')}
              </p>

              <div className="confirm-delete-buttons">
                <button
                  className="btn-secondary"
                  onClick={handleCancelDeleteTrip}
                >
                    {t('general_cancel')}
                </button>
                <button
                  className="btn-danger"
                  onClick={handleConfirmDeleteTrip}
                >
                    {t('general_delete')}
                </button>
              </div>
            </div>
          </div>
        )}


          {openEdit && profile && (
            <EditarPerfil
              profile={profile}
              onClose={() => setOpenEdit(false)}
              onSave={(updated) => {
                setProfile(updated);
                setOpenEdit(false);
              }}
            />

          )}

          {openEdit && profile && (
            <EditarPerfil
              profile={profile}
              onClose={() => setOpenEdit(false)}
              onSave={(updated) => {
                setProfile(updated);
                setOpenEdit(false);
              }}
            />
          )}

          <Mailbox
            open={mailboxOpen}
            onClose={() => setMailboxOpen(false)}
            notifications={notifications}
            onMarkRead={markRead}
            onAfterAccept={handleAfterAcceptNotification}
            onAfterReject={handleAfterRejectNotification}
          />


        </>
      )}
    </Layout>
  );
}
