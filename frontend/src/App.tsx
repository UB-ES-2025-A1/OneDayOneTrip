// src/App.tsx
import { Link } from "react-router-dom";

export default function App() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Bienvenido a OneDayOneTrip 🚀</h1>
      <p>Selecciona una opción:</p>
      <nav style={{ marginTop: "1rem" }}>
        <Link to="/login" style={{ marginRight: "1rem" }}>
          Iniciar sesión
        </Link>
        <Link to="/register">Registrarse</Link>
      </nav>
    </div>
  );
}
