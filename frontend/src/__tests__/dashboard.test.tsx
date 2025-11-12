// src/__tests__/Dashboard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import Dashboard from "../pages/Dashboard";

describe("Dashboard page", () => {
  it("muestra el encabezado y el botón de cerrar sesión", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Bienvenido al Dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  // Añade tests de lista de viajes cuando esa UI esté implementada.
});