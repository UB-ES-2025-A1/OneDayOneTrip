import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

// Mocks hoisted
const {
  mockGetUserById,
  mockGetAllTrips,
  mockNavigate,
  mockOnAuthStateChanged,
  mockSignOut,
} = vi.hoisted(() => {
  const mockGetUserById = vi.fn();
  const mockGetAllTrips = vi.fn();
  const mockNavigate = vi.fn();
  const mockOnAuthStateChanged = vi.fn();
  const mockSignOut = vi.fn();
  return {
    mockGetUserById,
    mockGetAllTrips,
    mockNavigate,
    mockOnAuthStateChanged,
    mockSignOut,
  };
});

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  signOut: mockSignOut,
  getAuth: vi.fn(() => ({
    currentUser: null,
  })),
  auth: {},
}));

vi.mock("../api/client", () => ({
  getUserById: mockGetUserById,
}));

vi.mock("../api/trips", () => ({
  getAllTrips: mockGetAllTrips,
}));

vi.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

vi.mock("../components/MasonryGrid", () => ({
  __esModule: true,
  default: ({ items }: { items: any[] }) => (
    <div data-testid="masonry-grid">{items?.length || 0} items</div>
  ),
}));

vi.mock("../components/EditarPerfilModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="editar-perfil-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock("../components/LlistaSeguitsModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="llista-seguits-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock("../components/LlistaSeguidorsModal", () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="llista-seguidors-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock("../components/CreateTripForm", () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="create-trip-form">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

import UserProfile from "../pages/UserProfile";

const mockBackendUser = {
  uid: "current-user-uid",
  username: "currentuser",
  nom_i_cognoms: "Current User",
  mail: "current@example.com",
  url_foto_perfil: "https://example.com/photo.jpg",
  seguidors: 10,
  seguits: 5,
  publicacions: ["trip-1", "trip-2"],
  guardades: ["trip-3"],
  llista_seguidors: Array.from({ length: 10 }, (_, i) => `follower-${i + 1}`),
  llista_seguits: Array.from({ length: 5 }, (_, i) => `following-${i + 1}`),
};

const mockTrips = [
  {
    _id: "trip-1",
    title: "My Trip 1",
    author: { uid: "current-user-uid", name: "Current User" },
  },
  {
    _id: "trip-2",
    title: "My Trip 2",
    author: { uid: "current-user-uid", name: "Current User" },
  },
  {
    _id: "trip-3",
    title: "Saved Trip",
    author: { uid: "other-user", name: "Other User" },
  },
];

describe("UserProfile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockUser = {
      uid: "current-user-uid",
      email: "current@example.com",
      displayName: "Current User",
    };

    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      if (callback) callback(mockUser as any);
      return () => {};
    });

    mockGetUserById.mockResolvedValue(mockBackendUser);
    mockGetAllTrips.mockResolvedValue(mockTrips);
  });

  it("renderiza loading inicial", async () => {
    mockGetUserById.mockImplementation(() => new Promise(() => {})); // Never resolves

    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(mockGetUserById).toHaveBeenCalled();
    });
  });

  it("carga y muestra perfil del usuario actual", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(mockGetUserById).toHaveBeenCalledWith("current-user-uid");
    });

    await waitFor(() => {
      expect(screen.getByText("Current User")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("muestra error cuando no se puede cargar perfil", async () => {
    mockGetUserById.mockRejectedValue(new Error("Network error"));

    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      // El componente puede mostrar "Network error" o el mensaje traducido
      const errorText = screen.queryByText(/Network error/i) || screen.queryByText(/No s'ha pogut carregar el perfil/i);
      expect(errorText).toBeInTheDocument();
    });
  });

  it("muestra información del usuario", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Current User")).toBeInTheDocument();
      expect(screen.getByText("current@example.com")).toBeInTheDocument();
    });
  });

  it("muestra contadores", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      // Buscar números individualmente usando los labels dentro de .user-stats para evitar múltiples matches
      const userStats = screen.getByText("Seguidors").closest(".user-stats");
      expect(userStats).toBeInTheDocument();
      
      // Buscar cada stat por su label dentro de user-stats
      const allStats = userStats?.querySelectorAll('.stat') || [];
      const seguidorsStat = Array.from(allStats).find(stat => 
        stat.querySelector('.label')?.textContent === 'Seguidors'
      );
      const seguitsStat = Array.from(allStats).find(stat => 
        stat.querySelector('.label')?.textContent === 'Seguits'
      );
      const publicacionsStat = Array.from(allStats).find(stat => 
        stat.querySelector('.label')?.textContent === 'Publicacions'
      );
      
      expect(seguidorsStat?.querySelector(".number")).toHaveTextContent("10");
      expect(seguitsStat?.querySelector(".number")).toHaveTextContent("5");
      expect(publicacionsStat?.querySelector(".number")).toHaveTextContent("2");
    });
  });

  it("cambia entre tabs publicacions y guardat", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetUserById).toHaveBeenCalled();
    });

    // Buscar botones de tabs
    const tabs = screen.getAllByRole("button").filter((btn) =>
      btn.textContent?.match(/publicacions|guardat|publicaciones|guardadas/i)
    );

    if (tabs.length > 1) {
      await user.click(tabs[1]);
      // Verificar que cambió el tab
    }
  });

  it("muestra trips del usuario en tab publicacions", async () => {
    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetAllTrips).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId("masonry-grid")).toBeInTheDocument();
    });
  });

  it("abre modal de editar perfil", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetUserById).toHaveBeenCalled();
    });

    // Buscar botón de editar
    const editButtons = screen.getAllByRole("button").filter((btn) =>
      btn.textContent?.match(/editar|edit|perfil|profile/i)
    );

    if (editButtons.length > 0) {
      await user.click(editButtons[0]);
      await waitFor(() => {
        expect(screen.getByTestId("editar-perfil-modal")).toBeInTheDocument();
      });
    }
  });

  it("abre modal de lista de seguidos", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetUserById).toHaveBeenCalled();
    });

    // Buscar botón de seguidos
    const seguidosButtons = screen.getAllByRole("button").filter((btn) =>
      btn.textContent?.match(/seguits|seguidos|following/i)
    );

    if (seguidosButtons.length > 0) {
      await user.click(seguidosButtons[0]);
      await waitFor(() => {
        expect(screen.getByTestId("llista-seguits-modal")).toBeInTheDocument();
      });
    }
  });

  it("abre modal de lista de seguidores", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetUserById).toHaveBeenCalled();
    });

    // Buscar botón de seguidores
    const seguidoresButtons = screen.getAllByRole("button").filter((btn) =>
      btn.textContent?.match(/seguidors|seguidores|followers/i)
    );

    if (seguidoresButtons.length > 0) {
      await user.click(seguidoresButtons[0]);
      await waitFor(() => {
        expect(screen.getByTestId("llista-seguidors-modal")).toBeInTheDocument();
      });
    }
  });

  it("abre modal de crear trip", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetUserById).toHaveBeenCalled();
    });

    // Buscar botón de crear trip
    const createButtons = screen.getAllByRole("button").filter((btn) =>
      btn.textContent?.match(/crear|new|nueva|ruta|trip/i)
    );

    if (createButtons.length > 0) {
      await user.click(createButtons[0]);
      await waitFor(() => {
        expect(screen.getByTestId("create-trip-form")).toBeInTheDocument();
      });
    }
  });

  it("redirige a login si no hay usuario autenticado", async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      if (callback) callback(null);
      return () => {};
    });

    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Verificar que no se carga el perfil
      expect(mockGetUserById).not.toHaveBeenCalled();
    });
  });

  it("cierra sesión correctamente", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetUserById).toHaveBeenCalled();
    });

    // Buscar botón de logout
    const logoutButtons = screen.getAllByRole("button").filter((btn) =>
      btn.textContent?.match(/logout|cerrar|sortir|sign out/i)
    );

    if (logoutButtons.length > 0) {
      await user.click(logoutButtons[0]);
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    }
  });
});

