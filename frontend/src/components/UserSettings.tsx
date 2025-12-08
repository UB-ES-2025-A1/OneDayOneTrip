import React, { useEffect, useState } from "react";
import "../styles/UserSettings.css";
import { X } from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { deleteAccount } from "../api/client";
import i18n from "../i18n/i18n";
import { useTranslation } from 'react-i18next'; // Importa el hook


type Props = {
  open: boolean;
  onClose: () => void;
  isPrivate: boolean;
  onChangePrivacy: (value: boolean) => void;
};

// Funció per decidir tema inicial (localStorage o preferència del sistema)
function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function UserSettings({ open, onClose, isPrivate, onChangePrivacy }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError(t('settings_error_not_logged_in_delete'));
      return;
    }

    const confirm1 = window.confirm(
      t('settings_confirm_delete')
    );
    if (!confirm1) return;

    try {
      setLoading(true);
      setError("");

      // 1) Backend: eliminar compte i totes les dades relacionades
      await deleteAccount(user.uid);

      // 2) Tancar sessió al frontend
      await signOut(auth);

      alert(t('settings_success_delete'));
      window.location.href = "/";
    } catch (err: any) {
      console.error(t('error_deleting_account'), err);
      setError(
        err?.message || t('settings_error_delete'));
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

        <h2 className="settings-title">{t('profile_settings_button')}</h2>

        <div className="settings-content">
          <div className="settings-section">
            <h3 className="settings-subtitle">{t('settings_subtitle_appearance')}</h3>

            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">{t('settings_label_dark_mode')}</span>

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
            <h3 className="settings-subtitle">Privacitat</h3>

            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">
                  Perfil {isPrivate ? "privat" : "públic"}
                </span>
                <span className="settings-row-helper">
                  {isPrivate
                    ? "Només els seguidors aprovats podran veure el teu perfil i les teves rutes."
                    : "Qualsevol usuari podrà veure el teu perfil i les teves rutes."}
                </span>
              </div>

              {/* Toggle senzill per privacitat (reutilitza l’estil) */}
              <label className="toggle-wrapper">
                <input
                  type="checkbox"
                  className="toggle-checkbox"
                  checked={isPrivate}
                  onChange={(e) => onChangePrivacy(e.target.checked)}
                />
                <div className="toggle-slot">
                  <div className="toggle-button" />
                </div>
              </label>
            </div>
          </div>

            <div className="settings-section">
                <h3 className="settings-subtitle">{t('language')}</h3>

                <div className="settings-row">
                    <div className="settings-row-info">
                        <span className="settings-row-label">{t('select_language')}</span>
                    </div>

                    <div className="settings-select-wrapper">
                      <select
                        className="settings-select"
                        value={language}
                        onChange={(e) => changeLanguage(e.target.value)}
                      >
                        <option value="ca">Català</option>
                        <option value="es">Castellà</option>
                        <option value="en">English</option>
                      </select>
                      <span className="settings-select-arrow">▾</span>
                    </div>

                </div>
            </div>


            {/* 🗑️ Secció eliminar compte */}
          <div className="settings-section">
            <p className="settings-warning">
                {t('settings_warning_delete')}
            </p>

            <button
              className="danger-btn"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              <span>{loading ? t('settings_button_deleting') : t('settings_button_delete') }</span>
            </button>

            {error && <p className="settings-error">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
