import type { FC } from "react";
import { X } from "lucide-react";
import "../styles/ConfirmModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username?: string;
};

const ConfirmUnblockModal: FC<Props> = ({ open, onClose, onConfirm, username }) => {
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

        <h3>Desbloquejar a {username || "l'usuari"}?</h3>

        <p>Què passa quan desbloqueges a aquest usuari:</p>
        <ul>
          <li>Podrà veure el teu perfil i les teves publicacions.</li>
          <li>Podrà enviar-te sol·licitud de seguiment.</li>
          <li>Podràs veure les seves publicacions i comentaris.</li>
          <li>Podràs bloquejar-lo de nou en qualsevol moment.</li>
        </ul>

        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel·lar
          </button>
          <button className="btn btn-confirm-unblock" onClick={onConfirm}>
            Desbloquejar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmUnblockModal;
