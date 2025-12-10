import { ArrowLeft, Home as HomeIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";
import { type User } from "firebase/auth";
import AvatarFallback from "./AvatarFallback"; 
import { useEffect, useState } from "react";
import { getUserById } from "../api/client";
import { useTranslation } from 'react-i18next';
        
export type BackendUser = {
  uid: string;
  nom_i_cognoms?: string;
  username?: string;
  url_foto_perfil?: string;
};

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onLogin: () => void;
  onRegister: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  variant?: "home" | "ruta" | "perfil";
}

export default function Header({
  currentUser,
  onLogout,
  onLogin,
  onRegister,
  showBackButton = false,
  onBack,
  variant = "home",
}: HeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BackendUser | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const backendUser = await getUserById(currentUser.uid);
        setProfile(backendUser || null);
      } catch (err) {
        console.error("Error cargando perfil:", err);
        setProfile(null);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const goHome = () => navigate("/");
  const goProfile = () => navigate("/perfil");

  const displayName =
    profile?.nom_i_cognoms ||
    currentUser?.displayName ||
    profile?.username ||
    "?";

  return (
    <header className={`main-header variant-${variant}`}>
      <div className="header-left">
        {showBackButton && (
          <button className="back-btn-header" onClick={onBack}>
            <ArrowLeft size={22} /> <span>{t('route_detail_back')}</span>
          </button>
        )}
        {variant === "perfil" && (
          <button className="home-btn-header" onClick={goHome}>
            <HomeIcon size={22} />
          </button>
        )}
      </div>

      <h1 className="logo" onClick={goHome}>
        OneDayOneTrip
      </h1>

      <div className="header-right">
        {currentUser ? (
          <>
            {/* FOTO PERFIL O AVATAR */}
            <button
              className="profile-btn"
              title={t('header_view_profile')}
              onClick={goProfile}
              style={{
                borderRadius: "50%",
                overflow: "hidden",
                width: "35px",
                height: "35px",
                padding: 0,
                border: "none",
                background: "transparent",
              }}
            >
              {profile?.url_foto_perfil ? (
                <img
                  src={profile.url_foto_perfil}
                  alt="Foto de perfil"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Foto de perfil"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <AvatarFallback name={displayName} size={35} />
              )}
            </button>

            <button onClick={onLogout} className="header-btn logout">
                {t('header_close_session')}
            </button>
          </>
        ) : (
          <>
            <button onClick={onLogin} className="header-btn login">
                {t('login_title')}
            </button>
            <button onClick={onRegister} className="header-btn register">
                {t('register_register_button')}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
