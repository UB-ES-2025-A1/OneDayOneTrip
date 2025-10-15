import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import "../styles/LoginReg.css";
import AnimatedText1 from "../components/AnimatedText1";
import LoginModal from "../components/LoginModal";

export default function Home() {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="home">
      {/* Header */}
      <header className="home-header">
        <h1 className="logo">OneDayOneTrip</h1>
        <div className="header-buttons">
          <button onClick={() => setIsLoginOpen(true)} 
          className="header-btn">
            Iniciar sessió
          </button>
          <button onClick={() => navigate("/register")} className="header-btn">
            Registrar-se
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <AnimatedText1 text="La teva pròxima aventura t'espera" className="animated-text"/>
          <p className="hero-text">
            Troba l'experiència perfecta per a tu
          </p>
        </div>
      </section>

    {isLoginOpen && (
        <LoginModal onClose={() => setIsLoginOpen(false)}        />
      )}
    </div>
  );
}

