import { useState } from "react";
import { Auth } from "../firebase/auth";

interface ResetPasswordProps {
  onClose: () => void;
  openLogin: () => void;
}

export default function ResetPasswordModal({ onClose, openLogin }: ResetPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Introdueix el teu correu electrònic.");
      return;
    }

    try {
      setError("");
      setMessage("");
      setLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simula temps de càrrega
      
      //await Auth.resetPassword(email); // La funció encara no està implementada (separant funcionalitats en branques i tal)
      setMessage("S'ha enviat un correu amb l'enllaç de recuperació.");
    } catch (err: any) {
      console.error("Error al recuperar contrasenya:", err);
      setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="login-card">
        <button className="close-btn-login" onClick={onClose}>
          &times;
        </button>

        <div className="login-form">
          <h2 className="login-title">Recuperar contrasenya</h2>
          <p className="reset-password-description">
            Introdueix el teu correu electrònic i t'enviarem un enllaç per restablir la contrasenya.
          </p>
          
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="input-wrapper">
              <div className="input-icon">
                <img src="/images/person.png" alt="Correu" />
              </div>
              <input
                type="email"
                placeholder="Correu electrònic"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Enviant..." : "Enviar enllaç de recuperació"}
            </button>
          </form>

          {error && <p className="text-red-500 mt-2 mb-4">{error}</p>}

          <button
            type="button"
            onClick={() => openLogin()}
            className="auth-link"
            style={{ marginTop: "16px" }}
          >
            Tornar al login
          </button>
        </div>
      </div>
    </div>
  );
}
