import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const { mockGetTripComments, mockCreateTripComment } = vi.hoisted(() => ({
  mockGetTripComments: vi.fn(),
  mockCreateTripComment: vi.fn(),
}));

vi.mock("../api/trips", async () => {
  const actual = await vi.importActual("../api/trips");
  return {
    ...actual,
    getTripComments: mockGetTripComments,
    createTripComment: mockCreateTripComment,
  };
});

import Comments from "../components/Comments";

const currentUser = { uid: "auth-1" };
const backendUser = {
  uid: "backend-1",
  nom_i_cognoms: "QA Tester",
  url_foto_perfil: "/img.png",
};

describe("Comments component", () => {
  beforeEach(() => {
    mockGetTripComments.mockReset();
    mockCreateTripComment.mockReset();
    mockGetTripComments.mockResolvedValue([]);
    mockCreateTripComment.mockResolvedValue({
      _id: "c3",
      tripId: "t1",
      userName: "QA Tester",
      text: "Nou comentari",
      createdAt: new Date().toISOString(),
    });
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("carga y muestra los comentarios ordenados", async () => {
    mockGetTripComments.mockResolvedValue([
      {
        _id: "c1",
        tripId: "t1",
        userName: "A",
        text: "Primer",
        createdAt: "2024-01-01T10:00:00Z",
      },
      {
        _id: "c2",
        tripId: "t1",
        userName: "B",
        text: "Segon",
        createdAt: "2024-02-01T10:00:00Z",
      },
    ]);

    render(<Comments tripId="t1" currentUser={currentUser} backendUser={backendUser} />);

    await waitFor(() => expect(mockGetTripComments).toHaveBeenCalledWith("t1"));

    const items = await screen.findAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Segon");
    expect(items[1]).toHaveTextContent("Primer");
  });

  it("envía un comentario y limpia el textarea", async () => {
    render(<Comments tripId="t1" currentUser={currentUser} backendUser={backendUser} />);

    // El mock de i18n devuelve las claves de traducción
    const textarea = await screen.findByPlaceholderText(/comments_add_placeholder/i);
    await userEvent.type(textarea, "   Hola món   ");
    await userEvent.click(screen.getByRole("button", { name: /general_send/i }));

    await waitFor(() => {
      expect(mockCreateTripComment).toHaveBeenCalledWith(
        "t1",
        expect.objectContaining({
          userId: "backend-1",
          userName: "QA Tester",
          text: "Hola món",
        })
      );
    });

    expect(textarea).toHaveValue("");
    expect(screen.getByText(/Nou comentari/)).toBeInTheDocument();
  });
});
