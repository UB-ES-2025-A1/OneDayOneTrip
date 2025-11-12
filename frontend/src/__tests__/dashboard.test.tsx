import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
const dummyTrips = [
  { id: "trip-1", title: "Paris en 3 días", description: "demo" },
];

beforeEach(() => {
  // Mock global fetch para devolver trips cuando el componente la llame
  global.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
    // Si tu componente llama a '/trips' o incluye 'trips' en la url, devolvemos dummyTrips
    if (String(url).includes("trips")) {
      return Promise.resolve({
        ok: true,
        json: async () => dummyTrips,
      } as Response);
    }
    // Sin datos (para el test que espera "no tienes viajes")
    if (String(url).includes("empty-trips")) {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    }

    // Por defecto
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    } as Response);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Dashboard page", () => {
  it("muestra el encabezado del dashboard, la lista de viajes del usuario y la opción de crear viaje", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    // Verificar que aparece el título "Dashboard" o equivalente
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    // Gracias al MSW, la petición de viajes devuelve un viaje de prueba (como si fuera del usuario)
    const tripTitle = await screen.findByText(/Paris en 3 días/i);
    expect(tripTitle).toBeInTheDocument();
    // Verificar que existe la opción para crear un nuevo viaje (botón o enlace)
    // Suponemos que hay un botón "Crear viaje" visible en el Dashboard
    expect(screen.getByRole("button", { name: /crear viaje/i })).toBeInTheDocument();
  });

  it("muestra un mensaje apropiado si no hay viajes del usuario", async () => {
    // Sobrescribimos el handler de MSW para que GET /trips devuelva lista vacía en este test
    (globalThis as any).mswServer.use(
      (globalThis as any).mswRest.get("*/trips", (req, res, ctx) => {
        return res(ctx.json([]));
      })
    );
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    (global.fetch as unknown as vi.Mock).mockImplementation((url: RequestInfo | URL) => {
    if (String(url).includes("trips")) {
        return Promise.resolve({
        ok: true,
        json: async () => [],
        } as Response);
    }
    return Promise.resolve({
        ok: true,
        json: async () => ({}),
    } as Response);
    });

    // ...render y luego:
    const noTripsMsg = await screen.findByText(/no tienes viajes/i);
    expect(noTripsMsg).toBeInTheDocument();
    const noTripsMsg = await screen.findByText(/no tienes viajes/i);
    expect(noTripsMsg).toBeInTheDocument();
    // Y la opción de crear un viaje debería seguir visible para invitar al usuario a crear uno
    expect(screen.getByRole("button", { name: /crear viaje/i })).toBeInTheDocument();
  });
});
