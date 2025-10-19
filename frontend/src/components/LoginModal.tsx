import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageCarousel from "../components/ImageCarousel";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

interface LoginProps {
  onClose: () => void;
  openRegister: () => void;
}

export default function LoginModal({ onClose, openRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // <-- AQUÍ se declara
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true); // <-- Ya existe en este alcance
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const map: Record<string, string> = {
        "auth/invalid-email": "El correu no és vàlid.",
        "auth/user-not-found": "No existeix cap compte amb aquest correu.",
        "auth/wrong-password": "Contrasenya incorrecta.",
        "auth/too-many-requests": "Massa intents. Prova-ho més tard.",
      };
      setError(map[err?.code] ?? "No s'ha pogut iniciar la sessió.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="login-card">
        <button className="close-btn-login" onClick={onClose}>&times;</button>

        <div className="login-content">
          <div className="login-gallery">
            <ImageCarousel
              images={["/images/bcn.png","/images/madrid.jpg","/images/paris.png","/images/londres.png"]}
              interval={3000}
            />
          </div>

          <div className="login-form">
            <h2 className="login-title">Iniciar sessió</h2>

            <form onSubmit={handleLogin} className="auth-form">
              <input
                type="email"
                placeholder="Correu electrònic"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Contrasenya"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
                autoComplete="current-password"
              />
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Entrant…" : "Entrar"}
              </button>
            </form>

            {error && <p className="text-red-500 mt-4">{error}</p>}

            <p className="auth-footer">
              No tens compte?{" "}
              <button type="button" onClick={() => { onClose(); openRegister(); }} className="auth-link">
                Registra't
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
