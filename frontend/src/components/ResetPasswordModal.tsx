import { useState } from "react";
import { Auth } from "../firebase/auth";
import { useTranslation } from 'react-i18next'; // Importa el hook

interface ResetPasswordProps {
  onClose: () => void;
  openLogin: () => void;
}

export default function ResetPasswordModal({ onClose, openLogin }: ResetPasswordProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError(t('reset_password_error_enter_email'));
      return;
    }

    try {
      setError("");
      setMessage("");
      setLoading(true);

      
      await Auth.resetPassword(email); 
      setMessage(t('reset_password_sent_message'));
    } catch (err: any) {
      console.error(t('error_reset_password'), err);
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
          <h2 className="login-title">{t('reset_password_title')}</h2>
          <p className="reset-password-description">
              {t('reset_password_description')}
          </p>
          
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="input-wrapper">
              <div className="input-icon">
                <img src="/images/person.png" alt={t('correu')} />
              </div>
              <input
                type="email"
                placeholder={t('login_email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? t('general_sending') : t('reset_password_send_link')}
            </button>
          </form>

          {error && <p className="text-red-500 mt-2 mb-4">{error}</p>}
          {message && <p className="text-green-600 mt-2 mb-4">{message}</p>}

          <button
            type="button"
            onClick={() => openLogin()}
            className="auth-link"
            style={{ marginTop: "16px" }}
          >
              {t('reset_password_back_to_login')}
          </button>
        </div>
      </div>
    </div>
  );
}
