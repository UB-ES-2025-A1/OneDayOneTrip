import { describe, it, expect, beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";
import { getAuth } from "firebase/auth";

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
}));

import { apiPost, apiGet, followUser } from "../api/client";

const mockFetch = vi.fn();

describe("api client helpers", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).fetch = mockFetch;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.mocked(getAuth).mockReturnValue({ currentUser: null } as any);
  });

  it("adjunta el token cuando el usuario está autenticado", async () => {
    vi.mocked(getAuth).mockReturnValue({
      currentUser: {
        getIdToken: vi.fn().mockResolvedValue("token-123"),
      },
    } as any);

    await apiPost("/users/register", { foo: "bar" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/register"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      })
    );
  });

  it("no adjunta Authorization cuando no hay usuario", async () => {
    await apiGet("/users");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users"),
      expect.objectContaining({
        headers: {},
      })
    );
  });

  it("followUser construye la ruta correcta", async () => {
    await followUser("u1", "u2");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/follow/u1/u2"),
      expect.objectContaining({ method: "POST" })
    );
  });
});

