vi.mock("../firebase/auth", () => {
  return {
    Auth: {
      login: vi.fn().mockResolvedValue({ uid: "user-abc" }),
      register: vi.fn(),
      logout: vi.fn(),
      onAuthChange: vi.fn(),
      getCurrentUser: vi.fn(),
    },
    auth: {},
  };
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import LoginModal from "../components/LoginModal";
import * as authApi from "../firebase/auth";

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <LoginModal onClose={() => {}} openRegister={() => {}} />
    </MemoryRouter>
  );

describe("LoginModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra el formulario de login con email y contraseña", () => {
    renderWithRouter();
    expect(screen.getByPlaceholderText(/correu electrònic/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contrasenya/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sessió/i })).toBeInTheDocument();
  });

  it("no intenta login si faltan datos", async () => {
    renderWithRouter();
    await userEvent.click(screen.getByRole("button", { name: /iniciar sessió/i }));
    expect(authApi.Auth.login).not.toHaveBeenCalled();
  });

  it("llama a login con credenciales correctas", async () => {
    renderWithRouter();
    await userEvent.type(screen.getByPlaceholderText(/correu electrònic/i), "juan@example.com");
    await userEvent.type(screen.getByPlaceholderText(/contrasenya/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sessió/i }));
    expect(authApi.Auth.login).toHaveBeenCalledWith("juan@example.com", "password123");
  });
});
