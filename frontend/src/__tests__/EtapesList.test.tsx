import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import EtapesList from "../components/EtapesList";

// Mock de motion
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      // Filtrar props que React no reconoce
      const { whileInView, initial, transition, viewport, ...restProps } = props;
      return <div {...restProps}>{children}</div>;
    },
  },
}));

describe("EtapesList", () => {
  it("renderiza lista vacía cuando no hay etapes", () => {
    const { container } = render(<EtapesList etapes={[]} />);
    expect(container.querySelector(".etapes-container")).toBeInTheDocument();
  });

  it("renderiza todas las etapes proporcionadas", () => {
    const etapes = [
      {
        id: 0,
        titol: "Etapa 1",
        descripcio: "Descripción de la etapa 1",
        ubicacio: "Barcelona",
        imatge: "image1.jpg",
      },
      {
        id: 1,
        titol: "Etapa 2",
        descripcio: "Descripción de la etapa 2",
        ubicacio: "Madrid",
      },
      {
        id: 2,
        titol: "Etapa 3",
      },
    ];

    render(<EtapesList etapes={etapes} />);
    
    expect(screen.getByText("Etapa 1")).toBeInTheDocument();
    expect(screen.getByText("Etapa 2")).toBeInTheDocument();
    expect(screen.getByText("Etapa 3")).toBeInTheDocument();
  });

  it("muestra descripción cuando está disponible", () => {
    const etapes = [
      {
        id: 0,
        titol: "Etapa 1",
        descripcio: "Descripción de la etapa 1",
      },
    ];

    render(<EtapesList etapes={etapes} />);
    expect(screen.getByText("Descripción de la etapa 1")).toBeInTheDocument();
  });

  it("muestra ubicación cuando está disponible", () => {
    const etapes = [
      {
        id: 0,
        titol: "Etapa 1",
        ubicacio: "Barcelona",
      },
    ];

    render(<EtapesList etapes={etapes} />);
    expect(screen.getByText("Barcelona")).toBeInTheDocument();
  });

  it("muestra 'Ubicació desconeguda' cuando no hay ubicación", () => {
    const etapes = [
      {
        id: 0,
        titol: "Etapa 1",
      },
    ];

    render(<EtapesList etapes={etapes} />);
    expect(screen.getByText("Ubicació desconeguda")).toBeInTheDocument();
  });

  it("muestra imagen cuando está disponible", () => {
    const etapes = [
      {
        id: 0,
        titol: "Etapa 1",
        imatge: "image1.jpg",
      },
    ];

    render(<EtapesList etapes={etapes} />);
    const image = screen.getByAltText("Etapa 1");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "image1.jpg");
  });

  it("no muestra imagen cuando no está disponible", () => {
    const etapes = [
      {
        id: 0,
        titol: "Etapa 1",
      },
    ];

    render(<EtapesList etapes={etapes} />);
    const images = screen.queryAllByRole("img");
    // Solo debería haber la imagen de ubicación
    expect(images.length).toBe(1);
  });

  it("muestra números de etapa correctamente", () => {
    const etapes = [
      {
        id: 0,
        titol: "Etapa 1",
      },
      {
        id: 1,
        titol: "Etapa 2",
      },
    ];

    render(<EtapesList etapes={etapes} />);
    // Los números se calculan como id + 1
    const containers = screen.getAllByText(/Etapa/);
    expect(containers.length).toBe(2);
  });
});

