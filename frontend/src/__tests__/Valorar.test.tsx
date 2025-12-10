import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Valorar from "../components/Valorar";

describe("Valorar component", () => {
  it("habilita el envío tras seleccionar una estrella y notifica al padre", async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(<Valorar tripId="t1" onClose={onClose} onSubmit={onSubmit} />);

    // El texto del botón será la clave i18n ya que el mock devuelve la clave
    const submitButton = screen.getByRole("button", { name: /rate_modal_submit/i });
    expect(submitButton).toBeDisabled();

    const thirdStar = screen.getByDisplayValue("3");
    await userEvent.click(thirdStar);
    expect(submitButton).toBeEnabled();

    await userEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(3);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

