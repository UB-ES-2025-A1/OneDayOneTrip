import "../styles/Valorar.css";
import { useState, type JSX } from "react";
import { useTranslation } from 'react-i18next'; // Importa el hook

interface ValorarProps {
  tripId: string;
  onClose: () => void;
  onSubmit: (rating: number) => void;   // Nueva prop
}

export default function Valorar({ onClose, onSubmit }: ValorarProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    onSubmit(rating); 
    onClose();     
  };

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
      <label key={`label-${n}`} htmlFor={`estrella-${n}`} />
    );
  }

  return (
    <div className="valorar-container">
      <div className="valorar-header">
        <h2 className="valorar-title">{t('rate_modal_title')}</h2>
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
          {t('rate_modal_submit')}
      </button>
    </div>
  );
}
