import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import ResetPasswordModal from "../components/ResetPasswordModal";

// Mock de Auth usando vi.hoisted
const { mockResetPassword } = vi.hoisted(() => ({
  mockResetPassword: vi.fn(),
}));

vi.mock("../firebase/auth", () => ({
  Auth: {
    resetPassword: mockResetPassword,
  },
}));

describe("ResetPasswordModal", () => {
  const mockOnClose = vi.fn();
  const mockOpenLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el modal correctamente", () => {
    render(<ResetPasswordModal onClose={mockOnClose} openLogin={mockOpenLogin} />);
    
    // El mock de i18n devuelve las claves de traducción
    expect(screen.getByText("reset_password_title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("login_email")).toBeInTheDocument();
    expect(screen.getByText("reset_password_send_link")).toBeInTheDocument();
  });

  it("llama a resetPassword con el email correcto", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    
    render(<ResetPasswordModal onClose={mockOnClose} openLogin={mockOpenLogin} />);
    
    const emailInput = screen.getByPlaceholderText("login_email");
    await user.type(emailInput, "test@example.com");
    
    const submitButton = screen.getByText("reset_password_send_link");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("test@example.com");
    });
  });

  it("muestra mensaje de éxito cuando se envía correctamente", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue(undefined);
    
    render(<ResetPasswordModal onClose={mockOnClose} openLogin={mockOpenLogin} />);
    
    const emailInput = screen.getByPlaceholderText("login_email");
    await user.type(emailInput, "test@example.com");
    
    const submitButton = screen.getByText("reset_password_send_link");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/reset_password_sent_message/i)).toBeInTheDocument();
    });
  });

  it("muestra error cuando resetPassword falla", async () => {
    const user = userEvent.setup();
    mockResetPassword.mockRejectedValue(new Error("Email no encontrado"));
    
    render(<ResetPasswordModal onClose={mockOnClose} openLogin={mockOpenLogin} />);
    
    const emailInput = screen.getByPlaceholderText("login_email");
    await user.type(emailInput, "test@example.com");
    
    const submitButton = screen.getByText("reset_password_send_link");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Error: Email no encontrado/i)).toBeInTheDocument();
    });
  });

  it("muestra estado de loading durante el envío", async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    mockResetPassword.mockReturnValue(promise);
    
    render(<ResetPasswordModal onClose={mockOnClose} openLogin={mockOpenLogin} />);
    
    const emailInput = screen.getByPlaceholderText("login_email");
    await user.type(emailInput, "test@example.com");
    
    const submitButton = screen.getByText("reset_password_send_link");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("general_sending")).toBeInTheDocument();
    });

    resolvePromise!();
  });

  it("llama a onClose cuando se hace clic en el botón de cerrar", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordModal onClose={mockOnClose} openLogin={mockOpenLogin} />);
    
    const closeButton = screen.getByRole("button", { name: /×/ });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("llama a openLogin cuando se hace clic en 'Tornar al login'", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordModal onClose={mockOnClose} openLogin={mockOpenLogin} />);
    
    const backButton = screen.getByText("reset_password_back_to_login");
    await user.click(backButton);

    expect(mockOpenLogin).toHaveBeenCalledTimes(1);
  });
});
