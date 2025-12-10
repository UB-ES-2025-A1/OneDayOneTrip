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

  it("renderiza el formulario y el botón", () => {
    renderWithRouter();
    expect(screen.getByText(/login_register_here/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /header_register/i })).toBeInTheDocument();
  });

  it("no llama a register si faltan datos", async () => {
    renderWithRouter();
    await userEvent.click(screen.getByRole("button", { name: /header_register/i }));
    expect(authApi.Auth.register).not.toHaveBeenCalled(); // ✅ era login por error
  });

  it("llama a register con datos correctos", async () => {
    renderWithRouter();

    const textInputs = screen.getAllByRole("textbox");
    // Orden de inputs de texto (flotantes): username, fullName, email
    await userEvent.type(textInputs[0], "juanp");
    await userEvent.type(textInputs[1], "Juan Pérez");
    await userEvent.type(textInputs[2], "juan@example.com");

    const passwordInputs = document.querySelectorAll('input[type="password"]');
    await userEvent.type(passwordInputs[0] as HTMLInputElement, "secreta123"); // password
    await userEvent.type(passwordInputs[1] as HTMLInputElement, "secreta123"); // confirm

    await userEvent.click(screen.getByRole("button", { name: /header_register/i }));

    expect(authApi.Auth.register).toHaveBeenCalledWith(
      "Juan Pérez",
      "juanp",
      "juan@example.com",
      "secreta123"
    );
  });
});
