// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./styles/styles.css";
import "leaflet/dist/leaflet.css";


// Páginas
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

        {/* Detalle de ruta */}
        <Route path="/ruta/:id" element={<RutaDetall />} />

        {/* Perfil */}
        <Route path="/perfil" element={<UserProfile />} />

        {/* Redirección para rutas no válidas */}
        <Route path="*" element={<Navigate to="/" replace />} />

        {/* Perfil de otro usuario */}  
        <Route path="/user/:id" element={<UserProfilePublic />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);