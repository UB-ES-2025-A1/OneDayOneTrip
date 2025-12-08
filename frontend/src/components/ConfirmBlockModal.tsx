import type { FC } from "react";
import { X } from "lucide-react";
import "../styles/ConfirmModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username?: string;
};

const ConfirmBlockModal: FC<Props> = ({ open, onClose, onConfirm, username }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Tancar modal"
        >
          <X size={20} />
        </button>

        <h3>Bloquejar a {username || "usuari"}?</h3>

        <p>Què passa quan bloqueges a aquest usuari:</p>
        <ul>
          <li>No podrà veure el teu perfil ni les teves publicacions.</li>
          <li>No podrà enviar-te sol·licitud de seguiment.</li>
          <li>No veuràs les seves publicacions ni comentaris.</li>
          <li>Podràs desbloquejar-lo en qualsevol moment.</li>
        </ul>

        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel·lar
          </button>
          <button className="btn btn-confirm" onClick={onConfirm}>
            Bloquejar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBlockModal;
