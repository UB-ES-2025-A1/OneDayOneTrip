import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* Header */}
      <header className="home-header">
        <h1 className="logo">OneDayOneTrip</h1>
        <div className="header-buttons">
          <button onClick={() => navigate("/login")} className="header-btn">
            Iniciar sesión
          </button>
          <button onClick={() => navigate("/register")} className="header-btn">
            Registrarse
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h2 className="hero-title">La teva pròxima aventura t'espera</h2>
          <p className="hero-text">
            Troba l'experiència perfecta per a tu
          </p>
        </div>
      </section>

    </div>
  );
}
