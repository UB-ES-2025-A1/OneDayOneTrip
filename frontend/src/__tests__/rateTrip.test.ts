import { describe, it, expect, beforeEach, vi } from "vitest";

import { rateTrip } from "../api/trips";

const mockFetch = vi.fn();

describe("rateTrip API helper", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = mockFetch;
  });

  it("envía la petición POST con el payload correcto", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ avgRating: 4.5, numRatings: 2 }),
    });

    const result = await rateTrip("507f1f77bcf86cd799439011", {
      userId: "user-1",
      rating: 5,
      date: "2024-01-01T00:00:00.000Z",
    });

    expect(result).toEqual({ avgRating: 4.5, numRatings: 2 });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/ratings/trip/507f1f77bcf86cd799439011");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string);
    expect(body).toEqual({
      userId: "user-1",
      rating: 5,
      date: "2024-01-01T00:00:00.000Z",
    });
  });

  it("si no hay fecha la genera automáticamente y lanza error en HTTP != 200", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "ups",
    });

    await expect(
      rateTrip("trip-1", {
        userId: "user-2",
        rating: 3,
      })
    ).rejects.toThrow(/500/);

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body.userId).toBe("user-2");
    expect(body.rating).toBe(3);
    expect(typeof body.date).toBe("string");
  });
});

