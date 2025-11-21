import { useState } from "react";
import type { BackendUser } from "../pages/UserProfile";
import "../styles/EditarPerfil.css";

interface EditarPerfilProps {
  profile: BackendUser;
  onClose: () => void;
  onSave?: (updatedProfile: BackendUser) => void; // opcional callback al guardar
}

export default function EditarPerfil({ profile, onClose, onSave }: EditarPerfilProps) {
  const [nom, setNom] = useState(profile.nom_i_cognoms || "");
  const [username, setUsername] = useState(profile.username || "");
  const [email, setEmail] = useState(profile.mail || "");
  const [fotoPerfil, setFotoPerfil] = useState(profile.url_foto_perfil || "");
  const [fotoPanell, setFotoPanell] = useState(profile.url_foto_panell || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const updatedProfile: BackendUser = {
        ...profile,
        nom_i_cognoms: nom,
        username,
        mail: email,
        url_foto_perfil: fotoPerfil,
        url_foto_panell: fotoPanell,
      };

      // Aquí puedes llamar tu API para actualizar el usuario
      // await updateUser(updatedProfile);

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
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Correu electrònic</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Foto de perfil (URL)</label>
          <input
            type="text"
            value={fotoPerfil}
            onChange={(e) => setFotoPerfil(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Foto de portada (URL)</label>
          <input
            type="text"
            value={fotoPanell}
            onChange={(e) => setFotoPanell(e.target.value)}
          />
        </div>

        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Guardant..." : "Guardar Canvis"}
        </button>
      </div>
    </div>
  );
}
