
import { useEffect, useState } from "react";
import { User2, ArrowLeft, Home as HomeIcon, Moon, Sun } from "lucide-react";

import { useNavigate } from "react-router-dom";
import "../styles/Header.css";
import { type User } from "firebase/auth";

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
  const navigate = useNavigate();

  const goHome = () => navigate("/");
  const goProfile = () => navigate("/perfil");

  return (
    <header className={`main-header variant-${variant}`}>
      <div className="header-left">
        {showBackButton && (
          <button className="back-btn-header" onClick={onBack}>
            <ArrowLeft size={22} /> <span>Tornar</span>
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
              title="Veure perfil"
              onClick={goProfile}
            >
              <User2 size={28} strokeWidth={2} color="white" />
            </button>
            <button onClick={onLogout} className="header-btn logout">
              Tancar sessió
            </button>
          </>
        ) : (
          <>
            <button onClick={onLogin} className="header-btn login">
              Iniciar sessió
            </button>
            <button onClick={onRegister} className="header-btn register">
              Registrar-se
            </button>
          </>
        )}
      </div>
    </header>
  );
}
