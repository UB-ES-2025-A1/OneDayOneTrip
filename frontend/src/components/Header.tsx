
import { User2, ArrowLeft, Home as HomeIcon } from "lucide-react";

import { useNavigate } from "react-router-dom";
import "../styles/Header.css";
import { type User } from "firebase/auth";
import { useTranslation } from 'react-i18next'; // Importa el hook

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

  const goHome = () => navigate("/");
  const goProfile = () => navigate("/perfil");

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
            <button
              className="profile-btn"
              title={t('header_view_profile')}
              onClick={goProfile}
            >
              <User2 size={28} strokeWidth={2} color="white" />
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
