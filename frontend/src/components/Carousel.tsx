import { useEffect, useState, useRef } from "react";
import "../styles/Carousel.css";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    image: "/images/pantalla_principal1.png",
    title: "Tu próxima aventura te espera",
    subtitle:
      "Desde senderismo hasta gastronomía local, encuentra la experiencia perfecta para ti",
  },
  {
    image: "/images/paris.png",
    title: "Explora nuevas rutas y culturas",
    subtitle:
      "Viaja, descubre y comparte tus mejores experiencias con otros viajeros",
  },
  {
    image: "/images/londres.png",
    title: "Cada día, una historia que contar",
    subtitle: "Encuentra inspiración para tu próximo destino",
  },
];

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const slideRef = useRef<HTMLDivElement | null>(null);
  const totalSlides = slides.length;

  // ⏱ Auto-play
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 8000);
    return () => clearInterval(interval);
  }, [current]);

  const nextSlide = () => {
    setCurrent((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  // 📱 Swipe en dispositivos táctiles
  useEffect(() => {
    const node = slideRef.current;
    if (!node) return;

    let startX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) nextSlide();
      if (endX - startX > 50) prevSlide();
    };

    node.addEventListener("touchstart", handleTouchStart);
    node.addEventListener("touchend", handleTouchEnd);

    return () => {
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <section className="hero-carousel" ref={slideRef}>
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="carousel-slide"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="carousel-overlay"></div>
            <div className="carousel-content">
              <h2 className="carousel-title">{slide.title}</h2>
              <p className="carousel-subtitle">{slide.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Botones de navegación */}
      <button className="carousel-btn prev" onClick={prevSlide}>
        ‹
      </button>
      <button className="carousel-btn next" onClick={nextSlide}>
        ›
      </button>

      {/* Indicadores inferiores */}
      <div className="carousel-indicators">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === current ? "active" : ""}`}
            onClick={() => setCurrent(i)}
          ></span>
        ))}
      </div>
    </section>
  );
}
