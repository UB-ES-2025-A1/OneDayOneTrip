import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

// Mocks hoisted
const {
  mockGetTripById,
  mockGetAllTrips,
  mockGetUserById,
  mockRateTrip,
  mockFollowUser,
  mockUnfollowUser,
  mockNavigate,
  mockOnAuthStateChanged,
  mockSignOut,
  mockUseParams,
} = vi.hoisted(() => {
  const mockGetTripById = vi.fn();
  const mockGetAllTrips = vi.fn();
  const mockGetUserById = vi.fn();
  const mockRateTrip = vi.fn();
  const mockFollowUser = vi.fn();
  const mockUnfollowUser = vi.fn();
  const mockNavigate = vi.fn();
  const mockOnAuthStateChanged = vi.fn();
  const mockSignOut = vi.fn();
  const mockUseParams = vi.fn();
  return {
    mockGetTripById,
    mockGetAllTrips,
    mockGetUserById,
    mockRateTrip,
    mockFollowUser,
    mockUnfollowUser,
    mockNavigate,
    mockOnAuthStateChanged,
    mockSignOut,
    mockUseParams,
  };
});

vi.mock("react-router-dom", () => ({
  useParams: mockUseParams,
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

vi.mock("../api/trips", () => ({
  getTripById: mockGetTripById,
  getAllTrips: mockGetAllTrips,
  rateTrip: mockRateTrip,
  getTripComments: vi.fn().mockResolvedValue([]),
}));

vi.mock("../api/client", () => ({
  getUserById: mockGetUserById,
  followUser: mockFollowUser,
  unfollowUser: mockUnfollowUser,
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

vi.mock("../components/EtapesList", () => ({
  __esModule: true,
  default: ({ etapes }: { etapes?: any[] }) => (
    <div data-testid="etapes-list">{etapes?.length || 0} etapes</div>
  ),
}));

vi.mock("../components/Valorar", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onClose,
    onSubmit,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number) => void;
  }) =>
    isOpen ? (
      <div data-testid="valorar-modal">
        <button onClick={() => onSubmit(5)}>Rate 5</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock("../components/Comments", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="comments">
      <h2>Comentaris</h2>
      <p>Comments Component</p>
    </div>
  ),
}));

import RutaDetall from "../pages/RutaDetall";

describe("RutaDetall page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      if (callback) callback(null);
      return () => {};
    });
  });

  it("muestra error cuando ID es inválido", async () => {
    mockUseParams.mockReturnValue({ id: "invalid-id-format" });

    await act(async () => {
      render(
        <MemoryRouter>
          <RutaDetall />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/route_detail_error_id_invalid/i)).toBeInTheDocument();
    });
  });
});
