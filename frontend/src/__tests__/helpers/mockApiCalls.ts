import { vi } from 'vitest';

// Mock functions para APIs
export const mockGetAllTrips = vi.fn();
export const mockGetTripById = vi.fn();
export const mockGetUserById = vi.fn();
export const mockRateTrip = vi.fn();
export const mockFollowUser = vi.fn();
export const mockUnfollowUser = vi.fn();
export const mockGetTripComments = vi.fn();
export const mockCreateTripComment = vi.fn();

// Datos mock por defecto
export const mockTrip = {
  _id: 'trip-123',
  title: 'Test Trip',
  description: 'Test Description',
  country: 'España',
  city: 'Barcelona',
  category: 'Nature',
  distance: 10,
  duration: '2h',
  difficulty: 'Easy',
  season: 'Spring',
  tags: ['adventure', 'coast'],
  images: ['https://example.com/image1.jpg'],
  trip_points: [
    {
      title: 'Point 1',
      description: 'Point description',
      coordinates: { lat: 41.3, lng: 2.1 },
    },
  ],
  author: {
    uid: 'author-123',
    username: 'authoruser',
    url_foto_perfil: 'https://example.com/author.jpg',
  },
  avgRating: 4.5,
  numRatings: 10,
  createdAt: '2024-01-01T00:00:00Z',
};

export const mockUser = {
  uid: 'user-123',
  username: 'testuser',
  nom_i_cognoms: 'Test User',
  mail: 'test@example.com',
  url_foto_perfil: 'https://example.com/photo.jpg',
  seguidors: 10,
  seguits: 5,
  publicacions: ['trip-1', 'trip-2'],
  guardades: ['trip-3'],
  llista_seguidors: ['follower-1', 'follower-2'],
  llista_seguits: ['following-1', 'following-2'],
};

// Setup para resetear mocks
export const resetApiMocks = () => {
  mockGetAllTrips.mockReset();
  mockGetTripById.mockReset();
  mockGetUserById.mockReset();
  mockRateTrip.mockReset();
  mockFollowUser.mockReset();
  mockUnfollowUser.mockReset();
  mockGetTripComments.mockReset();
  mockCreateTripComment.mockReset();
};

// Setup de valores por defecto
export const setupDefaultMocks = () => {
  mockGetAllTrips.mockResolvedValue([mockTrip]);
  mockGetTripById.mockResolvedValue(mockTrip);
  mockGetUserById.mockResolvedValue(mockUser);
  mockRateTrip.mockResolvedValue({ avgRating: 4.5, numRatings: 11 });
  mockFollowUser.mockResolvedValue({ message: 'User followed' });
  mockUnfollowUser.mockResolvedValue({ message: 'User unfollowed' });
  mockGetTripComments.mockResolvedValue([]);
  mockCreateTripComment.mockResolvedValue({ comment: { _id: 'comment-1', text: 'Test comment' } });
};




