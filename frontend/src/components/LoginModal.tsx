import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageCarousel from "../components/ImageCarousel";

interface LoginProps {
  onClose: () => void;
  openRegister: () => void;
}

export default function LoginModal({ onClose, openRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      alert("Login exitos!");
      navigate("/dashboard"); 
      onClose(); // Cerramos el modal al loguearse

    } catch (err: any) {
      setError("Error: " + err.message);
    }
  };

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
                "/images/bcn.png",
                "/images/madrid.jpg",
                "/images/paris.png",
                "/images/londres.png",
              ]}
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
            />

            <input
              type="password"
              placeholder="Contrasenya"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />

            <button type="submit" className="auth-button">
              Entrar
            </button>
          </form>

          {error && <p className="text-red-500 mt-4">{error}</p>}

          <p className="auth-footer">
            No tens compte?{" "}
            <button
              type="button"
              onClick={() => { onClose(); openRegister(); }}
              className="auth-link"
            >
              Registra't
            </button>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
