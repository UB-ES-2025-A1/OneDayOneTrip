import type { FC } from "react";
import { X } from "lucide-react";

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
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <h3>Desbloquejar {username || "l'usuari"}?</h3>
        <p>
          Si desbloqueges aquest usuari:
          <ul>
            <li>Tornarà a poder veure les teves publicacions</li>
            <li>Pots bloquejar-lo de nou quan vulguis</li>
          </ul>
        </p>
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
