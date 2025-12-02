// Header.tsx
import { useEffect, useState } from "react";
import { UserCircle, ArrowLeft, Home as HomeIcon, Moon, Sun } from "lucide-react";
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

// Funció per decidir tema inicial (localStorage o preferència del sistema)
function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
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

  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  // Cada cop que canvia el tema → actualitzem l'HTML i el guardem
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

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
        {/* Botó mode clar/fosc */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Canviar tema"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          <span className="theme-toggle-text">
            {theme === "light" ? "Mode fosc" : "Mode clar"}
          </span>
        </button>

        {currentUser ? (
          <>
            <button
              className="profile-btn"
              title="Veure perfil"
              onClick={goProfile}
            >
              <UserCircle size={28} />
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
