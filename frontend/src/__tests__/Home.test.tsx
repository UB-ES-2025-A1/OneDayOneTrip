import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import Home from "../pages/Home";

describe("Home page", () => {
  it("renderiza el headline y elementos básicos", () => {
    render(
              <MemoryRouter initialEntries={['/']}>
                <Home />
              </MemoryRouter>
            )
    // ajusta a lo que haya en tu Home.tsx
    expect(screen.getByText(/OneDayOneTrip/i)).toBeInTheDocument();
  });
});