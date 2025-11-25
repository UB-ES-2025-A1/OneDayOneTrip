import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { act } from "@testing-library/react";

vi.mock("leaflet/dist/leaflet.css", () => ({}));

vi.mock("../components/MapSelector", () => ({
  __esModule: true,
  default: ({ onSelect }: { onSelect: (lat: number, lng: number) => void }) => (
    <button
      type="button"
      data-testid="map-selector"
      onClick={() => onSelect(41.3, 2.1)}
    >
      map
    </button>
  ),
}));

const { mockCreateTripMultipart } = vi.hoisted(() => ({
  mockCreateTripMultipart: vi.fn(),
}));

vi.mock("../api/trips", async () => {
  const actual = await vi.importActual("../api/trips");
  return {
    ...actual,
    createTripMultipart: mockCreateTripMultipart,
  };
});

import CreateTripForm from "../components/CreateTripForm";

const baseProps = {
  onClose: vi.fn(),
  currentUser: {
    displayName: "Frontend User",
    email: "front@example.com",
    photoURL: "avatar.png",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  backendUser: {
    uid: "u-1",
    nom_i_cognoms: "Backend User",
    url_foto_perfil: "avatar-back.png",
  },
};

const fillRequiredFormFields = async () => {
  // Esperar a que el formulario se renderice completamente
  // Hay múltiples campos con label "Títol", usar getAllByLabelText
  await waitFor(() => {
    const titleInputs = screen.queryAllByLabelText(/Títol/i);
    expect(titleInputs.length).toBeGreaterThan(0);
  });
  
  // Paso 1: Llenar campos básicos que siempre están visibles
  // El primer "Títol" es el del trip principal
  const titleInputs = screen.getAllByLabelText(/Títol/i);
  await act(async () => {
    await userEvent.type(titleInputs[0], "Ruta QA");
    
    // Descripció también puede tener múltiples, usar el primero (del trip principal)
    const descInputs = screen.getAllByLabelText(/Descripció/i);
    await userEvent.type(descInputs[0], "Desc");
    
    await userEvent.type(screen.getByLabelText(/Categoria/i), "Nature");
    await userEvent.type(screen.getByLabelText(/Tags/i), "aventura, costa");
  });
  
  // Paso 2: Llenar campos de ubicación y datos
  await act(async () => {
    await userEvent.type(screen.getByLabelText(/Ciutat/i), "Barcelona");
    await userEvent.type(screen.getByLabelText(/País/i), "España");
    await userEvent.type(screen.getByLabelText(/Distància/i), "10");
    await userEvent.type(screen.getByLabelText(/Durada/i), "2h");
    await userEvent.type(screen.getByLabelText(/Dificultat/i), "Easy");
    await userEvent.type(screen.getByLabelText(/Temporada recomanada/i), "Spring");
  });
  
  // Paso 3: Llenar punto de ruta (el segundo input con label "Títol")
  if (titleInputs.length > 1) {
    await act(async () => {
      await userEvent.type(titleInputs[1], "Punt 1");
      await userEvent.click(screen.getByTestId("map-selector"));
    });
  }
};

describe("CreateTripForm", () => {
  beforeEach(() => {
    mockCreateTripMultipart.mockReset();
  });

  it("envía los datos mínimos y muestra mensaje de éxito", async () => {
    mockCreateTripMultipart.mockResolvedValue({ trip_id: "trip-123" });

    render(<CreateTripForm {...baseProps} />);

    await fillRequiredFormFields();

    await userEvent.click(screen.getByRole("button", { name: /crear ruta/i }));

    await waitFor(() => {
      expect(mockCreateTripMultipart).toHaveBeenCalledTimes(1);
    });

    const payload = mockCreateTripMultipart.mock.calls[0][0];
    expect(payload.title).toBe("Ruta QA");
    expect(payload.tags).toEqual(["aventura", "costa"]);
    expect(payload.trip_points[0].coordinates.lat).toBe(41.3);
    expect(payload.author.uid).toBe("u-1");

    expect(await screen.findByText(/Ruta creada correctament/i)).toBeInTheDocument();
  });

  it("muestra mensaje de error cuando la API falla", async () => {
    mockCreateTripMultipart.mockRejectedValue(new Error("falló"));

    render(<CreateTripForm {...baseProps} />);

    await fillRequiredFormFields();
    await userEvent.click(screen.getByRole("button", { name: /crear ruta/i }));

    await waitFor(() => {
      expect(mockCreateTripMultipart).toHaveBeenCalled();
    });

    expect(await screen.findByText(/falló/i)).toBeInTheDocument();
  });
});

