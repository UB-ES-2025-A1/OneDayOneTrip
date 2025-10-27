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

      // Registramos al usuario con Firebase Auth + Firestore
      await Auth.register(fullName, username, email, password);

      alert("Usuari registrat correctament");

      onClose();
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    visible ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.959 9.959 0 012.478-3.446M6.223 6.223A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.953 9.953 0 01-1.68 2.942M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
      </svg>
    )
  );

  return (
    <div className="modal-backdrop">
      <div className="register-card">
        <button className="close-btn-reg" onClick={onClose}>
          &times;
        </button>

        <div className="login-form">
          <h2 className="login-title">Registra't</h2>

          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-wrapper">
              <div className="input-icon">
                <img src="/images/person.png" alt="Usuari" />
              </div>
              <input
                type="text"
                placeholder="Nom d'usuari"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="auth-input pr-10"
              />
            </div>

            <div className="input-wrapper">
              <div className="input-icon">
                <img src="/images/person.png" alt="Nom complet" />
              </div>
              <input
                type="text"
                placeholder="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="auth-input pr-10"
              />
            </div>

            <div className="input-wrapper">
              <div className="input-icon">
                <img src="/images/ema.png" alt="Email" />
              </div>
              <input
                type="email"
                placeholder="Correu electrònic"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input pr-10"
              />
            </div>

            <div className="relative input-wrapper">
              <div className="input-icon">
                <img src="/images/lockk.png" alt="Contrasenya" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contrasenya"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center"
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>

            <div className="relative input-wrapper">
              <div className="input-icon">
                <img src="/images/lockk.png" alt="Confirmar contrasenya" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmar contrasenya"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-3 flex items-center"
              >
                <EyeIcon visible={showConfirmPassword} />
              </button>
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
