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
    // Inputs con labels flotantes: verificamos que exista al menos el de email
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /header_start_session/i })).toBeInTheDocument();
  });

  it("no intenta login si faltan datos", async () => {
    renderWithRouter();
    await userEvent.click(screen.getByRole("button", { name: /header_start_session/i }));
    expect(authApi.Auth.login).not.toHaveBeenCalled();
  });

  it("llama a login con credenciales correctas", async () => {
    renderWithRouter();
    const inputs = screen.getAllByRole("textbox");
    await userEvent.type(inputs[0], "juan@example.com");
    const password = document.querySelector('input[type="password"]') as HTMLInputElement;
    await userEvent.type(password, "password123");
    await userEvent.click(screen.getByRole("button", { name: /header_start_session/i }));
    expect(authApi.Auth.login).toHaveBeenCalledWith("juan@example.com", "password123");
  });
});
