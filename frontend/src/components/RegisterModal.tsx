import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../firebase/auth";
import ImageCarousel from "./ImageCarousel";
import { useTranslation } from 'react-i18next'; // Importa el hook

interface RegisterProps {
  onClose: () => void;
  openLogin: () => void;
}

export default function RegisterModal({ onClose, openLogin }: RegisterProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false); // false = públic per defecte

  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !fullName || !email || !password || !confirmPassword) {
      setError(t('register_error_all_fields_required'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register_error_passwords_match'));
      return;
    }

    try {
      setLoading(true);
      await Auth.register(fullName, username, email, password, isPrivate);
      onClose();
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" data-testid="register-modal">
      <div className="register-card">
        <button className="close-btn-reg" data-testid="close-modal" onClick={onClose}>
          &times;
        </button>

        <div className="login-form">
          <h2 className="login-title">{t('login_register_here')}</h2>

          <form onSubmit={handleRegister} className="auth-form">
            {/* Nom d'usuari */}
            <div className="input-wrapper floating-input-group">
              <div className="input-icon">
                <img src="/images/person.png" alt={t('general_user')} />
              </div>
              <input
                data-testid="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="auth-input floating-input"
                placeholder=" "
              />
              <label className="floating-label">{t('register_username')}</label>
            </div>

            {/* Nom complet */}
            <div className="input-wrapper floating-input-group">
              <div className="input-icon">
                <img src="/images/person.png" alt={t('register_full_name')} />
              </div>
              <input
                data-testid="full-name-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="auth-input floating-input"
                placeholder=" "
              />
              <label className="floating-label">{t('register_full_name')}</label>
            </div>

            {/* Correu */}
            <div className="input-wrapper floating-input-group">
              <div className="input-icon">
                <img src="/images/ema.png" alt={t('email')} />
              </div>
              <input
                data-testid="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input floating-input"
                placeholder=" "
              />
              <label className="floating-label">{t('login_email')}</label>
            </div>

            {/* Contrasenya */}
            <div className="input-wrapper floating-input-group">
              <div className="input-icon">
                <img src="/images/lockk.png" alt={t('login_password')} />
              </div>
              <input
                data-testid="password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input floating-input"
                placeholder=" "
              />
              <label className="floating-label">{t('login_password')}</label>

              {password.length > 0 && (
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                  {/* aquí l'icona de l'ull si la tens */}
                </button>
              )}
            </div>

            {/* Confirmar contrasenya */}
            <div className="input-wrapper floating-input-group">
              <div className="input-icon">
                <img src="/images/lockk.png" alt={t('register_confirm_password')} />
              </div>
              <input
                data-testid="confirm-password-input"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input floating-input"
                placeholder=" "
              />
              <label className="floating-label">{t('register_confirm_password')}</label>

              {confirmPassword.length > 0 && (
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                  {/* icona */}
                </button>
              )}
            </div>

            {/* 🔐 Privacitat del perfil */}
            <div className="privacy-section">

              <div className="privacy-options">
                <label className="privacy-option">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={!isPrivate}
                    onChange={() => setIsPrivate(false)}
                  />
                  <span>Perfil públic</span>
                </label>

                <label className="privacy-option">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(true)}
                  />
                  <span>Perfil privat</span>
                </label>
              </div>
            </div>

            <button data-testid="submit-btn" type="submit" className="auth-button" disabled={loading}>
              {loading ? t('register_creating_account') : t('header_register')}
            </button>
          </form>

          {error && <p className="text-red-500 mt-4">{error}</p>}

          <p className="auth-footer">
              {t('register_has_account')}{" "}
            <button
              type="button"
              onClick={() => {
                onClose();
                openLogin();
              }}
              className="auth-link"
            >
                {t('register_login_here')}
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
