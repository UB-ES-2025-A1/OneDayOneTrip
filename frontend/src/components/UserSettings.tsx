import React from "react";
import "../styles/UserSettings.css";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function UserSettingsPopup({ open, onClose }: Props) {
  if (!open) return null;

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="settings-popup-overlay" onClick={handleBackgroundClick}>
      <div className="settings-popup">
        <button className="close-btn" onClick={onClose}>
          <X size={22} />
        </button>

        <h2 className="settings-title">Configuració</h2>

        {/* Contingut buit per ara */}
        <div className="settings-content"></div>
      </div>
    </div>
  );
}
