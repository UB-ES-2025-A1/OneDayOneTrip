import "../styles/buttonNewTrip.css";
import { Plus } from "lucide-react";
import { useTranslation } from 'react-i18next'; // Importa el hook


interface Props {
  onClick: () => void;
}

export default function ButtonNewTrip({ onClick }: Props) {
  const { t } = useTranslation();
  return (
    <div className="masonry-item create-card" onClick={onClick}>
      <div className="create-card-content">
        <Plus size={48} className="create-icon animated-plus" />
        <p className="create-text">{t('profile_create_new_route')}</p>
      </div>
    </div>
  );
}
