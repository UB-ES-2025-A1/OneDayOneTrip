import { useEffect, useState, useRef } from "react";
import "../styles/Carousel.css";
import { useTranslation } from 'react-i18next'; // Importa el hook

interface Slide {
    image: string;
    titleKey: string;
    subtitleKey: string;
}


const slides: Slide[] = [
    {
        image: "/images/pantalla_principal1.png",
        titleKey: "carousel_title_1",
        subtitleKey: "carousel_subtitle_1",
    },
    {
        image: "/images/paris.png",
        titleKey: "carousel_title_2",
        subtitleKey: "carousel_subtitle_2",
    },
    {
        image: "/images/londres.png",
        titleKey: "carousel_title_3",
        subtitleKey: "carousel_subtitle_3",
    }
];


export default function Carousel() {
  const { t } = useTranslation();
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

  // 📱 Swipe en dispositius tàctils
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
              <h2 className="carousel-title">{t(slide.titleKey)}</h2>
              <p className="carousel-subtitle">{t(slide.subtitleKey)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Botons de navegació */}
      <button className="carousel-btn prev" onClick={prevSlide}>
        ‹
      </button>
      <button className="carousel-btn next" onClick={nextSlide}>
        ›
      </button>

      {/* Indicadors inferiors */}
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
