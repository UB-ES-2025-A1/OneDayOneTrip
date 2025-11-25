import { useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import "../styles/CreateTripForm.css";
import "leaflet/dist/leaflet.css";
import MapSelector from "../components/MapSelector";


import {
  createTripMultipart,
  type TripCreatePayload,
} from "../api/trips";

type BackendUser = {
  uid: string;
  nom_i_cognoms?: string;
  username?: string;
  mail?: string;
  url_foto_perfil?: string;
};

type TripPointForm = {
  title: string;
  description: string;
  lat: number | null;
  lng: number | null;
};

interface CreateTripFormProps {
  onClose: () => void;
  currentUser: FirebaseUser;
  backendUser: BackendUser;
}

export default function CreateTripForm({
  onClose,
  currentUser,
  backendUser,
}: CreateTripFormProps) {
  // ---------- campos básicos ----------
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [routeMap] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [recommendedSeason, setRecommendedSeason] = useState("");

  // ---------- puntos de la ruta ----------
  const [tripPoints, setTripPoints] = useState<TripPointForm[]>([
    { title: "", description: "", lat: null, lng: null },
  ]);

  // imágenes
  const [cover, setCover] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [pointImages, setPointImages] = useState<(File | null)[]>([null]);

  // estado UI
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // ---------- helpers ----------
  const handleAddPoint = () => {
    setTripPoints((prev) => [
      ...prev,
      { title: "", description: "", lat: null, lng: null },
    ]);
    setPointImages((prev) => [...prev, null]);
  };

  const handleRemovePoint = (index: number) => {
    setTripPoints((prev) => prev.filter((_, i) => i !== index));
    setPointImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePointField = (
    index: number,
    field: keyof TripPointForm,
    value: string | number | null
  ) => {
    setTripPoints((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handlePointImageChange = (index: number, file: File | null) => {
    setPointImages((prev) => prev.map((f, i) => (i === index ? file : f)));
  };

  const handleGalleryChange = (files: FileList | null) => {
    if (!files) return;
    setGallery(Array.from(files));
  };

  const handleCoverChange = (file: File | null) => setCover(file);

  // =============================================================
  // 🚀 Submit: llama a createTripMultipart()
  // =============================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSubmitting(true);

      const payload: TripCreatePayload = {
        title,
        description,
        category,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),

        author: {
          uid: backendUser.uid,
          name:
            backendUser.nom_i_cognoms ||
            backendUser.username ||
            currentUser.displayName,
          email: backendUser.mail || currentUser.email,
          profilePic: backendUser.url_foto_perfil || currentUser.photoURL,
        },

        city,
        region,
        country,
        routeMap,

        trip_points: tripPoints.map((p) => ({
          title: p.title,
          description: p.description,
          coordinates: {
            lat: p.lat,
            lng: p.lng,
          },
        })),

        distance,
        duration,
        difficulty,
        recommendedSeason,
      };

      // llamada a la API centralizada
      await createTripMultipart(payload, cover, gallery, pointImages);

      setSuccess("Ruta creada correctament 🎉");
      // Si quieres cerrar automáticamente:
      // onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error creant trip:", err);
      setError(err.message || "Error inesperat creant la ruta");
    } finally {
      setSubmitting(false);
    }
  };

  // =============================================================
  // 🌈 UI
  // =============================================================

  return (
    <div className="create-trip-backdrop">
      <div className="create-trip-panel">
        <div className="create-trip-header">
          <h2>Crear nova ruta</h2>
          <button
            type="button"
            className="create-trip-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form className="create-trip-form" onSubmit={handleSubmit}>
          {/* mensajes */}
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          {/* --- datos básicos --- */}
          <div className="form-grid">
            <label>
              Títol
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label>
              Categoria
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </label>

            <label>
              Tags (separats per comes)
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </label>

            <label className="full-width">
              Descripció
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </label>

            <label>
              Ciutat
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label>
              Regió
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </label>
            <label>
              País
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </label>

            <label>
              Distància (km)
              <input
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </label>

            <label>
              Durada
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </label>

            <label>
              Dificultat
              <input
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              />
            </label>

            <label>
              Temporada recomanada
              <input
                value={recommendedSeason}
                onChange={(e) => setRecommendedSeason(e.target.value)}
              />
            </label>
          </div>

          {/* --- imágenes principales --- */}
          <div className="form-section">
            <h3>Imatges</h3>

            <div className="form-grid">
              <label>
                Imatge de portada
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleCoverChange(e.target.files?.[0] ?? null)
                  }
                />
              </label>

              <label>
                Galeria (múltiples)
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleGalleryChange(e.target.files)}
                />
              </label>
            </div>
          </div>

          {/* --- puntos de la ruta --- */}
          <div className="form-section">
            <div className="section-header">
              <h3>Punts de la ruta</h3>
              <button type="button" onClick={handleAddPoint}>
                + Afegir punt de ruta
              </button>
            </div>

            {tripPoints.map((p, index) => (
              <div key={index} className="trip-point">
                <div className="trip-point-header">
                  <h4>Punt #{index + 1}</h4>
                  {tripPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(index)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="form-grid">
                    <label>
                        Títol
                        <input
                        type="text"
                        value={p.title}
                        onChange={(e) =>
                            updatePointField(index, "title", e.target.value)
                        }
                        required
                        />
                    </label>

                    <label className="full-width">
                        Descripció
                        <textarea
                        value={p.description}
                        onChange={(e) =>
                            updatePointField(index, "description", e.target.value)
                        }
                        rows={3}
                        />
                    </label>

                    {/* 🔥 Aquí va el mapa */}
                    <label className="full-width">
                        Ubicació del punt:
                        <MapSelector
                        lat={p.lat}
                        lng={p.lng}
                        onSelect={(lat, lng) => {
                            updatePointField(index, "lat", lat);
                            updatePointField(index, "lng", lng);
                        }}
                        />
                    </label>

                    <label>
                        Imatge del punt
                        <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            handlePointImageChange(
                            index,
                            e.target.files?.[0] ?? null
                            )
                        }
                        />
                    </label>
                    </div>

              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>
              Cancel·lar
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Creant ruta..." : "Crear ruta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
