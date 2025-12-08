// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./i18n/i18n";

import "./styles/styles.css";
import "leaflet/dist/leaflet.css";


// Pàgines
import Home from "./pages/Home";
import RutaDetall from "./pages/RutaDetall";
import UserProfile from "./pages/UserProfile";
import UserProfilePublic from "./pages/UserProfilePublic";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Página principal */}
        <Route path="/" element={<Home />} />

        {/* Detalls de ruta */}
        <Route path="/ruta/:id" element={<RutaDetall />} />

        {/* Perfil */}
        <Route path="/perfil" element={<UserProfile />} />

        {/* Redirecció per rutes no vàlides */}
        <Route path="*" element={<Navigate to="/" replace />} />

        {/* Perfil d'altre usuari */}
        <Route path="/user/:id" element={<UserProfilePublic />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);