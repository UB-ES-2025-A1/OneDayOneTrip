import { useState } from "react";
import type { ChangeEvent } from "react";
import type { BackendUser } from "../pages/UserProfile";
import "../styles/EditarPerfil.css";
import { useTranslation } from "react-i18next";
import { updateUser } from "../api/client"; // ⭐ Importante

interface EditarPerfilProps {
  profile: BackendUser;
  onClose: () => void;
  onSave?: (updatedProfile: BackendUser) => void;
}

export default function EditarPerfil({ profile, onClose, onSave }: EditarPerfilProps) {
  const { t } = useTranslation();

  const [nom, setNom] = useState(profile.nom_i_cognoms || "");
  const [username, setUsername] = useState(profile.username || "");

  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState(profile.url_foto_perfil || "");

  const [fotoPanell, setFotoPanell] = useState<File | null>(null);
  const [fotoPanellPreview, setFotoPanellPreview] = useState(profile.url_foto_panell || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (url: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      // Datos en formato JSON que FastAPI espera dentro de user_json
      const jsonData = {
        nom_i_cognoms: nom || null,
        username: username || null,
      };

      // 🚀 Llamamos directamente a client.updateUser()
      const result = await updateUser(
        profile.uid,
        jsonData,
        fotoPerfil,
        fotoPanell
      );

      const updatedUser: BackendUser = {
        ...profile,
        ...result.updated,
        url_foto_perfil: result.updated.url_foto_perfil ?? profile.url_foto_perfil,
        url_foto_panell: result.updated.url_foto_panell ?? profile.url_foto_panell,
      };

      if (onSave) onSave(updatedUser);

      onClose();
    } catch (e: any) {
      console.error("❌ Error updating user", e);
      setError(e?.message || t("edit_profile_error_save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="editar-perfil-card">
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>

        <h2>{t("profile_edit_button")}</h2>
        {error && <p className="text-red">{error}</p>}

        <div className="two-columns">
          <div className="form-group">
            <label>{t("register_full_name")}</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>{t("edit_profile_username")}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="two-columns">
          <div className="form-group">
            <label>{t("edit_profile_profile_photo")}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setFotoPerfil, setFotoPerfilPreview)}
            />
            {fotoPerfilPreview && (
              <img src={fotoPerfilPreview} className="preview-img" alt="profile" />
            )}
          </div>

          <div className="form-group">
            <label>{t("edit_profile_cover_photo")}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setFotoPanell, setFotoPanellPreview)}
            />
            {fotoPanellPreview && (
              <img src={fotoPanellPreview} className="preview-img" alt="cover" />
            )}
          </div>
        </div>

        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? t("edit_profile_saving") : t("general_save_changes")}
        </button>
      </div>
    </div>
  );
}
