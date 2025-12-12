import React, { useEffect, useState } from "react";
import "../styles/UserSettings.css";
import { X } from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import {
  deleteAccount,
  accept_follow_request,
  getUserById,
  updateUser,
} from "../api/client";
import { getNotifications, deleteNotification } from "../api/notifier";
import i18n from "../i18n/i18n";
import { useTranslation } from "react-i18next";
import type { BackendUser } from "../pages/UserProfile";

type Props = {
  open: boolean;
  onClose: () => void;
  profile: BackendUser;
  onSavePrivacy?: (updatedProfile: BackendUser) => void;
};

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function UserSettings({
  open,
  profile,
  onClose,
  onSavePrivacy,
}: Props) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [error, setError] = useState("");

  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const [language, setLanguage] = useState(i18n.language || "ca");
  const [isPrivate, setIsPrivate] = useState<boolean>(!!profile.isPrivate);

  // Sincroniza privacidad si cambia el perfil
  useEffect(() => {
    setIsPrivate(!!profile.isPrivate);
  }, [profile?.uid, profile?.isPrivate]);

  // Tema
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLanguage(lng);
    localStorage.setItem("lang", lng);
  };

  // 🔐 Cambiar privacidad (USANDO client.ts)
  const handleChangePrivacy = async (newPrivacy: boolean) => {
    try {
      setPrivacyLoading(true);
      setError("");

      // 1️⃣ Actualiza en backend
      await updateUser(profile.uid, { isPrivate: newPrivacy });

      setIsPrivate(newPrivacy);

      let updatedProfile: BackendUser = { ...profile, isPrivate: newPrivacy };

      // 2️⃣ Si pasa a público → aceptar solicitudes y limpiar notificaciones
      if (!newPrivacy) {
        try {
          const pending = profile.llista_solicitud_seguidors || [];
          for (const fromUserId of pending) {
            await accept_follow_request(profile.uid, fromUserId);
          }

          const notifications = await getNotifications(profile.uid, false);
          const followReq = notifications.filter(
            (n: any) => n.type === "follow_request"
          );

          for (const notif of followReq) {
            await deleteNotification(notif.id);
          }
        } catch (err) {
          console.error("⚠️ Error procesando solicitudes/notificaciones:", err);
        }
      }

      // 3️⃣ Refresca perfil real del backend
      try {
        const refreshed = await getUserById(profile.uid);
        updatedProfile = {
          ...(refreshed as BackendUser),
          llista_seguidors: refreshed.llista_seguidors || [],
          llista_seguits: refreshed.llista_seguits || [],
          llista_solicitud_seguidors:
            refreshed.llista_solicitud_seguidors || [],
          llista_solicitud_seguits:
            refreshed.llista_solicitud_seguits || [],
          publicacions: refreshed.publicacions || [],
          guardades: refreshed.guardades || [],
          llista_bloquejats: refreshed.llista_bloquejats || [],
          llista_bloquejadors: refreshed.llista_bloquejadors || [],
          isPrivate: !!refreshed.isPrivate,
        };

        setIsPrivate(!!updatedProfile.isPrivate);
      } catch (err) {
        console.error("⚠️ Error refrescando perfil:", err);
      }

      onSavePrivacy?.(updatedProfile);
    } catch (e: any) {
      console.error("❌ Error cambiando privacidad:", e);
      setError(e?.message || t("profile_error_updating"));
      setIsPrivate(!!profile.isPrivate);
    } finally {
      setPrivacyLoading(false);
    }
  };

  if (!open) return null;

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError(t("settings_error_not_logged_in_delete"));
      return;
    }

    const confirmDelete = window.confirm(t("settings_confirm_delete"));
    if (!confirmDelete) return;

    try {
      setLoading(true);
      setError("");

      await deleteAccount(user.uid);
      await signOut(auth);

      alert(t("settings_success_delete"));
      window.location.href = "/";
    } catch (err: any) {
      console.error("❌ Error eliminando cuenta:", err);
      setError(err?.message || t("settings_error_delete"));
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

        <h2 className="settings-title">{t("profile_settings_button")}</h2>

        <div className="settings-content">
          {/* APARIENCIA */}
          <div className="settings-section">
            <h3 className="settings-subtitle">
              {t("settings_subtitle_appearance")}
            </h3>

            <div className="settings-row">
              <span className="settings-row-label">
                {t("settings_label_dark_mode")}
              </span>

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

          {/* PRIVACIDAD */}
          <div className="settings-section">
            <h3 className="settings-subtitle">{t("privacy")}</h3>
            <div className="settings-row">
              <div>
                <span className="settings-row-label">
                  {t("profile")}{" "}
                  {isPrivate ? t("private") : t("public")}
                </span>
                <span className="settings-row-helper">
                  {isPrivate
                    ? t("only_followers_see_route")
                    : t("all_users_see_route")}
                </span>
              </div>

              <label className="toggle-wrapper">
                <input
                  type="checkbox"
                  className="toggle-checkbox"
                  checked={isPrivate}
                  onChange={(e) => handleChangePrivacy(e.target.checked)}
                  disabled={privacyLoading}
                />

                <div className="toggle-slot">
                  <div className="toggle-button" />
                </div>
              </label>

            </div>
          </div>

          {/* IDIOMA */}
          <div className="settings-section">
            <h3 className="settings-subtitle">{t("language")}</h3>

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

          {/* ELIMINAR CUENTA */}
          <div className="settings-section">
            <p className="settings-warning">
              {t("settings_warning_delete")}
            </p>

            <button
              className="danger-btn"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              {loading
                ? t("settings_button_deleting")
                : t("settings_button_delete")}
            </button>

            {error && <p className="settings-error">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
