import { vi } from 'vitest';

export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export const createMockUser = (overrides?: Partial<MockUser>): MockUser => ({
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  ...overrides,
});

export const createMockAuth = () => {
  let currentUser: MockUser | null = null;
  const callbacks: Array<(user: MockUser | null) => void> = [];

  const mockOnAuthStateChanged = vi.fn((_auth: any, callback?: (user: MockUser | null) => void) => {
    if (callback) {
      callbacks.push(callback);
      // Llamar inmediatamente con el usuario actual
      callback(currentUser);
    }
    // Retornar función de unsubscribe
    return () => {
      const index = callbacks.indexOf(callback!);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  });

  const mockSignOut = vi.fn().mockImplementation(async () => {
    currentUser = null;
    // Notificar a todos los callbacks
    callbacks.forEach(cb => cb(null));
  });

  const setUser = (user: MockUser | null) => {
    currentUser = user;
    callbacks.forEach(cb => cb(user));
  };

  return {
    mockOnAuthStateChanged,
    mockSignOut,
    setUser,
    getCurrentUser: () => currentUser,
  };
};




