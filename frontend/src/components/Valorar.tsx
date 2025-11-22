import { useState } from "react";

interface ValorarProps {
  tripId: string;
  onClose: () => void;
}

export default function Valorar({ tripId, onClose }: ValorarProps) {
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);

  const handleSubmit = () => {
    // PURAMENT FRONTEND: només un missatge
    alert(`Has valorat la ruta ${tripId} amb ${rating} estrelles ✨`);
    onClose();
  };

  return (
    <div>
      <button className="valorar-close" onClick={onClose}>
        ✕
      </button>

      <h2 className="valorar-title">Valora aquesta ruta</h2>

      <div className="valorar-estrelles">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`valorar-estrella ${
              n <= (hover || rating) ? "active" : ""
            }`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          >
            ★
          </span>
        ))}
      </div>

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
