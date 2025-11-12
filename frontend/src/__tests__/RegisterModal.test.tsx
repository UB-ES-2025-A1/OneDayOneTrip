import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import RegisterModal from "../components/RegisterModal";

// Simulamos las funciones de autenticación (Firebase o similares) que usa RegisterModal
// Suponemos que RegisterModal importa una función registerUser(fullname, username, email, password) de algún módulo (por ejemplo, ../firebase/auth)
vi.mock("../firebase/auth", () => ({
  registerUser: vi.fn().mockResolvedValue({ uid: "user-123" }),
}), { virtual: true });

describe("RegisterModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    // Limpiar llamadas anteriores al mock de registerUser
    const { registerUser } = require("../firebase/auth");
    beforeEach(() => {
    vi.clearAllMocks();
    registerUser.mockClear();
    });
    registerUser.mockClear();
  });

  it("renderiza el formulario de registro con campos y botón", () => {
    render(<RegisterModal onClose={mockOnClose} />);
    // Verificar campos de entrada presentes (fullname, username, email, password)
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    // Verificar botón de submit
    expect(screen.getByRole("button", { name: /registrarse/i })).toBeInTheDocument();
  });

  it("muestra error si se intenta registrar con campos vacíos y no llama a la función de registro", async () => {
    render(<RegisterModal onClose={mockOnClose} />);
    const submitBtn = screen.getByRole("button", { name: /registrarse/i });
    await userEvent.click(submitBtn);
    // No debería llamar a registerUser si faltan datos
    const { registerUser } = require("../firebase/auth");
    expect(registerUser).not.toHaveBeenCalled();
    // Debería mostrarse un mensaje de error en la interfaz
    expect(screen.getByText(/todos los campos son obligatorios/i)).toBeInTheDocument();
  });

  it("llama a la función de registro con los datos correctos y cierra el modal tras un registro exitoso", async () => {
    render(<RegisterModal onClose={mockOnClose} />);
    // Rellenar campos válidos
    await userEvent.type(screen.getByLabelText(/nombre completo/i), "Juan Pérez");
    await userEvent.type(screen.getByLabelText(/nombre de usuario/i), "juanp");
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "juan@example.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "secreta123");

    const submitBtn = screen.getByRole("button", { name: /registrarse/i });
    await userEvent.click(submitBtn);

    const { registerUser } = require("../firebase/auth");
    // Verificar que se llamó a la función de registro con los parámetros correctos
    expect(registerUser).toHaveBeenCalledWith(
      "Juan Pérez",
      "juanp",
      "juan@example.com",
      "secreta123"
    );
    // Simulamos que el registro fue exitoso (registerUser resuelve) y por tanto se cierra el modal
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("muestra mensaje de error si la función de registro falla (por ejemplo, usuario ya existe)", async () => {
    const { registerUser } = require("../firebase/auth");
    // Hacemos que la próxima llamada a registerUser simule un error
    registerUser.mockRejectedValueOnce(new Error("auth/email-already-in-use"));

    render(<RegisterModal onClose={mockOnClose} />);
    await userEvent.type(screen.getByLabelText(/nombre completo/i), "Ana Gómez");
    await userEvent.type(screen.getByLabelText(/nombre de usuario/i), "anita");
    await userEvent.type(screen.getByLabelText(/correo electrónico/i), "ana@example.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "password");

    const submitBtn = screen.getByRole("button", { name: /registrarse/i });
    await userEvent.click(submitBtn);

    // Si el registro falla, no debe llamarse onClose
    expect(mockOnClose).not.toHaveBeenCalled();
    // Debe mostrarse un mensaje de error adecuado al usuario
    expect(screen.getByText(/correo.*ya está en uso/i)).toBeInTheDocument();
  });
});
