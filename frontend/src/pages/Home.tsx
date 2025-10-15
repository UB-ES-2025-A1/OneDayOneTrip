import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import "../styles/Home.css";
import "../styles/LoginReg.css";
import AnimatedText1 from "../components/AnimatedText1";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";

export default function Home() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState<"login" | "register" | null>(null);
  return (
    <div className="home">
      <header className="home-header">
        <h1 className="logo">OneDayOneTrip</h1>
        <div className="header-buttons">
          <button onClick={() => setModalOpen("login")} className="header-btn">
            Iniciar sessió
          </button>
          <button onClick={() => setModalOpen("register")} className="header-btn">
            Registrar-se
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <AnimatedText1 text="La teva pròxima aventura t'espera" className="animated-text"/>
        </div>
      </section>

      {modalOpen === "login" && (
        <LoginModal onClose={() => setModalOpen(null)} openRegister={() => setModalOpen("register")} />
      )}

      {modalOpen === "register" && (
        <RegisterModal onClose={() => setModalOpen(null)} openLogin={() => setModalOpen("login")} />
      )}
    </div>
  );
}

