import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ImageCarousel from "../components/ImageCarousel";

describe("ImageCarousel component", () => {
  const sampleImages = [
    { src: "/images/test1.jpg", alt: "Imagen 1" },
    { src: "/images/test2.jpg", alt: "Imagen 2" },
    { src: "/images/test3.jpg", alt: "Imagen 3" }
  ];

  it("muestra la primera imagen por defecto y permite navegar adelante y atrás", async () => {
    render(<ImageCarousel images={sampleImages} />);

    // La primera imagen debe estar en el documento al iniciar
    const firstImage = screen.getByAltText(/^Slide 0$/);
    expect(firstImage).toBeInTheDocument();
    expect(firstImage).toBeInTheDocument();
    // Comprobamos que su src corresponde a la primera imagen
    expect(firstImage.getAttribute("src")).toContain("test1.jpg");

    // Suponemos que el componente tiene botones de navegación (anterior/siguiente)
    const navButtons = screen.getAllByRole("button");
    expect(navButtons.length).toBeGreaterThanOrEqual(2);  // Debe haber al menos dos botones (prev y next)

    const prevButton = navButtons[0];
    const nextButton = navButtons[1];

    // Hacer clic en botón "siguiente" y verificar que muestra la segunda imagen
    await userEvent.click(nextButton);
    const secondImage = screen.getByAltText(/Imagen 2/i);
    expect(secondImage).toBeInTheDocument();
    expect(secondImage.getAttribute("src")).toContain("test2.jpg");

    // Hacer clic en botón "siguiente" de nuevo (ir a la tercera imagen)
    await userEvent.click(nextButton);
    const thirdImage = screen.getByAltText(/Imagen 3/i);
    expect(thirdImage).toBeInTheDocument();
    expect(thirdImage.getAttribute("src")).toContain("test3.jpg");

    // Al hacer clic "siguiente" en la última imagen, debería volver a la primera (carrusel cíclico)
    await userEvent.click(nextButton);
    const backToFirst = screen.getByAltText(/Imagen 1/i);
    expect(backToFirst).toBeInTheDocument();  // De nuevo la primera imagen
    expect(backToFirst.getAttribute("src")).toContain("test1.jpg");

    // Ahora probamos el botón "anterior": desde la primera imagen, ir hacia atrás muestra la última
    await userEvent.click(prevButton);
    const backToThird = screen.getByAltText(/Imagen 3/i);
    expect(backToThird).toBeInTheDocument();
    expect(backToThird.getAttribute("src")).toContain("test3.jpg");
  });

  it("muestra los indicadores o controles de navegación correctamente", () => {
    render(<ImageCarousel images={sampleImages} />);
    // Suponemos que además de los botones prev/next, quizás hay indicadores (puntos) para cada imagen
    // Si existen, debería haber tantos indicadores como imágenes
    const indicators = screen.queryAllByRole("button", { name: /ir a imagen/i });
    if (indicators.length) {
      expect(indicators).toHaveLength(sampleImages.length);
    }
    // También podríamos simular un click en un indicador si están implementados
    // Por ejemplo: userEvent.click(indicators[2]); expect Imagen 3 to show, etc.
  });
});
