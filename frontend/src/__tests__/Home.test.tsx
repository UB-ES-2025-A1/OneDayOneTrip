import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import Home from "../pages/Home";

describe("Home page", () => {
  it("muestra el título de la página y la lista de viajes", async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    // Verifica que aparece el nombre de la aplicación o título principal en Home
    expect(
        screen.getByRole("heading", { name: /OneDayOneTrip/i, level: 1 })
    ).toBeInTheDocument();
    // Dado que en setupTests definimos un viaje de prueba para la API, debería mostrarse en la lista
    // Esperamos a que aparezca el título del viaje de prueba en el documento
    const tripTitle = await screen.findByText(/Paris en 3 días/i);
    expect(tripTitle).toBeInTheDocument();
    // Se podría también comprobar que se renderiza correctamente algún elemento de la lista, 
    // por ejemplo que exista un enlace o card correspondiente al viaje
    expect(screen.getByRole("link", { name: /Paris en 3 días/i })).toBeInTheDocument();
  });
});
