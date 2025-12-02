import type { FC } from "react";
import { X } from "lucide-react";

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
        <p>Si bloqueges a aquest usuari deixaràs de seguir-lo i 
            l'usuari tampoc podrà seguir-te ni veure les teves publicacions. </p>
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
