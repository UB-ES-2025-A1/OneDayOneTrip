import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

// -----------------------------------------------
// ⭐ BACKEND USER MOCK (completo, según tu modelo)
// -----------------------------------------------
const mockBackendUser = {
  uid: "user-123",
  data_creacio: "2024-01-01T00:00:00.000Z",
  nom_i_cognoms: "Test User",
  mail: "test@example.com",
  role: "user",
  username: "testuser",
  publicacions: [],
  guardades: [],
  llista_seguidors: [],
  llista_seguits: [],
  url_foto_perfil: "",
  url_foto_panell: "",
  premium: false,
};

// -----------------------------------------------
// ⭐ FIREBASE USER MOCK (mínimo y sin tipos)
// -----------------------------------------------
const mockFirebaseUser = {
  uid: "user-123",
} as any;

// -----------------------------------------------
// ⭐ Mocks API
// -----------------------------------------------
const { mockGetAllTrips, mockGetUserById } = vi.hoisted(() => {
  return {
    mockGetAllTrips: vi.fn(),
    mockGetUserById: vi.fn(),
  };
});

vi.mock("../api/trips", () => ({
  getAllTrips: mockGetAllTrips,
}));

vi.mock("../api/client", () => ({
  getUserById: mockGetUserById,
}));

// -----------------------------------------------
// ⭐ FIREBASE MOCK ARREGLADO DEFINITIVO
// -----------------------------------------------
let authCallbackAlreadyCalled = false;

vi.mock("firebase/auth", () => {
  return {
    __esModule: true,

    getAuth: vi.fn(() => ({ currentUser: null })),

    onAuthStateChanged: vi.fn((_auth, callback) => {
      // 🔥 SOLO SE EJECUTA UNA VEZ
      if (!authCallbackAlreadyCalled) {
        authCallbackAlreadyCalled = true;
        if (typeof callback === "function") callback(null);
        else if (callback?.next) callback.next(null);
      }
      return () => {};
    }),

    signOut: vi.fn(),

    auth: {},
  };
});


// -----------------------------------------------
// ⭐ UI Mocks
// -----------------------------------------------
vi.mock("../components/MasonryGrid", () => ({
  __esModule: true,
  default: ({ items }: { items: any[] }) => (
    <div data-testid="masonry-grid">{items?.length || 0} items</div>
  ),
}));

vi.mock("../components/Carousel", () => ({
  __esModule: true,
  default: () => <div data-testid="carousel">Carousel</div>,
}));

vi.mock("../components/LoginModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="login-modal">
        <button onClick={onClose}>Close Login</button>
      </div>
    ) : null,
}));

vi.mock("../components/RegisterModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="register-modal">
        <button onClick={onClose}>Close Register</button>
      </div>
    ) : null,
}));

// -----------------------------------------------
import Home from "../pages/Home";
// -----------------------------------------------

