// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./styles/styles.css";
import "leaflet/dist/leaflet.css";


// 🏠 Páginas
import Home from "./pages/Home";
import RutaDetall from "./pages/RutaDetall";
import UserProfile from "./pages/UserProfile";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/ruta/:id" element={<RutaDetall />} />

        <Route path="/perfil" element={<UserProfile />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);