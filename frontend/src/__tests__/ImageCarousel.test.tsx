// src/__tests__/ImageCarousel.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import ImageCarousel from "../components/ImageCarousel";

describe("ImageCarousel component", () => {
  const sampleImages = [
    "/images/test1.jpg",
    "/images/test2.jpg",
    "/images/test3.jpg",
  ];

  it("muestra la primera imagen por defecto", () => {
    render(<ImageCarousel images={sampleImages} />);
    const firstImage = screen.getByRole("img", { name: /slide 0/i });
    expect(firstImage).toBeInTheDocument();
    expect(firstImage).toHaveAttribute("src", expect.stringContaining("test1.jpg"));
  });

  it("renderiza todas las imágenes del carrusel", () => {
    render(<ImageCarousel images={sampleImages} />);
    // están con alt "Slide 0", "Slide 1", "Slide 2"
    expect(screen.getByRole("img", { name: /slide 0/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /slide 1/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /slide 2/i })).toBeInTheDocument();
  });
});
