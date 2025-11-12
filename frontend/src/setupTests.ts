import '@testing-library/jest-dom/vitest';
import 'whatwg-fetch';

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { beforeAll, afterAll, afterEach } from 'vitest';

// ─────────────────────────────────────────────
// Datos dummy
// ─────────────────────────────────────────────
const dummyTrips = [
  {
    id: 'trip-1',
    title: 'Paris en 3 días',
    description: 'Un viaje de prueba a París',
    city: 'Paris',
    author: { userId: 'u1', name: 'Usuario Test' },
  },
];

// ─────────────────────────────────────────────
// Handlers (MSW v2)
// ─────────────────────────────────────────────
const server = setupServer(
  // GET /trips
  http.get('*/trips', () => {
    return HttpResponse.json(dummyTrips);
  }),

  // POST /trips
  http.post('*/trips', async () => {
    // Si necesitas leer el body:
    // const body = await request.json();
    return HttpResponse.json({ id: 'new-trip-id' }, { status: 201 });
  }),

  // POST /users/register
  http.post('*/users/register', async () => {
    return new HttpResponse(null, { status: 201 });
  }),

  // POST /users/login
  http.post('*/users/login', async () => {
    return HttpResponse.json({ token: 'fake-jwt-token' }, { status: 200 });
  })
);

// ─────────────────────────────────────────────
// Ciclo de vida
// ─────────────────────────────────────────────
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Opcional: exponer para tests que quieran sobreescribir handlers
// (añade un .d.ts si quieres tipos)
Object.assign(globalThis, { mswServer: server, mswHttp: http, mswHttpResponse: HttpResponse });
