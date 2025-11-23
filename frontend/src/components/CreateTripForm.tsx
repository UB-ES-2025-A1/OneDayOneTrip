import { useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import "../styles/CreateTripForm.css";
import "leaflet/dist/leaflet.css";
import MapSelector from "../components/MapSelector";
import { addPublicationToUser } from "../api/client";

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

const STEPS = ["Detalls bàsics", "Ubicació i dades", "Imatges i punts"];

// Categorías de ruta
const CATEGORIES = [
  "Natura i muntanya",
  "Ciutats",
  "Platja",
  "Pobles i rutes rurals",
  "Gastronomia",
  "Cultural / Històric",
  "Esport i aventura",
  "Familiar",
];

// Tags disponibles
const ALL_TAGS = [
  "cultural",
  "gastronòmic",
  "artístic",
  "natura",
  "muntanya",
  "urbà",
  "romàntic",
  "familiar",
  "aventura",
  "relax",
  "fotografia",
  "música",
  "història",
  "platja",
  "rural",
];

// Ciudades grandes de España (sugerencias)
const BIG_SPANISH_CITIES = [
  "Madrid",
  "Barcelona",
  "València",
  "Sevilla",
  "Zaragoza",
  "Màlaga",
  "Múrcia",
  "Palma",
  "Bilbao",
  "Alacant",
  "Còrdova",
  "Valladolid",
  "Vigo",
  "Gijón",
  "L'Hospitalet de Llobregat",
  "A Coruña",
  "Vitoria-Gasteiz",
  "Granada",
  "Elx",
  "Oviedo",
];

// Comunidades autónomas
const AUTONOMOUS_REGIONS = [
  "Andalusia",
  "Aragó",
  "Astúries",
  "Illes Balears",
  "Canàries",
  "Cantàbria",
  "Castella i Lleó",
  "Castella-la Manxa",
  "Catalunya",
  "Comunitat Valenciana",
  "Extremadura",
  "Galícia",
  "La Rioja",
  "Comunitat de Madrid",
  "Regió de Múrcia",
  "Navarra",
  "País Basc",
  "Ceuta",
  "Melilla",
];

// Lista mundial pero solo 20 países
const TOP_COUNTRIES = [
  "Espanya",
  "França",
  "Itàlia",
  "Portugal",
  "Alemanya",
  "Regne Unit",
  "Països Baixos",
  "Bèlgica",
  "Suïssa",
  "Àustria",
  "Grècia",
  "Estats Units",
  "Canadà",
  "Mèxic",
  "Brasil",
  "Marroc",
  "Japó",
  "Xina",
  "Austràlia",
  "Argentina",
];

const DIFFICULTY_LEVELS = [
  "Molt fàcil",
  "Fàcil",
  "Moderada",
  "Difícil",
  "Molt difícil",
];

const SEASONS = ["Primavera", "Estiu", "Tardor", "Hivern"];

export default function CreateTripForm({
  onClose,
  currentUser,
  backendUser,
}: CreateTripFormProps) {
  // ---------- stepper ----------
  const [step, setStep] = useState(1);
  const totalSteps = STEPS.length;

  // ---------- campos básicos ----------
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  // Tags opción C: click + drag & drop
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [draggingTag, setDraggingTag] = useState<string | null>(null);

  // Ubicación / datos
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [routeMap] = useState<{ lat: number; lng: number }[]>([]);
  const [distance, setDistance] = useState(""); // km
  const [duration, setDuration] = useState(""); // horas
  const [difficulty, setDifficulty] = useState("");
  const [recommendedSeason, setRecommendedSeason] = useState("");

  // ---------- puntos de la ruta ----------
  const [tripPoints, setTripPoints] = useState<TripPointForm[]>([
    { title: "", description: "", lat: null, lng: null },
  ]);

  // imágenes
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [gallery, setGallery] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const [pointImages, setPointImages] = useState<(File | null)[]>([null]);

  // estado UI
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // ---------- helpers tags ----------
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleTagDropToSelected = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev : [...prev, tag]
    );
  };

  const handleTagDropToAvailable = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleDragStart = (tag: string) => {
    setDraggingTag(tag);
  };

  const handleDragEnd = () => {
    setDraggingTag(null);
  };

  // ---------- helpers puntos ----------
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

  // ---------- helpers imágenes ----------
  const handleGalleryChange = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setGallery(arr);
    const urls = arr.map((file) => URL.createObjectURL(file));
    setGalleryPreviews(urls);
  };

  const handleCoverChange = (file: File | null) => {
    setCover(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    } else {
      setCoverPreview(null);
    }
  };

  // ---------- navegación ----------
  const goNext = () => {
    if (step < totalSteps) setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  // =============================================================
  // ✅ VALIDACIONES
  // =============================================================
  const validateStep = (currentStep: number): boolean => {
    // limpiamos mensaje previo
    setError("");

    if (currentStep === 1) {
      if (!title.trim()) {
        setError("El títol és obligatori.");
        return false;
      }
      if (!category) {
        setError("Has de triar una categoria.");
        return false;
      }
      if (selectedTags.length === 0) {
        setError("Has de seleccionar almenys un tag.");
        return false;
      }
      if (!description.trim()) {
        setError("La descripció és obligatòria.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (!city.trim()) {
        setError("La ciutat és obligatòria.");
        return false;
      }
      if (!region) {
        setError("Has de triar una comunitat autònoma.");
        return false;
      }
      if (!country) {
        setError("Has de triar un país.");
        return false;
      }

      const distanceNum = Number(distance);
      if (!distance || Number.isNaN(distanceNum)) {
        setError("La distància ha de ser un número en km.");
        return false;
      }
      if (distanceNum <= 0 || distanceNum > 1000) {
        setError("La distància ha de ser entre 1 i 1000 km.");
        return false;
      }

      const durationNum = Number(duration);
      if (!duration || Number.isNaN(durationNum)) {
        setError("La durada ha de ser un número en hores.");
        return false;
      }
      if (durationNum <= 0 || durationNum > 72) {
        setError("La durada ha de ser entre 1 i 72 hores.");
        return false;
      }

      if (!difficulty) {
        setError("Has de triar un nivell de dificultat.");
        return false;
      }
      if (!recommendedSeason) {
        setError("Has de triar una temporada recomanada.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!cover) {
        setError("Has d’afegir una imatge de portada.");
        return false;
      }
      if (gallery.length === 0) {
        setError("Has d’afegir almenys una imatge a la galeria.");
        return false;
      }
      if (tripPoints.length === 0) {
        setError("Has d’afegir almenys un punt de ruta.");
        return false;
      }

      for (let i = 0; i < tripPoints.length; i++) {
        const p = tripPoints[i];
        if (!p.title.trim()) {
          setError(`Falta el títol del punt #${i + 1}.`);
          return false;
        }
        if (!p.description.trim()) {
          setError(`Falta la descripció del punt #${i + 1}.`);
          return false;
        }
        if (p.lat === null || p.lng === null) {
          setError(`Has de seleccionar la ubicació al mapa del punt #${i + 1}.`);
          return false;
        }
        if (!pointImages[i]) {
          setError(`Has d’afegir una imatge al punt #${i + 1}.`);
          return false;
        }
      }
    }

    return true;
  };

  // =============================================================
  // 🚀 Submit: llama a createTripMultipart()
  // =============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Si no estamos en el último paso -> solo validamos ese paso y avanzamos
    if (step !== totalSteps) {
      const ok = validateStep(step);
      if (!ok) return;
      goNext();
      return;
    }

    // Último paso: validamos TODO
    const allValid =
      validateStep(1) && validateStep(2) && validateStep(3);
    if (!allValid) return;

    try {
      setSubmitting(true);

      const distanceNum = Number(distance);
      const durationNum = Number(duration);

      const payload: TripCreatePayload = {
        title,
        description,
        category,
        tags: selectedTags,
        author: {
          userId: backendUser.uid,
          name:
            backendUser.nom_i_cognoms ||
            backendUser.username ||
            currentUser.displayName ||
            "Usuari",
          profilePic:
            backendUser.url_foto_perfil || currentUser.photoURL || null,
        },
        city,
        region,
        country,
        routeMap: routeMap || [],
        trip_points: tripPoints.map((p) => ({
          title: p.title,
          description: p.description,
          coordinates: {
            lat: p.lat ?? 0,
            lng: p.lng ?? 0,
          },
        })),
        distance: distanceNum,
        duration: `${durationNum} h`,
        difficulty,
        recommendedSeason,
      };

      const result = await createTripMultipart(
        payload,
        cover,
        gallery,
        pointImages
      );

      await addPublicationToUser(currentUser.uid, result.trip_id);

      setSuccess("Ruta creada correctament 🎉");
      onClose();
    } catch (err: any) {
      console.error("Error creant trip:", err);
      setError(err.message || "Error inesperat creant la ruta");
    } finally {
      setSubmitting(false);
    }
  };

  // ===================================================================
  // 🌈 UI
  // ===================================================================
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

        {/* STEP INDICATOR */}
        <div className="create-trip-stepper">
          {STEPS.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === step;
            const isCompleted = stepNumber < step;

            return (
              <div
                key={label}
                className={`stepper-step ${
                  isCompleted ? "completed" : isActive ? "active" : ""
                }`}
              >
                <div className="stepper-circle">{stepNumber}</div>
                <div className="stepper-label">{label}</div>
              </div>
            );
          })}
        </div>

        <form className="create-trip-form" onSubmit={handleSubmit}>
          {/* mensajes */}
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          {/* =========================
              PAS 1: DETALLS BÀSICS
             ========================= */}
          {step === 1 && (
            <div className="step-content">
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
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una categoria</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </label>

                {/* TAGS: click + drag & drop */}
                <div className="full-width tags-section">
                  <span className="tags-label">Tags de la ruta</span>
                  <p className="tags-helper">
                    Fes clic o arrossega els tags per afegir-los a la teva ruta.
                  </p>
                  <div className="tag-columns">
                    {/* Columna izquierda: disponibles */}
                    <div
                      className="tag-column"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggingTag) {
                          handleTagDropToAvailable(draggingTag);
                        }
                      }}
                    >
                      <h4>Tags disponibles</h4>
                      <div className="tag-pills">
                        {ALL_TAGS.filter(
                          (tag) => !selectedTags.includes(tag)
                        ).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className={`tag-pill ${
                              draggingTag === tag ? "dragging" : ""
                            }`}
                            draggable
                            onDragStart={() => handleDragStart(tag)}
                            onDragEnd={handleDragEnd}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </button>
                        ))}
                        {ALL_TAGS.filter(
                          (tag) => !selectedTags.includes(tag)
                        ).length === 0 && (
                          <span className="tag-empty">
                            Tots els tags estan seleccionats.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Columna derecha: seleccionados */}
                    <div
                      className="tag-column"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggingTag) {
                          handleTagDropToSelected(draggingTag);
                        }
                      }}
                    >
                      <h4>Els teus tags</h4>
                      <div
                        className={`tag-pills tag-dropzone ${
                          selectedTags.length === 0 ? "empty" : ""
                        }`}
                      >
                        {selectedTags.length === 0 && (
                          <span className="tag-empty">
                            Arrossega aquí tags o fes clic per seleccionar-ne.
                          </span>
                        )}
                        {selectedTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className="tag-pill selected"
                            draggable
                            onDragStart={() => handleDragStart(tag)}
                            onDragEnd={handleDragEnd}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <label className="full-width">
                  Descripció
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </label>
              </div>
            </div>
          )}

          {/* =========================
              PAS 2: UBICACIÓ + DADES
             ========================= */}
          {step === 2 && (
            <div className="step-content">
              <div className="form-grid">
                {/* Ciudad con datalist (sugerencias + escritura libre) */}
                <label>
                  Ciutat
                  <input
                    list="ciutats-espanya"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Escriu o selecciona una ciutat"
                    required
                  />
                  <datalist id="ciutats-espanya">
                    {BIG_SPANISH_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </label>

                <label>
                  Regió (Comunitat autònoma)
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    required
                  >
                    <option value="">Selecciona una comunitat</option>
                    {AUTONOMOUS_REGIONS.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  País
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  >
                    <option value="">Selecciona un país</option>
                    {TOP_COUNTRIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Distància (km)
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    step="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Durada (hores)
                  <input
                    type="number"
                    min={1}
                    max={72}
                    step="0.5"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Dificultat
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    required
                  >
                    <option value="">Selecciona dificultat</option>
                    {DIFFICULTY_LEVELS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Temporada recomanada
                  <select
                    value={recommendedSeason}
                    onChange={(e) =>
                      setRecommendedSeason(e.target.value)
                    }
                    required
                  >
                    <option value="">Selecciona temporada</option>
                    {SEASONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* =========================
              PAS 3: IMATGES + PUNTS
             ========================= */}
          {step === 3 && (
            <div className="step-content">
              {/* --- imatges principals --- */}
              <div className="form-section">
                <h3>Imatges principals</h3>

                <div className="image-upload-grid">
                  {/* Cover */}
                  <div className="image-card image-card-cover">
                    <div className="image-card-header">
                      <h4>Imatge de portada</h4>
                      <span className="image-card-subtitle">
                        Aquesta serà la imatge principal de la ruta.
                      </span>
                    </div>
                    <div className="image-card-body">
                      {coverPreview ? (
                        <div className="image-preview">
                          <img src={coverPreview} alt="Portada" />
                        </div>
                      ) : (
                        <div className="image-preview placeholder">
                          <span>Cap imatge seleccionada</span>
                        </div>
                      )}
                      <label className="image-input-button">
                        Selecciona imatge
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleCoverChange(e.target.files?.[0] ?? null)
                          }
                        />
                      </label>
                    </div>
                  </div>

                  {/* Galería */}
                  <div className="image-card image-card-gallery">
                    <div className="image-card-header">
                      <h4>Galeria d’imatges</h4>
                      <span className="image-card-subtitle">
                        Afegeix diverses imatges de la ruta.
                      </span>
                    </div>
                    <div className="image-card-body">
                      <div className="gallery-preview-grid">
                        {galleryPreviews.length > 0 ? (
                          galleryPreviews.map((src, idx) => (
                            <div
                              key={idx}
                              className="gallery-preview-item"
                            >
                              <img src={src} alt={`Galeria ${idx + 1}`} />
                            </div>
                          ))
                        ) : (
                          <div className="image-preview placeholder">
                            <span>Encara no hi ha imatges a la galeria</span>
                          </div>
                        )}
                      </div>
                      <label className="image-input-button">
                        Afegeix imatges
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleGalleryChange(e.target.files)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- punts de la ruta --- */}
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
                            updatePointField(
                              index,
                              "title",
                              e.target.value
                            )
                          }
                          required
                        />
                      </label>

                      <label className="full-width">
                        Descripció
                        <textarea
                          value={p.description}
                          onChange={(e) =>
                            updatePointField(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows={3}
                          required
                        />
                      </label>

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
                          required
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- BOTONES FOOTER (BACK/NEXT/SUBMIT) ---------- */}
          <div className="form-actions wizard-actions">
            {/* PAS 1 -> Cancel·lar + Següent */}
            {step === 1 && (
              <>
                <button type="button" onClick={onClose}>
                  Cancel·lar
                </button>

                <button type="submit" disabled={submitting}>
                  Següent
                </button>
              </>
            )}

            {/* PAS 2 i 3 -> Enrere + Següent / Crear ruta */}
            {step > 1 && (
              <>
                <button
                  type="button"
                  className="secondary"
                  onClick={goBack}
                >
                  Enrere
                </button>

                <button type="submit" disabled={submitting}>
                  {step === totalSteps
                    ? submitting
                      ? "Creant ruta..."
                      : "Crear ruta"
                    : "Següent"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
