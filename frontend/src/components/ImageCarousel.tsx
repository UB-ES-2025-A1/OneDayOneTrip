import React, { useState, useEffect, useRef } from "react";

interface ImageCarouselProps {
  images: string[];
  interval?: number; // tiempo entre imágenes en ms
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, interval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const slides = [...images, images[0]];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
      setTransitioning(true);
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  const handleTransitionEnd = () => {
    if (currentIndex === slides.length - 1) {
      setTransitioning(false); 
      setCurrentIndex(0);      
    }
  };

  return (
    <div className="carousel-container" style={{ overflow: "hidden", position: "relative" }}>
      <div
        ref={trackRef}
        className="carousel-track"
        style={{
          display: "flex",
          transition: transitioning ? "transform 2s ease" : "none",
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {slides.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index}`}
            style={{ width: "100%", flexShrink: 0 }}
          />
        ))}
      </div>

      {/* Dots de navegación */}
      <div className="carousel-dots" style={{ textAlign: "center", marginTop: "8px" }}>
        {images.map((_, index) => (
          <span
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setTransitioning(true);
            }}
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              margin: "0 4px",
              background: currentIndex % images.length === index ? "black" : "#ccc",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
