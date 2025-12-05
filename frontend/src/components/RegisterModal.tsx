import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../firebase/auth";
import ImageCarousel from "./ImageCarousel";

interface RegisterProps {
  onClose: () => void;
  openLogin: () => void;
}

export default function RegisterModal({ onClose, openLogin }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !fullName || !email || !password || !confirmPassword) {
      setError("Tots els camps són obligatoris");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les contrasenyes no coincideixen");
      return;
    }

    try {
      setLoading(true);
      await Auth.register(fullName, username, email, password);
      onClose();
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="register-card">
        <button className="close-btn-reg" onClick={onClose}>
          &times;
        </button>

        <div className="login-form">
          <h2 className="login-title">Registra't</h2>

          <form onSubmit={handleRegister} className="auth-form">
            {/* Nom d'usuari */}
            <div className="input-wrapper floating-input-group">
              <div className="input-icon">
                <img src="/images/person.png" alt="Usuari" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="auth-input floating-input"
                placeholder=" "
              />
              <label className="floating-label">Nom d'usuari</label>
            </div>

            {/* Nom complet */}
            <div className="input-wrapper floating-input-group">
              <div className="input-icon">
                <img src="/images/person.png" alt="Nom complet" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="auth-input floating-input"
                placeholder=" "
              />
              <label className="floating-label">Nom complet</label>
            </div>

            {/* Correu */}
            <div className="input-wrapper floating-input-group">
              <div className="input-icon">
                <img src="/images/ema.png" alt="Email" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input floating-input"
                placeholder=" "
              />
              <label className="floating-label">Correu electrònic</label>
            </div>

            {/* Contrasenya */}
            <div className="input-wrapper floating-input-group">
              <div className="input-icon">
                <img src="/images/lockk.png" alt="Contrasenya" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input floating-input"
                placeholder=" "
              />
              <label className="floating-label">Contrasenya</label>

              {password.length > 0 && (
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                </button>
              )}
            </div>

            {/* Confirmar contrasenya */}
            <div className="input-wrapper floating-input-group">
              <div className="input-icon">
                <img src="/images/lockk.png" alt="Confirmar contrasenya" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input floating-input"
                placeholder=" "
              />
              <label className="floating-label">Confirmar contrasenya</label>

              {confirmPassword.length > 0 && (
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                </button>
              )}

            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Creant compte..." : "Registrar-se"}
            </button>
          </form>

          {error && <p className="text-red-500 mt-4">{error}</p>}

          <p className="auth-footer">
            Ja tens un compte?{" "}
            <button
              type="button"
              onClick={() => { onClose(); openLogin(); }}
              className="auth-link"
            >
              Inicia sessió
            </button>
          </p>
        </div>

        <div className="login-gallery">
          <ImageCarousel
            images={[
              "/images/bcn.png",
              "/images/madrid.jpg",
              "/images/paris.png",
              "/images/londres.png",
            ]}
            interval={3000}
          />
        </div>
      </div>
    </div>
  );
}
