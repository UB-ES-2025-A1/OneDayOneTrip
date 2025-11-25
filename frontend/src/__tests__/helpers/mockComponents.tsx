import { vi } from 'vitest';
import React from 'react';

// Mock de MasonryGrid
export const mockMasonryGrid = () => {
  vi.mock('../components/MasonryGrid', () => ({
    __esModule: true,
    default: ({ trips }: { trips: any[] }) => (
      <div data-testid="masonry-grid">
        {trips?.length || 0} trips displayed
      </div>
    ),
  }));
};

// Mock de Carousel
export const mockCarousel = () => {
  vi.mock('../components/Carousel', () => ({
    __esModule: true,
    default: () => <div data-testid="carousel">Carousel Component</div>,
  }));
};

// Mock de EtapesList
export const mockEtapesList = () => {
  vi.mock('../components/EtapesList', () => ({
    __esModule: true,
    default: ({ points }: { points?: any[] }) => (
      <div data-testid="etapes-list">
        {points?.length || 0} points
      </div>
    ),
  }));
};

// Mock de Layout (ya funciona bien, pero podemos simplificarlo)
export const mockLayout = () => {
  vi.mock('../components/Layout', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="layout">{children}</div>
    ),
  }));
};

// Mock de modales complejos
export const mockLlistaSeguitsModal = () => {
  vi.mock('../components/LlistaSeguitsModal', () => ({
    __esModule: true,
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
      isOpen ? (
        <div data-testid="llista-seguits-modal">
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
  }));
};

export const mockLlistaSeguidorsModal = () => {
  vi.mock('../components/LlistaSeguidorsModal', () => ({
    __esModule: true,
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
      isOpen ? (
        <div data-testid="llista-seguidors-modal">
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
  }));
};

export const mockEditarPerfilModal = () => {
  vi.mock('../components/EditarPerfilModal', () => ({
    __esModule: true,
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
      isOpen ? (
        <div data-testid="editar-perfil-modal">
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
  }));
};

export const mockCreateTripForm = () => {
  vi.mock('../components/CreateTripForm', () => ({
    __esModule: true,
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
      isOpen ? (
        <div data-testid="create-trip-form">
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
  }));
};

// Helper para mockear todos los componentes comunes
export const mockAllCommonComponents = () => {
  mockMasonryGrid();
  mockCarousel();
  mockEtapesList();
  mockLayout();
  mockLlistaSeguitsModal();
  mockLlistaSeguidorsModal();
  mockEditarPerfilModal();
  mockCreateTripForm();
};



