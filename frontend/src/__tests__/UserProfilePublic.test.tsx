import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

// Mocks básicos
const { mockGetUserById, mockGetAllTrips, mockNavigate } = vi.hoisted(() => ({
  mockGetUserById: vi.fn(),
  mockGetAllTrips: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "public-user-uid" }),
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_auth, cb) => {
    if (cb) cb(null);
    return () => {};
  }),
  signOut: vi.fn(),
  getAuth: vi.fn(() => ({ currentUser: null })),
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

import UserProfilePublic from "../pages/UserProfilePublic";

const mockPublicUser = {
  uid: "public-user-uid",
  nom_i_cognoms: "Public User",
  publicacions: [],
  llista_seguidors: [],
  llista_seguits: [],
};

describe("UserProfilePublic page (básico)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserById.mockResolvedValue(mockPublicUser);
    mockGetAllTrips.mockResolvedValue([]);
  });

  it("llama a getUserById con el ID correcto", async () => {
    render(
      <MemoryRouter>
        <UserProfilePublic />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetUserById).toHaveBeenCalledWith("public-user-uid");
    });
  });
});
