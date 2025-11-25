import "../styles/buttonNewTrip.css";
import { Plus } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function ButtonNewTrip({ onClick }: Props) {
  return (
    <div className="masonry-item create-card" onClick={onClick}>
      <div className="create-card-content">
        <Plus size={48} className="create-icon animated-plus" />
        <p className="create-text">Afegeix Nova Ruta</p>
      </div>
    </div>
  );
}
