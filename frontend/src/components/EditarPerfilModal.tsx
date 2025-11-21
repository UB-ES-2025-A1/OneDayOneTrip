import { useState } from "react";
import type { ChangeEvent } from "react";
import type { BackendUser } from "../pages/UserProfile";
import "../styles/EditarPerfil.css";

interface EditarPerfilProps {
  profile: BackendUser;
  onClose: () => void;
  onSave?: (updatedProfile: BackendUser) => void; // callback opcional
}

export default function EditarPerfil({ profile, onClose, onSave }: EditarPerfilProps) {
  const [nom, setNom] = useState(profile.nom_i_cognoms || "");
  const [username, setUsername] = useState(profile.username || "");
  const [email, setEmail] = useState(profile.mail || "");
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState(profile.url_foto_perfil || "");
  const [fotoPanell, setFotoPanell] = useState<File | null>(null);
  const [fotoPanellPreview, setFotoPanellPreview] = useState(profile.url_foto_panell || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Manejar selección de archivo
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, setFile: any, setPreview: any) => {
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
      const updatedProfile: BackendUser = {
        ...profile,
        nom_i_cognoms: nom,
        username,
        mail: email,
        url_foto_perfil: fotoPerfilPreview, // Aquí guardamos la URL de vista previa
        url_foto_panell: fotoPanellPreview,
      };

      // Si quieres, aquí podrías subir los archivos a tu servidor o API
      // y actualizar updatedProfile con la URL final

      if (onSave) onSave(updatedProfile);
      onClose();
    } catch (e: any) {
      console.error("Error al guardar perfil:", e);
      setError(e?.message || "No s'ha pogut guardar el perfil.");
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
        <h2>Editar Perfil</h2>

        {error && <p className="text-red">{error}</p>}

        <div className="form-group">
          <label>Nom complet</label>
          <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Correu electrònic</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Foto de perfil</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, setFotoPerfil, setFotoPerfilPreview)}
          />
          {fotoPerfilPreview && (
            <img
              src={fotoPerfilPreview}
              alt="Vista previa foto perfil"
              className="preview-img"
            />
          )}
        </div>

        <div className="form-group">
          <label>Foto de portada</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, setFotoPanell, setFotoPanellPreview)}
          />
          {fotoPanellPreview && (
            <img
              src={fotoPanellPreview}
              alt="Vista previa foto portada"
              className="preview-img"
            />
          )}
        </div>

        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Guardant..." : "Guardar Canvis"}
        </button>
      </div>
    </div>
  );
}
