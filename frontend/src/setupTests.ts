import "@testing-library/jest-dom/vitest";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { beforeAll, afterAll, afterEach, vi } from "vitest";

// ...handlers y ciclo de vida como te pasé antes...


// Datos dummy y handlers
const dummyTrips = [
  {
    id: "trip-1",
    title: "Paris en 3 días",
    description: "Un viaje de prueba a París",
    city: "Paris",
    author: { userId: "u1", name: "Usuario Test" },
  },
];

// Handlers
const server = setupServer(
  // GET /trips
  rest.get("*/trips", (_req, res, ctx) => {
    return res(ctx.json(dummyTrips));
  }),
  // POST /trips
  rest.post("*/trips", (_req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: "new-trip-id" }));
  }),
  // POST /users/register
  rest.post("*/users/register", (_req, res, ctx) => {
    return res(ctx.status(201));
  }),
  // POST /users/login
  rest.post("*/users/login", (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ token: "fake-jwt-token" }));
  })
);

// Ciclo de vida
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Exponer para sobreescribir handlers en tests específicos
Object.assign(globalThis, { mswServer: server, mswRest: rest });
