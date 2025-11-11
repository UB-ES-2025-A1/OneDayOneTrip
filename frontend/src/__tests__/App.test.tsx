// frontend/src/__tests__/App.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('App', () => {
  it('monta la app y muestra el heading', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('heading', { name: /bienvenido a onedayonetrip/i })
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /registrarse/i })).toBeInTheDocument()
  })
})