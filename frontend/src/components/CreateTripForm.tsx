import { useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import "../styles/CreateTripForm.css";
import "leaflet/dist/leaflet.css";
import MapSelector from "../components/MapSelector";
import { addPublicationToUser } from "../api/client";
import { useTranslation } from "react-i18next";

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

// -------------------------------------------------------------
// DEFINICIÓ DE LLISTES AMB CLAUS DE TRADUCCIÓ
// { value: "Valor BD", labelKey: "clau_json" }
// -------------------------------------------------------------

const CATEGORIES = [
    { value: "Natura i muntanya", labelKey: "category_nature_mountain" },
    { value: "Ciutats", labelKey: "category_cities" },
    { value: "Platja", labelKey: "category_beach" },
    { value: "Pobles i rutes rurals", labelKey: "category_villages_rural" },
    { value: "Gastronomia", labelKey: "category_gastronomy" },
    { value: "Cultural / Històric", labelKey: "category_cultural_historic" },
    { value: "Esport i aventura", labelKey: "category_sports_adventure" },
    { value: "Familiar", labelKey: "category_family" },
];

const ALL_TAGS = [
    { value: "cultural", labelKey: "tag_cultural" },
    { value: "gastronòmic", labelKey: "tag_gastronomic" },
    { value: "artístic", labelKey: "tag_artistic" },
    { value: "natura", labelKey: "tag_nature" },
    { value: "muntanya", labelKey: "tag_mountain" },
    { value: "urbà", labelKey: "tag_urban" },
    { value: "romàntic", labelKey: "tag_romantic" },
    { value: "familiar", labelKey: "tag_family" },
    { value: "aventura", labelKey: "tag_adventure" },
    { value: "relax", labelKey: "tag_relax" },
    { value: "fotografia", labelKey: "tag_photography" },
    { value: "música", labelKey: "tag_music" },
    { value: "història", labelKey: "tag_history" },
    { value: "platja", labelKey: "tag_beach" },
    { value: "rural", labelKey: "tag_rural" },
];

// Ciutats (Normalment no es tradueixen, es deixen com a string simple)
const BIG_SPANISH_CITIES = [
    "Madrid", "Barcelona", "València", "Sevilla", "Zaragoza", "Màlaga", "Múrcia",
    "Palma", "Bilbao", "Alacant", "Còrdova", "Valladolid", "Vigo", "Gijón",
    "L'Hospitalet de Llobregat", "A Coruña", "Vitoria-Gasteiz", "Granada", "Elx", "Oviedo",
];

const AUTONOMOUS_REGIONS = [
    { value: "Andalusia", labelKey: "region_andalusia" },
    { value: "Aragó", labelKey: "region_aragon" },
    { value: "Astúries", labelKey: "region_asturias" },
    { value: "Illes Balears", labelKey: "region_balearic_islands" },
    { value: "Canàries", labelKey: "region_canary_islands" },
    { value: "Cantàbria", labelKey: "region_cantabria" },
    { value: "Castella i Lleó", labelKey: "region_castile_leon" },
    { value: "Castella-la Manxa", labelKey: "region_castile_la_mancha" },
    { value: "Catalunya", labelKey: "region_catalonia" },
    { value: "Comunitat Valenciana", labelKey: "region_valencian_community" },
    { value: "Extremadura", labelKey: "region_extremadura" },
    { value: "Galícia", labelKey: "region_galicia" },
    { value: "La Rioja", labelKey: "region_la_rioja" },
    { value: "Comunitat de Madrid", labelKey: "region_madrid" },
    { value: "Regió de Múrcia", labelKey: "region_murcia" },
    { value: "Navarra", labelKey: "region_navarre" },
    { value: "País Basc", labelKey: "region_basque_country" },
    { value: "Ceuta", labelKey: "region_ceuta" },
    { value: "Melilla", labelKey: "region_melilla" },
];

const TOP_COUNTRIES = [
    { value: "Espanya", labelKey: "country_spain" },
    { value: "França", labelKey: "country_france" },
    { value: "Itàlia", labelKey: "country_italy" },
    { value: "Portugal", labelKey: "country_portugal" },
    { value: "Alemanya", labelKey: "country_germany" },
    { value: "Regne Unit", labelKey: "country_united_kingdom" },
    { value: "Països Baixos", labelKey: "country_netherlands" },
    { value: "Bèlgica", labelKey: "country_belgium" },
    { value: "Suïssa", labelKey: "country_switzerland" },
    { value: "Àustria", labelKey: "country_austria" },
    { value: "Grècia", labelKey: "country_greece" },
    { value: "Estats Units", labelKey: "country_united_states" },
    { value: "Canadà", labelKey: "country_canada" },
    { value: "Mèxic", labelKey: "country_mexico" },
    { value: "Brasil", labelKey: "country_brazil" },
    { value: "Marroc", labelKey: "country_morocco" },
    { value: "Japó", labelKey: "country_japan" },
    { value: "Xina", labelKey: "country_china" },
    { value: "Austràlia", labelKey: "country_australia" },
    { value: "Argentina", labelKey: "country_argentina" },
];

const DIFFICULTY_LEVELS = [
    { value: "Molt fàcil", labelKey: "difficulty_very_easy" },
    { value: "Fàcil", labelKey: "difficulty_easy" },
    { value: "Moderada", labelKey: "difficulty_moderate" },
    { value: "Difícil", labelKey: "difficulty_hard" },
    { value: "Molt difícil", labelKey: "difficulty_very_hard" },
];

const SEASONS = [
    { value: "Primavera", labelKey: "season_spring" },
    { value: "Estiu", labelKey: "season_summer" },
    { value: "Tardor", labelKey: "season_autumn" },
    { value: "Hivern", labelKey: "season_winter" },
];

export default function CreateTripForm({
                                           onClose,
                                           currentUser,
                                           backendUser,
                                       }: CreateTripFormProps) {
    const { t } = useTranslation();

    const STEPS = [
        t('create_trip_step_1'),
        t('create_trip_step_2'),
        t('create_trip_step_3')
    ];

    const [step, setStep] = useState(1);
    const totalSteps = STEPS.length;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [draggingTag, setDraggingTag] = useState<string | null>(null);

    const [city, setCity] = useState("");
    const [region, setRegion] = useState("");
    const [country, setCountry] = useState("");
    const [routeMap] = useState<{ lat: number; lng: number }[]>([]);
    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [recommendedSeason, setRecommendedSeason] = useState("");

    const [tripPoints, setTripPoints] = useState<TripPointForm[]>([
        { title: "", description: "", lat: null, lng: null },
    ]);

    const [cover, setCover] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [gallery, setGallery] = useState<File[]>([]);
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
    const [pointImages, setPointImages] = useState<(File | null)[]>([null]);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    // ---------- helpers tags ----------
    const toggleTag = (tagValue: string) => {
        setSelectedTags((prev) =>
            prev.includes(tagValue) ? prev.filter((t) => t !== tagValue) : [...prev, tagValue]
        );
    };

    const handleTagDropToSelected = (tagValue: string) => {
        setSelectedTags((prev) => (prev.includes(tagValue) ? prev : [...prev, tagValue]));
    };

    const handleTagDropToAvailable = (tagValue: string) => {
        setSelectedTags((prev) => prev.filter((t) => t !== tagValue));
    };

    const handleDragStart = (tagValue: string) => setDraggingTag(tagValue);
    const handleDragEnd = () => setDraggingTag(null);

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

    const updatePointField = (index: number, field: keyof TripPointForm, value: string | number | null) => {
        setTripPoints((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
    };

    const handlePointImageChange = (index: number, file: File | null) => {
        setPointImages((prev) => prev.map((f, i) => (i === index ? file : f)));
    };

    const handleGalleryChange = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        setGallery((prev) => [...prev, ...newFiles]);
        const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
        setGalleryPreviews((prev) => [...prev, ...newPreviews]);
    };

    const handleCoverChange = (file: File | null) => {
        setCover(file);
        if (file) {
            setCoverPreview(URL.createObjectURL(file));
        } else {
            setCoverPreview(null);
        }
    };

    const goNext = () => { if (step < totalSteps) setStep((s) => s + 1); };
    const goBack = () => { if (step > 1) setStep((s) => s - 1); };

    const validateStep = (currentStep: number): boolean => {
        setError("");

        if (currentStep === 1) {
            if (!title.trim()) { setError(t('create_trip_error_title_required')); return false; }
            if (!category) { setError(t('create_trip_error_category_required')); return false; }
            if (selectedTags.length === 0) { setError(t('create_trip_error_tags_required')); return false; }
            if (!description.trim()) { setError(t('create_trip_error_description_required')); return false; }
        }

        if (currentStep === 2) {
            if (!city.trim()) { setError(t('create_trip_error_city_required')); return false; }
            if (!region) { setError(t('create_trip_error_region_required')); return false; }
            if (!country) { setError(t('create_trip_error_country_required')); return false; }

            const distanceNum = Number(distance);
            if (!distance || Number.isNaN(distanceNum)) { setError(t('create_trip_error_distance_number')); return false; }
            if (distanceNum <= 0 || distanceNum > 1000) { setError(t('create_trip_error_distance_range')); return false; }

            const durationNum = Number(duration);
            if (!duration || Number.isNaN(durationNum)) { setError(t('create_trip_error_duration_number')); return false; }
            if (durationNum <= 0 || durationNum > 72) { setError(t('create_trip_error_duration_range')); return false; }

            if (!difficulty) { setError(t('create_trip_error_difficulty_required')); return false; }
            if (!recommendedSeason) { setError(t('create_trip_error_season_required')); return false; }
        }

        if (currentStep === 3) {
            if (!cover) { setError(t('create_trip_error_cover_required')); return false; }
            if (gallery.length === 0) { setError(t('create_trip_error_gallery_required')); return false; }
            if (tripPoints.length === 0) { setError(t('create_trip_error_points_required')); return false; }

            for (let i = 0; i < tripPoints.length; i++) {
                const p = tripPoints[i];
                if (!p.title.trim()) { setError(`${t('create_trip_error_point_title_missing')} ${i + 1}.`); return false; }
                if (!p.description.trim()) { setError(`${t('create_trip_error_point_description_missing')} ${i + 1}.`); return false; }
                if (p.lat === null || p.lng === null) { setError(`${t('create_trip_error_point_location_missing')} ${i + 1}.`); return false; }
                if (!pointImages[i]) { setError(`${t('create_trip_error_point_image_missing')} ${i + 1}.`); return false; }
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (step !== totalSteps) {
            const ok = validateStep(step);
            if (!ok) return;
            goNext();
            return;
        }

        const allValid = validateStep(1) && validateStep(2) && validateStep(3);
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
                    name: backendUser.nom_i_cognoms || backendUser.username || currentUser.displayName || t('general_user'),
                    profilePic: backendUser.url_foto_perfil || currentUser.photoURL || null,
                },
                city,
                region,
                country,
                routeMap: routeMap || [],
                trip_points: tripPoints.map((p) => ({
                    title: p.title,
                    description: p.description,
                    coordinates: { lat: p.lat ?? 0, lng: p.lng ?? 0 },
                })),
                distance: distanceNum,
                duration: `${durationNum} h`,
                difficulty,
                recommendedSeason,
            };

            const result = await createTripMultipart(payload, cover, gallery, pointImages, t);
            await addPublicationToUser(currentUser.uid, result.trip_id);

            setSuccess(t('create_trip_success'));
            onClose();
        } catch (err: any) {
            console.error("Error creant trip:", err);
            setError(err.message || t('general_error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="create-trip-backdrop">
            <div className="create-trip-panel">
                <div className="create-trip-header">
                    <h2>{t('create_trip_title')}</h2>
                    <button type="button" className="create-trip-close" onClick={onClose}>✕</button>
                </div>

                <div className="create-trip-stepper">
                    {STEPS.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = stepNumber === step;
                        const isCompleted = stepNumber < step;

                        return (
                            <div key={index} className={`stepper-step ${isCompleted ? "completed" : isActive ? "active" : ""}`}>
                                <div className="stepper-circle">{stepNumber}</div>
                                <div className="stepper-label">{label}</div>
                            </div>
                        );
                    })}
                </div>

                <form className="create-trip-form" onSubmit={handleSubmit}>
                    {error && <div className="form-error">{error}</div>}
                    {success && <div className="form-success">{success}</div>}

                    {step === 1 && (
                        <div className="step-content">
                            <div className="form-grid">
                                <label>
                                    {t('create_trip_title_label')}
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                                </label>

                                <label>
                                    {t('create_trip_category_label')}
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                                        <option value="">{t('create_trip_select_category')}</option>
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
                                        ))}
                                    </select>
                                </label>

                                <div className="full-width tags-section">
                                    <span className="tags-label">{t('create_trip_tags_label')}</span>
                                    <p className="tags-helper">{t('create_trip_tags_helper')}</p>
                                    <div className="tag-columns">
                                        <div className="tag-column" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (draggingTag) handleTagDropToAvailable(draggingTag); }}>
                                            <div className="tag-pills">
                                                {ALL_TAGS.filter((tagObj) => !selectedTags.includes(tagObj.value)).map((tagObj) => (
                                                    <button key={tagObj.value} type="button" className={`tag-pill ${draggingTag === tagObj.value ? "dragging" : ""}`} draggable onDragStart={() => handleDragStart(tagObj.value)} onDragEnd={handleDragEnd} onClick={() => toggleTag(tagObj.value)}>
                                                        {t(tagObj.labelKey)}
                                                    </button>
                                                ))}
                                                {ALL_TAGS.filter((tagObj) => !selectedTags.includes(tagObj.value)).length === 0 && (
                                                    <span className="tag-empty">{t('create_trip_tags_empty_available')}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="tag-column" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (draggingTag) handleTagDropToSelected(draggingTag); }}>
                                            <h4>{t('create_trip_tags_your_tags')}</h4>
                                            <div className={`tag-pills tag-dropzone ${selectedTags.length === 0 ? "empty" : ""}`}>
                                                {selectedTags.length === 0 && (
                                                    <span className="tag-empty">{t('create_trip_tags_dropzone_placeholder')}</span>
                                                )}
                                                {selectedTags.map((tagVal) => {
                                                    const tagObj = ALL_TAGS.find(t => t.value === tagVal);
                                                    return (
                                                        <button key={tagVal} type="button" className="tag-pill selected" draggable onDragStart={() => handleDragStart(tagVal)} onDragEnd={handleDragEnd} onClick={() => toggleTag(tagVal)}>
                                                            {tagObj ? t(tagObj.labelKey) : tagVal}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <label className="full-width">
                                    {t('create_trip_description_label')}
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content">
                            <div className="form-grid">
                                <label>
                                    {t('create_trip_city_label')}
                                    <input list="ciutats-espanya" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t('create_trip_city_placeholder')} required />
                                    <datalist id="ciutats-espanya">{BIG_SPANISH_CITIES.map((c) => (<option key={c} value={c} />))}</datalist>
                                </label>

                                <label>
                                    {t('create_trip_region_label')}
                                    <select value={region} onChange={(e) => setRegion(e.target.value)} required>
                                        <option value="">{t('create_trip_select_region')}</option>
                                        {AUTONOMOUS_REGIONS.map((reg) => (<option key={reg.value} value={reg.value}>{t(reg.labelKey)}</option>))}
                                    </select>
                                </label>

                                <label>
                                    {t('create_trip_country_label')}
                                    <select value={country} onChange={(e) => setCountry(e.target.value)} required>
                                        <option value="">{t('create_trip_select_country')}</option>
                                        {TOP_COUNTRIES.map((p) => (<option key={p.value} value={p.value}>{t(p.labelKey)}</option>))}
                                    </select>
                                </label>

                                <label>
                                    {t('create_trip_distance_label')}
                                    <input type="number" min={1} max={1000} step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} required />
                                </label>

                                <label>
                                    {t('create_trip_duration_label')}
                                    <input type="number" min={1} max={72} step="0.5" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                                </label>

                                <label>
                                    {t('create_trip_difficulty_label')}
                                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} required>
                                        <option value="">{t('create_trip_select_difficulty')}</option>
                                        {DIFFICULTY_LEVELS.map((d) => (<option key={d.value} value={d.value}>{t(d.labelKey)}</option>))}
                                    </select>
                                </label>

                                <label>
                                    {t('create_trip_season_label')}
                                    <select value={recommendedSeason} onChange={(e) => setRecommendedSeason(e.target.value)} required>
                                        <option value="">{t('create_trip_select_season')}</option>
                                        {SEASONS.map((s) => (<option key={s.value} value={s.value}>{t(s.labelKey)}</option>))}
                                    </select>
                                </label>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content">
                            <div className="form-section">
                                <h3>{t('create_trip_images_title')}</h3>
                                <div className="image-upload-grid">
                                    <div className="image-card image-card-cover">
                                        <div className="image-card-header">
                                            <h4>{t('create_trip_cover_title')}</h4>
                                            <span className="image-card-subtitle">{t('create_trip_cover_subtitle')}</span>
                                        </div>
                                        <div className="image-card-body">
                                            {coverPreview ? (<div className="image-preview"><img src={coverPreview} alt="Portada" /></div>) : (<div className="image-preview placeholder"><span>{t('create_trip_cover_no_image')}</span></div>)}
                                            <label className="image-input-button">
                                                {t('create_trip_cover_select_button')}
                                                <input type="file" accept="image/*" onChange={(e) => handleCoverChange(e.target.files?.[0] ?? null)} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="image-card image-card-gallery">
                                        <div className="image-card-header">
                                            <h4>{t('create_trip_gallery_title')}</h4>
                                            <span className="image-card-subtitle">{t('create_trip_gallery_subtitle')}</span>
                                        </div>
                                        <div className="image-card-body">
                                            <div className="gallery-preview-grid">
                                                {galleryPreviews.length > 0 ? (
                                                    galleryPreviews.map((src, idx) => (
                                                        <div key={idx} className="gallery-preview-item" style={{ position: "relative" }}>
                                                            <img src={src} alt={`Galeria ${idx + 1}`} />
                                                            <button type="button" className="remove-image-btn" onClick={() => { setGallery((prev) => prev.filter((_, i) => i !== idx)); setGalleryPreviews((prev) => prev.filter((_, i) => i !== idx)); }}>✕</button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="image-preview placeholder"><span>{t('create_trip_gallery_no_image')}</span></div>
                                                )}
                                            </div>
                                            <label className="image-input-button">
                                                {t('create_trip_gallery_add_button')}
                                                <input type="file" multiple accept="image/*" onChange={(e) => handleGalleryChange(e.target.files)} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <div className="section-header">
                                    <h3>{t('create_trip_points_title')}</h3>
                                    <button type="button" onClick={handleAddPoint}>{t('create_trip_add_point')}</button>
                                </div>

                                {tripPoints.map((p, index) => (
                                    <div key={index} className="trip-point">
                                        <div className="trip-point-header">
                                            <h4>{t('create_trip_point_number')}{index + 1}</h4>
                                            {tripPoints.length > 1 && (<button type="button" onClick={() => handleRemovePoint(index)}>{t('create_trip_point_delete')}</button>)}
                                        </div>

                                        <div className="form-grid">
                                            <label>
                                                {t('create_trip_title_label')}
                                                <input type="text" value={p.title} onChange={(e) => updatePointField(index, "title", e.target.value)} required />
                                            </label>

                                            <label className="full-width">
                                                {t('create_trip_description_label')}
                                                <textarea value={p.description} onChange={(e) => updatePointField(index, "description", e.target.value)} rows={3} required />
                                            </label>

                                            <label className="full-width">
                                                {t('create_trip_point_location')}
                                                <MapSelector lat={p.lat} lng={p.lng} onSelect={(lat, lng) => { updatePointField(index, "lat", lat); updatePointField(index, "lng", lng); }} />
                                            </label>

                                            <div className="image-point-wrapper">
                                                <span className="image-point-label-text">{t('create_trip_point_image')}</span>
                                                <input id={`point-image-${index}`} type="file" accept="image/*" className="image-point-input" onChange={(e) => { const file = e.target.files?.[0] ?? null; handlePointImageChange(index, file); }} required />
                                                <div className="image-point-controls">
                                                    <label htmlFor={`point-image-${index}`} className="image-input-button image-point-button">{t('create_trip_point_select_image')}</label>
                                                    <span className="image-point-filename">{pointImages[index]?.name ? pointImages[index]!.name : t('create_trip_point_no_file')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="form-actions wizard-actions">
                        {step === 1 && (
                            <>
                                <button type="button" onClick={onClose}>{t('general_cancel')}</button>
                                <button type="submit" disabled={submitting}>{t('create_trip_next')}</button>
                            </>
                        )}
                        {step > 1 && (
                            <>
                                <button type="button" className="secondary" onClick={goBack}>{t('create_trip_back')}</button>
                                <button type="submit" disabled={submitting}>{step === totalSteps ? (submitting ? t('create_trip_creating_route') : t('create_trip_create_route')) : t('create_trip_next')}</button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}