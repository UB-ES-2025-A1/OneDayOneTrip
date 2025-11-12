import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import LoginModal from "../components/LoginModal";

// Simulamos la función de autenticación de login (ej: signIn) del módulo de Firebase o similar
vi.mock("../firebase/auth", () => ({
  loginUser: vi.fn().mockResolvedValue({ token: "fake-jwt-token" }),
}), { virtual: true });

describe("LoginModal", () => {
  const mockOnClose = vi.fn();
  const { loginUser } = require("../firebase/auth");
    beforeEach(() => {
    vi.clearAllMocks();
    loginUser.mockClear();
    });


  beforeEach(() => {
    loginUser.mockClear();
    mockOnClose.mockClear();
  });

  it("muestra el formulario de login con campos de usuario y contraseña", () => {
    render(<LoginModal onClose={mockOnClose} />);
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it("no intenta hacer login si faltan datos y muestra error de validación", async () => {
    render(<LoginModal onClose={mockOnClose} />);
    // Dejar campos vacíos y hacer click en iniciar sesión
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    expect(loginUser).not.toHaveBeenCalled();
    expect(screen.getByText(/todos los campos son obligatorios/i)).toBeInTheDocument();
  });

  it("llama a la función de login con credenciales correctas y cierra el modal al iniciar sesión", async () => {
    render(<LoginModal onClose={mockOnClose} />);
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "juan@example.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "secreta123");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    // Verificar que se llamó a loginUser con email y password correctos
    expect(loginUser).toHaveBeenCalledWith("juan@example.com", "secreta123");
    // Si el login es exitoso, debe cerrarse el modal
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("muestra un mensaje de error si las credenciales son incorrectas y no cierra el modal", async () => {
    // Preparamos el mock para que rechace la promesa (login fallido)
    loginUser.mockRejectedValueOnce(new Error("auth/wrong-password"));
    render(<LoginModal onClose={mockOnClose} />);
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "maria@example.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "claveincorrecta");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    // No se debe cerrar el modal
    expect(mockOnClose).not.toHaveBeenCalled();
    // Debe aparecer un mensaje de error para el usuario
    expect(screen.getByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument();
  });
});
