import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RutaDetall from "./pages/RutaDetall";

import './styles/styles.css';

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/ruta/:id" element={<RutaDetall />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
