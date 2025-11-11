import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'

describe('Dashboard', () => {
    it("muestra el dashboard", () => {
    render(
          <MemoryRouter initialEntries={['/']}>
            <Dashboard />
          </MemoryRouter>
        )
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
})