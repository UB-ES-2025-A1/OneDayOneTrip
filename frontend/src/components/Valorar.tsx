import "../styles/Valorar.css";
import { useState, type JSX } from "react";

interface ValorarProps {
  tripId: string;
  onClose: () => void;
}

export default function Valorar({ tripId, onClose }: ValorarProps) {
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    onClose();
  };

  // Generem inputs + labels com a fills directes de .rating
  const starElements: JSX.Element[] = [];
  for (let n = 5; n >= 1; n--) {
    starElements.push(
      <input
        key={`input-${n}`}
        type="radio"
        id={`estrella-${n}`}
        name="rating"
        value={n}
        checked={rating === n}
        onChange={() => setRating(n)}
      />
    );
    starElements.push(
      <label
        key={`label-${n}`}
        htmlFor={`estrella-${n}`}
      />
    );
  }

  return (
    <div className="valorar-container">
      <div className="valorar-header">
        <h2 className="valorar-title">Valora aquesta ruta</h2>
        <button className="valorar-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Estrelles */}
      <div className="rating">
        {starElements}
      </div>

      {/* Botó enviar */}
      <button
        className="valorar-submit"
        disabled={rating === 0}
        onClick={handleSubmit}
      >
        Enviar valoració
      </button>
    </div>
  );
}
