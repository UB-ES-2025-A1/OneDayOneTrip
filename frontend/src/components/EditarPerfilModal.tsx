import { useState } from "react";
import type { ChangeEvent } from "react";
import type { BackendUser } from "../pages/UserProfile";
import "../styles/EditarPerfil.css";

interface EditarPerfilProps {
  profile: BackendUser;
  onClose: () => void;
  onSave?: (updatedProfile: BackendUser) => void;
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

  // Seleccionar archivos
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

  // Guardar cambios (PATCH multipart)
  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const formData = new FormData();

      const jsonData = {
        nom_i_cognoms: nom || null,
        username: username || null,
        mail: email || null,
      };

      // FastAPI requiere user_json como string
      formData.append("user_json", JSON.stringify(jsonData));

      if (fotoPerfil) formData.append("foto_perfil", fotoPerfil);
      if (fotoPanell) formData.append("foto_panell", fotoPanell);

      const response = await fetch(
        `http://127.0.0.1:8000/users/update/${profile.uid}`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Error actualitzant el perfil");
      }

      const result = await response.json();

      // result.updated contiene los valores exactos actualizados por el backend
      const updatedUser: BackendUser = {
        ...profile,
        ...result.updated,
        url_foto_perfil: result.updated.url_foto_perfil ?? profile.url_foto_perfil,
        url_foto_panell: result.updated.url_foto_panell ?? profile.url_foto_panell,
      };

      if (onSave) onSave(updatedUser);

      onClose();

    } catch (e: any) {
      console.error("Error:", e);
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

        {/* Nombre + Username */}
        <div className="two-columns">
          <div className="form-group">
            <label>Nom complet</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label>Correu electrònic</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {/* Foto perfil + Foto portada */}
        <div className="two-columns">
          <div className="form-group">
            <label>Foto de perfil</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setFotoPerfil, setFotoPerfilPreview)}
            />
            {fotoPerfilPreview && (
              <img src={fotoPerfilPreview} alt="Foto perfil" className="preview-img" />
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
              <img src={fotoPanellPreview} alt="Foto portada" className="preview-img" />
            )}
          </div>
        </div>

        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Guardant..." : "Guardar Canvis"}
        </button>
      </div>
    </div>
  );
}
