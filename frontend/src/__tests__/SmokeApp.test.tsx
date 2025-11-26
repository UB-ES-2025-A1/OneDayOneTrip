import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import Home from "../pages/Home";

describe("SmokeApp", () => {
  it("renderiza la página principal sin fallar", () => {
    const { getAllByRole } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const headings = getAllByRole("heading", { name: /OneDayOneTrip/i });
    expect(headings.length).toBeGreaterThan(0);
  });
});

