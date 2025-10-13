import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      // Aquí puedes usar Firebase auth
      alert("Login exitos!");
      navigate("/dashboard");
    } catch (err: any) {
      setError("Error: " + err.message);
    }
  };

  return (
    <AuthLayout title="Iniciar sessió">
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
        <a href="/register" className="auth-link">
          Registra't
        </a>
      </p>
    </AuthLayout>
  );
}
