import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

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
  } as any,
  backendUser: {
    uid: "u-1",
    nom_i_cognoms: "Backend User",
    url_foto_perfil: "avatar-back.png",
  },
};

const fillRequiredFormFields = async () => {
  const titleInputs = screen.getAllByLabelText(/^títol$/i);
  await userEvent.type(titleInputs[0], "Ruta QA");
  await userEvent.type(screen.getAllByLabelText(/descripció/i)[0], "Desc");
  await userEvent.type(screen.getByLabelText(/categoria/i), "Nature");
  await userEvent.type(screen.getByLabelText(/ciutat/i), "Barcelona");
  await userEvent.type(screen.getByLabelText(/país/i), "España");
  await userEvent.type(screen.getByLabelText(/distància/i), "10");
  await userEvent.type(screen.getByLabelText(/durada/i), "2h");
  await userEvent.type(screen.getByLabelText(/dificultat/i), "Easy");
  await userEvent.type(screen.getByLabelText(/temporada recomanada/i), "Spring");
  await userEvent.type(screen.getByLabelText(/tags/i), "aventura, costa");
  await userEvent.type(titleInputs[titleInputs.length - 1], "Punt 1");
  await userEvent.click(screen.getByTestId("map-selector"));
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

