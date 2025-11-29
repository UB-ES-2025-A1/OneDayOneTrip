import React, { useState } from "react";
import "../styles/UserSettings.css";
import { X, Trash2 } from "lucide-react";
import { Auth } from "../firebase/auth";
import { deleteAccount } from "../api/client";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function UserSettingsPopup({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm(
      "Segur que vols esborrar el compte? Aquesta acció és irreversible."
    );
    if (!confirm1) return;

    try {
      setLoading(true);
      setError("");

      await deleteAccount();   
      await Auth.logout();

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
          <div className="settings-section">
            <h3 className="settings-section-title">Accions crítiques</h3>
            <p className="settings-warning">
              Esborrar el compte eliminarà totes les teves dades. Aquesta acció
              no es pot desfer.
            </p>

            <button
              className="danger-btn"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              <Trash2 size={18} />
              <span>{loading ? "Esborrant..." : "Esborrar compte"}</span>
            </button>

            {error && <p className="settings-error">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
