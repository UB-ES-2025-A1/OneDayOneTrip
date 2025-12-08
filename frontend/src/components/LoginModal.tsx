import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../firebase/auth";
import "../styles/LoginReg.css";
import ImageCarousel from "../components/ImageCarousel";
import "../styles/LoginReg.css";
import ResetPasswordModal from "./ResetPasswordModal";
import { useTranslation } from 'react-i18next'; // Importa el hook

interface LoginProps {
  onClose: () => void;
  openRegister: () => void;
}

export default function LoginModal({ onClose, openRegister }: LoginProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      // Autenticació amb Firebase
      const user = await Auth.login(email, password);
      console.log(t('loged_user') , user);

      onClose(); // Tanquem modal
      navigate("/"); // Redirigim al dashboard

    } catch (err: any) {
      console.error(t('login_error'), err);
      if (err.code === "auth/user-not-found") {
        setError(t('login_error_user_not_found'));
      } else if (err.code === "auth/wrong-password") {
        setError(t('login_error_wrong_password'));
      } else {
        setError(t('error') + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <ResetPasswordModal
        onClose={() => setShowResetPassword(false)}
        openLogin={() => setShowResetPassword(false)}
      />
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="login-card">
        <button className="close-btn-login" onClick={onClose}>
          &times;
        </button>

        <div className="login-content">
          <div className="login-gallery">
            <ImageCarousel
              images={[
                "images/bcn.png",
                "images/madrid.jpg",
                "images/paris.png",
                "images/londres.png",
              ]}
              interval={3000}
            />
          </div>

          <div className="login-form">
            <h2 className="login-title">{t('header_start_session')}</h2>
            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-wrapper floating-input-group">
                <div className="input-icon">
                  <img src="/images/person.png" alt={t('person')} />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input floating-input"
                  placeholder=" " // 👈 IMPORTANT: un espai perquè funcioni :placeholder-shown
                />
                <label className="floating-label">{t('login_email')}</label>
              </div>


            <div className="input-wrapper floating-input-group">
                <div className="input-icon">
                  <img src="/images/lockk.png" alt={t('login_password')} />
                </div>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input floating-input"
                  placeholder=" " // 👈 també aquí
                />
                <label className="floating-label">{t('login_password')}</label>
              </div>


              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? t('login_logging_in') : t('header_start_session')}
              </button>
            </form>

            {error && <p className="text-red-500 mt-4">{error}</p>}
            
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="auth-link"
              style={{ marginTop: "16px" }}
            >
                {t('login_forgot_password')}
            </button>

            <p className="auth-footer">
                {t('login_no_account')}{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openRegister();
                }}
                className="auth-link"
              >
                  {t('login_register_here')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}