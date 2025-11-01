import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "../styles/MasonryGrid.css";
import { type User } from "firebase/auth";


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
  openRegister: () => void;
  currentUser: User | null;
}

export default function MasonryGrid({ items, openRegister, currentUser }: MasonryGridProps) {
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
  const handleClick = (itemId: string) => {
  if (!currentUser) {
    openRegister();
  } else {
    console.log(`Usuari loguejat: clic a la ruta ${itemId}`);
  }
};

  return (
    <div ref={containerRef} className="masonry-container">
        {items.map((item) => (
        <div key={item.id} className="masonry-item" onClick={() => handleClick(item.id)}>
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
