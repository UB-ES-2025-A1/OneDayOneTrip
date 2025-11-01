import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "../styles/MasonryGrid.css";

interface MasonryItem {
  id: string;
  img: string;
  title: string;
  user: string;
  rating: number;
  temps: string;
  dificultat: string;
}

interface MasonryGridProps {
  items: MasonryItem[];
  openRegister?: () => void; 

}

export default function MasonryGrid({ items, openRegister }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const boxes = gsap.utils.toArray<HTMLElement>(".masonry-item");
    gsap.fromTo(
      boxes,
      { opacity: 0, y: 100, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
      }
    );
  }, [items]);
  const handleClick = () => {
  if (openRegister) {
    openRegister();
  }
};

  return (
    <div ref={containerRef} className="masonry-container">
        {items.map((item) => (
        <div key={item.id} className="masonry-item" onClick={handleClick}>
            <div
            className="masonry-image"
            style={{ backgroundImage: `url(${item.img})` }}
            ></div>
            <div className="masonry-info">
            <h3>{item.title}</h3>
            <div className="masonry-footer">
                <p>👤 {item.user}</p>
                <div className="masonry-meta">
                <span>⏱ {item.temps}</span>
                <span className="difficulty">{item.dificultat}</span>
                </div>
            </div>
            <p className="rating">⭐ {item.rating}</p>
            </div>
        </div>
        ))}
    </div>
);

}
