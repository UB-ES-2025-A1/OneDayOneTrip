import { vi } from 'vitest';

// Mock react-i18next to return the key as the translation (for testing)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'ca'
    }
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn()
  }
}));

// Mock global de fetch para evitar unhandled rejections en tests
// En lugar de rechazar siempre, devolvemos una respuesta por defecto
// Los tests individuales pueden sobrescribir esto si necesitan comportamiento específico
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: false,
    status: 404,
    json: async () => ({ error: 'Not found' }),
  } as Response)
) as typeof fetch;

// Mock de URL.createObjectURL y URL.revokeObjectURL (APIs del navegador)
// Estas no existen en el entorno de test de JSDOM
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock del SDK de Auth que usan los componentes
vi.mock('firebase/auth', async () => {
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
