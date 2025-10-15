import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "../styles/Home.css";
import "../styles/LoginReg.css";
import AnimatedText1 from "../components/AnimatedText1";
import LoginModal from "../components/LoginModal";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("login") === "true") {
      setIsLoginOpen(true);
    }
  }, [location.search]);

  return (
    <div className="home">
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
        </div>
      </section>

    {isLoginOpen && (
        <LoginModal onClose={() => setIsLoginOpen(false)} />
      )}
    </div>
  );
}

