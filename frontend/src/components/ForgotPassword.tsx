import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/LoginReg.css";

interface ForgotPasswordProps {
  onClose: () => void;
}

export default function ForgotPassword({ onClose }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setMessage("T'hem enviat un correu per restablir la contrasenya.");
    } catch (err: any) {
      console.error("Error en reset:", err);
      if (err.code === "auth/user-not-found") {
        setError("No hi ha cap compte amb aquest correu.");
      } else {
        setError("Error: " + err.message);
      }
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
          <h2 className="login-title">Restablir contrasenya</h2>
          <p className="text-sm text-gray-500 mb-4">
            Introdueix el teu correu electrònic i t’enviarem un enllaç per restablir la contrasenya.
          </p>

          <form onSubmit={handleReset} className="auth-form">
            <input
              type="email"
              placeholder="Correu electrònic"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Enviant..." : "Enviar correu"}
            </button>
          </form>

          {message && <p className="success-text mt-4">{message}</p>}
          {error && <p className="error-text mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
}
