import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "../firebase/auth";
import ImageCarousel from "../components/ImageCarousel";

interface LoginProps {
  onClose: () => void;
  openRegister: () => void;
}

export default function LoginModal({ onClose, openRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      // Autenticación con Firebase
      const user = await Auth.login(email, password);
      console.log("Usuario logueado:", user);

      alert("Login exitos! ");
      onClose(); // Cerramos modal
      navigate("/"); // Redirigimos al dashboard

    } catch (err: any) {
      console.error("Error en login:", err);
      if (err.code === "auth/user-not-found") {
        setError("No s'ha trobat cap compte amb aquest correu");
      } else if (err.code === "auth/wrong-password") {
        setError("Contrasenya incorrecta");
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

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "Iniciant sessió..." : "Entrar"}
              </button>
            </form>

            {error && <p className="text-red-500 mt-4">{error}</p>}

            <p className="auth-footer">
              No tens compte?{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openRegister();
                }}
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