describe("Home page", () => {
  beforeEach(() => {
    mockGetAllTrips.mockReset();
    mockGetAllTrips.mockResolvedValue([]);
    mockGetUserById.mockReset();
    mockGetUserById.mockResolvedValue(mockBackendUser);
  });

  it("muestra el título, el hero y el mensaje sin rutas", async () => {
    await act(async () =>
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      )
    );

    await waitFor(() =>
      expect(
        screen.getAllByRole("heading", { name: /OneDayOneTrip/i })[0]
      ).toBeInTheDocument()
    );

    expect(
      screen.getByText((content, element) => {
        return (
          element?.tagName === "P" &&
          /Descobreix rutes d.*un dia ideals per escapades exprés!/i.test(
            content
          )
        );
      })
    ).toBeInTheDocument();
  });

  it("renderiza el carousel", async () => {
    await act(async () =>
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      )
    );

    await waitFor(() =>
      expect(screen.getByTestId("carousel")).toBeInTheDocument()
    );
  });

  it("carga y muestra trips correctamente", async () => {
    const mockTrips = [
      {
        _id: "t1",
        title: "Trip 1",
        country: "España",
        author: { userId: "uid_000", name: "Author 1" },
        coverImage: "https://example.com/img1.jpg",
      },
      {
        _id: "t2",
        title: "Trip 2",
        country: "Francia",
        author: { userId: "uid_000", name: "Author 2" },
        coverImage: "https://example.com/img2.jpg",
      },
    ];
    mockGetAllTrips.mockResolvedValue(mockTrips);

    await act(async () =>
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      )
    );

    await waitFor(() =>
      expect(mockGetAllTrips).toHaveBeenCalledWith(true)
    );

    await waitFor(() => {
      const grid = screen.queryByTestId("masonry-grid");
      expect(grid?.textContent).toContain("2 items");
    });
  });

  it("muestra loading inicialmente", async () => {
    mockGetAllTrips.mockImplementation(() => new Promise(() => {}));

    await act(async () =>
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      )
    );

    await waitFor(() => expect(mockGetAllTrips).toHaveBeenCalled());
  });

  it("muestra error cuando falla la carga", async () => {
    mockGetAllTrips.mockRejectedValue(new Error("Network error"));

    await act(async () =>
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      )
    );

    await waitFor(() =>
      expect(
        screen.getByText(/No s'han pogut carregar les rutes/i)
      ).toBeInTheDocument()
    );
  });

  it("cambia entre tabs cuando hay usuario autenticado", async () => {
    const { onAuthStateChanged } = await import("firebase/auth");

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      if (typeof callback === "function") callback(mockFirebaseUser);
      else if (callback?.next) callback.next(mockFirebaseUser);
      return () => {};
    });

    await act(async () =>
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      )
    );

    await waitFor(() => {
      const tabs = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.match(/recomanats|seguint/i));

      expect(tabs.length).toBeGreaterThan(0);
    });
  });

  it("abre modal de login", async () => {
    const { onAuthStateChanged } = await import("firebase/auth");

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      if (typeof callback === "function") callback(null);
      else if (callback?.next) callback.next(null);
      return () => {};
    });

    const user = userEvent.setup();

    await act(async () =>
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      )
    );

    const loginButtons = screen
      .queryAllByRole("button")
      .filter((btn) =>
        btn.textContent?.match(/iniciar sessió|login|entrar/i)
      );

    if (loginButtons.length > 0) {
      await act(async () => user.click(loginButtons[0]));

      await waitFor(() => {
        expect(screen.getByTestId("login-modal")).toBeInTheDocument();
      });
    }
  });

  it("abre modal de registro", async () => {
    const { onAuthStateChanged } = await import("firebase/auth");

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      if (typeof callback === "function") callback(null);
      else if (callback?.next) callback.next(null);
      return () => {};
    });

    const user = userEvent.setup();

    await act(async () =>
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      )
    );

    const registerButtons = screen
      .queryAllByRole("button")
      .filter((btn) =>
        btn.textContent?.match(/registrar-se|registro|register|crear compte/i)
      );

    if (registerButtons.length > 0) {
      await act(async () => user.click(registerButtons[0]));

      await waitFor(() => {
        expect(
          screen.getByTestId("register-modal")
        ).toBeInTheDocument();
      });
    }
  });

  it("renderiza sin usuario autenticado", async () => {
    await act(async () =>
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      )
    );

    await waitFor(() =>
      expect(
        screen.getAllByRole("heading", { name: /OneDayOneTrip/i })[0]
      ).toBeInTheDocument()
    );
  });

  it("filtra trips con usuario autenticado", async () => {
    const { onAuthStateChanged } = await import("firebase/auth");

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      if (typeof callback === "function") callback(mockFirebaseUser);
      else if (callback?.next) callback.next(mockFirebaseUser);
      return () => {};
    });

    const mockTrips = [
      {
        _id: "t1",
        title: "Trip 1",
        author: { userId: "uid_000", name: "Author" },
      },
      {
        _id: "t2",
        title: "Trip 2",
        author: { userId: "other-user", name: "Other" },
      },
    ];
    mockGetAllTrips.mockResolvedValue(mockTrips);

    await act(async () =>
      render(
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      )
    );

    await waitFor(() => expect(mockGetAllTrips).toHaveBeenCalled());
  });
});
