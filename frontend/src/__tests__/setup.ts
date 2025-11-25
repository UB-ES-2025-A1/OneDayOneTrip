import { vi } from 'vitest';

// Mock del SDK de Auth que usan los componentes
vi.mock('firebase/auth', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onAuthStateChanged = vi.fn((_auth: any, cb?: (u: any) => void) => {
    // llama una vez al callback con "no usuario"
    if (typeof cb === 'function') cb(null);
    // y DEVUELVE la función de unsubscribe
    return () => {};
  });

  return {
    __esModule: true,
    // exports usados habitualmente
    getAuth: vi.fn(() => ({})),
    onAuthStateChanged,
    // si en otros tests llamas a estos, ya están listos:
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    // tipos/constantes que a veces se importan
    GoogleAuthProvider: vi.fn(),
  };
});

// (Opcional) si importas tu wrapper local, neutralízalo
vi.mock('@/firebase', () => ({
  __esModule: true,
  default: {},        // app
  auth: {},           // objeto auth “dummy”
  db: {},             // si lo necesitas en tests
}));
