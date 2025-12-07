import React, { useEffect, useState } from "react";
import "../styles/UserSettings.css";
import { X } from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { deleteAccount } from "../api/client";
import i18n from "../i18n/i18n";


type Props = {
  open: boolean;
  onClose: () => void;
};

// Funció per decidir tema inicial (localStorage o preferència del sistema)
function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function UserSettings({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🌙 estat del tema
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  const [language, setLanguage] = useState(i18n.language || "ca");

  const changeLanguage = (lng: string) => {
      i18n.changeLanguage(lng);
      setLanguage(lng);
      localStorage.setItem("lang", lng);
  };


    // Cada cop que canvia el tema → actualitzem l'HTML i el guardem
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (!open) return null;

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;

    if (!user) {
      setError("Has d'estar identificat per eliminar el compte.");
      return;
    }

    const confirm1 = window.confirm(
      "Segur que vols esborrar el compte? Aquesta acció és irreversible."
    );
    if (!confirm1) return;

    try {
      setLoading(true);
      setError("");

      // 1) Backend: eliminar compte i totes les dades relacionades
      await deleteAccount(user.uid);

      // 2) Tancar sessió al frontend
      await signOut(auth);

      alert("El teu compte s'ha esborrat correctament.");
      window.location.href = "/";
    } catch (err: any) {
      console.error("Error esborrant el compte:", err);
      setError(
        err?.message || "Hi ha hagut un error en esborrar el compte."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-popup-overlay" onClick={handleBackgroundClick}>
      <div className="settings-popup">
        <button className="close-btn" onClick={onClose}>
          <X size={22} />
        </button>

        <h2 className="settings-title">Configuració</h2>

        <div className="settings-content">
          {/* 🌙 Aparença / Mode fosc */}
          <div className="settings-section">
            <h3 className="settings-subtitle">Aparença</h3>

            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Mode fosc</span>

              </div>

              {/* Toggle animat tipus Uiverse */}
              <label className="toggle-wrapper">
                <input
                  type="checkbox"
                  className="toggle-checkbox"
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                />
                <div className="toggle-slot">
                  <div className="sun-icon-wrapper">
                    <div className="sun-icon">☀</div>
                  </div>
                  <div className="moon-icon-wrapper">
                    <div className="moon-icon">🌙</div>
                  </div>
                  <div className="toggle-button" />
                </div>
              </label>
            </div>
          </div>

            <div className="settings-section">
                <h3 className="settings-subtitle">Idioma</h3>

                <div className="settings-row">
                    <div className="settings-row-info">
                        <span className="settings-row-label">Selecciona idioma</span>
                    </div>

                    <select
                        className="settings-select"
                        value={language}
                        onChange={(e) => changeLanguage(e.target.value)}
                    >
                        <option value="ca">Català</option>
                        <option value="es">Castellà</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>


            {/* 🗑️ Secció eliminar compte */}
          <div className="settings-section">
            <p className="settings-warning">
              Esborrar el compte eliminarà totes les teves dades. Aquesta acció és irreversible.
            </p>

            <button
              className="danger-btn"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              <span>{loading ? "Esborrant..." : "Eliminar compte"}</span>
            </button>

            {error && <p className="settings-error">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
