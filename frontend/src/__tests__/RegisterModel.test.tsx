// 👇 El mock del módulo debe ir ANTES de importar el componente que lo usa
import { vi } from "vitest";
vi.mock("../firebase/auth", () => {
  return {
    Auth: {
      register: vi.fn().mockResolvedValue({ uid: "user-123" }),
      login: vi.fn(),
      logout: vi.fn(),
      onAuthChange: vi.fn(),
      getCurrentUser: vi.fn(),
    },
    auth: {}, // por si se importa en algún sitio
  };
});

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import RegisterModal from "../components/RegisterModal";
import * as authApi from "../firebase/auth"; // <- aquí el mock expone Auth.register

describe("RegisterModal", () => {
  const mockOnClose = vi.fn();
  const mockOpenLogin = vi.fn();

  const renderWithRouter = () =>
    render(
      <MemoryRouter>
        <RegisterModal onClose={mockOnClose} openLogin={mockOpenLogin} />
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el formulario con todos los campos y el botón", () => {
    renderWithRouter();
    expect(screen.getByPlaceholderText(/nom d'usuari/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nom complet/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/correu electrònic/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^contrasenya$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirmar contrasenya/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /registrar-se/i })).toBeInTheDocument();
  });

  it("no llama a register si faltan datos", async () => {
    renderWithRouter();
    await userEvent.click(screen.getByRole("button", { name: /registrar-se/i }));
    expect(authApi.Auth.register).not.toHaveBeenCalled(); // ✅ era login por error
  });

  it("llama a register con datos correctos", async () => {
    renderWithRouter();

    await userEvent.type(screen.getByPlaceholderText(/nom complet/i), "Juan Pérez");
    await userEvent.type(screen.getByPlaceholderText(/nom d'usuari/i), "juanp");
    await userEvent.type(screen.getByPlaceholderText(/correu electrònic/i), "juan@example.com");
    await userEvent.type(screen.getByPlaceholderText(/^contrasenya$/i), "secreta123");
    await userEvent.type(screen.getByPlaceholderText(/confirmar contrasenya/i), "secreta123");

    await userEvent.click(screen.getByRole("button", { name: /registrar-se/i }));

    expect(authApi.Auth.register).toHaveBeenCalledWith(
      "Juan Pérez",
      "juanp",
      "juan@example.com",
      "secreta123"
    );
  });
});