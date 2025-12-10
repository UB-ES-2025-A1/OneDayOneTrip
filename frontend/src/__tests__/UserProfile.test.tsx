import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
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

// Mock del notifier para evitar errores de API 404
vi.mock("../api/notifier", () => ({
  getNotifications: vi.fn().mockResolvedValue([]),
  createNotification: vi.fn().mockResolvedValue({}),
  markNotificationAsRead: vi.fn().mockResolvedValue({}),
  deleteNotification: vi.fn().mockResolvedValue({}),
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

  it("renderiza el componente y llama a la API", async () => {
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

  it("no carga perfil si no hay usuario autenticado", async () => {
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
      expect(mockGetUserById).not.toHaveBeenCalled();
    });
  });

  it("renderiza layout correctamente", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <UserProfile />
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });
});
