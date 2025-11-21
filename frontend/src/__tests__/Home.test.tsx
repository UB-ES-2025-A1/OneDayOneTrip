// src/__tests__/Home.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import Home from "../pages/Home";

describe("Home page", () => {
  it("muestra el título, el hero y el mensaje sin rutas", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /OneDayOneTrip/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/La teva propera aventura t'espera/i)).toBeInTheDocument();
  });
});