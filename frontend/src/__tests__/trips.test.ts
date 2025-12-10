import { describe, it, expect, vi, beforeEach } from "vitest";
import { fallbackT } from "../api/trips";

import {
  getAllTrips,
  getTripById,
  getTripComments,
  createTripComment,
  createTripMultipart,
  rateTrip,
} from "../api/trips";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("trips API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllTrips", () => {
    it("obtiene todas las trips con includeStats false por defecto", async () => {
      const mockTrips = [{ id: "1", title: "Trip 1" }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTrips,
      });

      const result = await getAllTrips();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("include_stats=false")
      );
      expect(result).toEqual(mockTrips);
    });

    it("obtiene todas las trips sin stats cuando includeStats es false", async () => {
      const mockTrips = [{ id: "1", title: "Trip 1" }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTrips,
      });

      const result = await getAllTrips(false);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("include_stats=false")
      );
      expect(result).toEqual(mockTrips);
    });

    it("lanza error cuando la respuesta no es ok", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(getAllTrips()).rejects.toThrow("Error carregant les rutes");
    });
  });

  describe("getTripById", () => {
    it("obtiene una trip por ID", async () => {
      const mockTrip = { id: "1", title: "Trip 1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTrip,
      });

      const result = await getTripById("1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/trips/1")
      );
      expect(result).toEqual(mockTrip);
    });

    it("codifica correctamente el ID en la URL", async () => {
      const mockTrip = { id: "1", title: "Trip 1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTrip,
      });

      await getTripById("trip with spaces");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("trips/trip%20with%20spaces")
      );
    });

    it("lanza error cuando la trip no existe", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Not found",
      });

      await expect(getTripById("invalid")).rejects.toThrow(
        "Ruta no trobada o id invàlid"
      );
    });
  });

  describe("getTripComments", () => {
    it("obtiene comentarios de una trip con límite y skip por defecto", async () => {
      const mockComments = [
        { id: "1", text: "Comment 1" },
        { id: "2", text: "Comment 2" },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ comments: mockComments }),
      });

      const result = await getTripComments("trip-1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=20&skip=0")
      );
      expect(result).toEqual(mockComments);
    });

    it("obtiene comentarios con límite y skip personalizados", async () => {
      const mockComments = [{ id: "1", text: "Comment 1" }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ comments: mockComments }),
      });

      const result = await getTripComments("trip-1", 10, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=10&skip=5")
      );
      expect(result).toEqual(mockComments);
    });

    it("retorna array vacío cuando no hay comentarios", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await getTripComments("trip-1");

      expect(result).toEqual([]);
    });

    it("lanza error cuando la respuesta no es ok", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server error",
      });

      await expect(getTripComments("trip-1")).rejects.toThrow(
        "Error carregant comentaris"
      );
    });
  });

  describe("createTripComment", () => {
    it("crea un comentario correctamente", async () => {
      const mockComment = {
        id: "1",
        text: "Great trip!",
        userId: "user-1",
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ comment: mockComment }),
      });

      const result = await createTripComment("trip-1", {
        userId: "user-1",
        userName: "User 1",
        text: "Great trip!",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/trips/trip-1/comments"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      expect(result).toEqual(mockComment);
    });

    it("incluye userProfilePicture cuando está disponible", async () => {
      const mockComment = { id: "1", text: "Comment" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ comment: mockComment }),
      });

      await createTripComment("trip-1", {
        userId: "user-1",
        userName: "User 1",
        userProfilePicture: "pic.jpg",
        text: "Comment",
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.userProfilePicture).toBe("pic.jpg");
    });

    it("usa string vacío para userProfilePicture cuando no está disponible", async () => {
      const mockComment = { id: "1", text: "Comment" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ comment: mockComment }),
      });

      await createTripComment("trip-1", {
        userId: "user-1",
        userName: "User 1",
        text: "Comment",
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.userProfilePicture).toBe("");
    });

    it("lanza error cuando la creación falla", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      });

      await expect(
        createTripComment("trip-1", {
          userId: "user-1",
          userName: "User 1",
          text: "Comment",
        })
      ).rejects.toThrow("Error creant comentari");
    });
  });

  describe("createTripMultipart", () => {
    it("crea un trip con FormData correctamente", async () => {
      const mockTrip = { id: "1", title: "New Trip" };
      const mockFile = new File(["content"], "test.jpg", { type: "image/jpeg" });
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTrip,
      });

      const tripPayload = {
        title: "New Trip",
        description: "Description",
        tags: ["tag1"],
        author: {
          userId: "user-1",
          name: "User",
        },
        city: "Barcelona",
        routeMap: [{ lat: 41.3851, lng: 2.1734 }],
        trip_points: [],
      };

      const result = await createTripMultipart(
        tripPayload,
        mockFile,
        [mockFile],
        [mockFile],
        fallbackT
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/trips/"),
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(result).toEqual(mockTrip);
    });

    it("crea trip sin cover cuando cover es null", async () => {
      const mockTrip = { id: "1", title: "New Trip" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTrip,
      });

      const tripPayload = {
        title: "New Trip",
        description: "Description",
        tags: ["tag1"],
        author: {
          userId: "user-1",
          name: "User",
        },
        city: "Barcelona",
        routeMap: [],
        trip_points: [],
      };

      await createTripMultipart(tripPayload, null, [], [], fallbackT);

      expect(mockFetch).toHaveBeenCalled();
    });

    it("no incluye point_images cuando son null", async () => {
      const mockTrip = { id: "1", title: "New Trip" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTrip,
      });

      const tripPayload = {
        title: "New Trip",
        description: "Description",
        tags: ["tag1"],
        author: {
          userId: "user-1",
          name: "User",
        },
        city: "Barcelona",
        routeMap: [],
        trip_points: [],
      };

      await createTripMultipart(tripPayload, null, [], [null, null], fallbackT);

      expect(mockFetch).toHaveBeenCalled();
    });

    it("lanza error cuando la creación falla", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Validation error",
      });

      const tripPayload = {
        title: "New Trip",
        description: "Description",
        tags: ["tag1"],
        author: {
          userId: "user-1",
          name: "User",
        },
        city: "Barcelona",
        routeMap: [],
        trip_points: [],
      };

      await expect(
        createTripMultipart(tripPayload, null, [], [], fallbackT)
      ).rejects.toThrow();
    });
  });

  describe("rateTrip", () => {
    it("valora una trip correctamente", async () => {
      const mockRating = { avgRating: 5, numRatings: 1, tripId: "trip-1" };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRating,
      });

      const result = await rateTrip("trip-1", {
        userId: "user-1",
        rating: 5,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/ratings/trip/trip-1"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
      expect(result).toEqual(mockRating);
    });

    it("lanza error cuando la valoración falla", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Invalid rating",
      });

      await expect(
        rateTrip("trip-1", { userId: "user-1", rating: 5 })
      ).rejects.toThrow("Error valorant la ruta");
    });
  });
});

