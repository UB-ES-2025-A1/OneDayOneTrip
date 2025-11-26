import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import MasonryGrid from "../components/MasonryGrid";
import type { User } from "firebase/auth";

// Mock de gsap
vi.mock("gsap", async () => {
  const actual = await vi.importActual<typeof import("gsap")>("gsap");
  return {
    ...actual,
    default: {
      ...actual.default,
      utils: {
        ...actual.default.utils,
        toArray: vi.fn(() => []),
      },
      fromTo: vi.fn(),
    },
  };
});

// Mock de ButtonNewTrip
vi.mock("../components/ButtonNewTrip", () => ({
  __esModule: true,
  default: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="button-new-trip" onClick={onClick}>
      New Trip
    </button>
  ),
}));

describe("MasonryGrid", () => {
  const mockOpenRegister = vi.fn();
  const mockOnCreateTripClick = vi.fn();
  const mockUser: User = {
    uid: "user-123",
  } as User;

  const mockItems = [
    {
      id: "1",
      img: "image1.jpg",
      title: "Trip 1",
      user: "User 1",
      rating: 4.5,
      temps: "2 días",
      dificultat: "Fàcil",
      authorPic: "author1.jpg",
      city: "Barcelona",
      country: "España",
    },
    {
      id: "2",
      img: "image2.jpg",
      title: "Trip 2",
      user: "User 2",
      rating: 5,
      temps: "3 días",
      dificultat: "Mitjà",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza la lista de items", () => {
    render(
      <MemoryRouter>
        <MasonryGrid
          items={mockItems}
          openRegister={mockOpenRegister}
          currentUser={null}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Trip 1")).toBeInTheDocument();
    expect(screen.getByText("Trip 2")).toBeInTheDocument();
  });

  it("renderiza lista vacía cuando no hay items", () => {
    const { container } = render(
      <MemoryRouter>
        <MasonryGrid
          items={[]}
          openRegister={mockOpenRegister}
          currentUser={null}
        />
      </MemoryRouter>
    );

    expect(container.querySelector(".masonry-container")).toBeInTheDocument();
  });

  it("muestra información de cada item", () => {
    render(
      <MemoryRouter>
        <MasonryGrid
          items={mockItems}
          openRegister={mockOpenRegister}
          currentUser={null}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Trip 1")).toBeInTheDocument();
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText(/2 días/i)).toBeInTheDocument();
    expect(screen.getByText("Fàcil")).toBeInTheDocument();
  });

  it("muestra botón de crear trip cuando showCreateButton es true y hay usuario", () => {
    render(
      <MemoryRouter>
        <MasonryGrid
          items={mockItems}
          openRegister={mockOpenRegister}
          currentUser={mockUser}
          showCreateButton={true}
          onCreateTripClick={mockOnCreateTripClick}
        />
      </MemoryRouter>
    );

    const createButton = screen.getByTestId("button-new-trip");
    expect(createButton).toBeInTheDocument();
  });

  it("no muestra botón de crear trip cuando showCreateButton es false", () => {
    render(
      <MemoryRouter>
        <MasonryGrid
          items={mockItems}
          openRegister={mockOpenRegister}
          currentUser={mockUser}
          showCreateButton={false}
        />
      </MemoryRouter>
    );

    const createButton = screen.queryByTestId("button-new-trip");
    expect(createButton).not.toBeInTheDocument();
  });

  it("llama a onCreateTripClick cuando se hace clic en el botón de crear trip", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MasonryGrid
          items={mockItems}
          openRegister={mockOpenRegister}
          currentUser={mockUser}
          showCreateButton={true}
          onCreateTripClick={mockOnCreateTripClick}
        />
      </MemoryRouter>
    );

    const createButton = screen.getByTestId("button-new-trip");
    await user.click(createButton);

    expect(mockOnCreateTripClick).toHaveBeenCalledTimes(1);
  });

  it("llama a openRegister cuando no hay usuario y se hace clic en un item", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MasonryGrid
          items={mockItems}
          openRegister={mockOpenRegister}
          currentUser={null}
        />
      </MemoryRouter>
    );

    // Buscar el primer item (masonry-item) y hacer clic
    const firstItem = screen.getByText("Trip 1").closest(".masonry-item");
    if (firstItem) {
      await user.click(firstItem);
      expect(mockOpenRegister).toHaveBeenCalledTimes(1);
    }
  });

  it("muestra imagen de autor cuando está disponible", () => {
    render(
      <MemoryRouter>
        <MasonryGrid
          items={mockItems}
          openRegister={mockOpenRegister}
          currentUser={null}
        />
      </MemoryRouter>
    );

    const authorImages = screen.getAllByAltText("User 1");
    expect(authorImages.length).toBeGreaterThan(0);
  });

  it("muestra ciudad y país cuando están disponibles", () => {
    render(
      <MemoryRouter>
        <MasonryGrid
          items={mockItems}
          openRegister={mockOpenRegister}
          currentUser={null}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Barcelona/i)).toBeInTheDocument();
    expect(screen.getByText(/España/i)).toBeInTheDocument();
  });
});

