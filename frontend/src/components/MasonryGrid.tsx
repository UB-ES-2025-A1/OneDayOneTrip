import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "../styles/MasonryGrid.css";
import { type User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import ButtonNewTrip from "./ButtonNewTrip";
import {MapPin, Trash2} from "lucide-react";

interface MasonryItem {
  id: string;
  img: string;
  title: string;
  user: string;
  rating: number;
  temps: string;
  dificultat: string;
  authorPic?: string;
  city?: string;
  country?: string;
}

interface MasonryGridProps {
  items: MasonryItem[];
  openRegister: () => void;
  currentUser: User | null;
  showCreateButton?: boolean;
  onCreateTripClick?: () => void; 
  showDeleteIcon?: boolean;
  onDeleteTrip?: (id: string) => void; 
}




export default function MasonryGrid({
  items,
  openRegister,
  currentUser,
  showCreateButton,
  onCreateTripClick,
  showDeleteIcon,
  onDeleteTrip,
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const boxes = gsap.utils.toArray<HTMLElement>(".masonry-item");
    gsap.fromTo(
      boxes,
      { opacity: 0, y: 80, filter: "blur(10px)" },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0)",
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
      }
    );
  }, [items]);

  const handleClick = (itemId: string) => {
    if (!currentUser) {
      openRegister();
    } else {
      navigate(`/ruta/${itemId}`);
    }
  };

  return (
    <div ref={containerRef} className="masonry-container">
        {showCreateButton && (
          <ButtonNewTrip
            onClick={() => {
              if (!currentUser) {
                openRegister();
              } else if (onCreateTripClick) {
                onCreateTripClick();
              }
            }}
          />
        )}
      {items.map((item) => (
        <div
          key={item.id}
          className="masonry-item"
          onClick={() => handleClick(item.id)}
        >
          <div
            className="masonry-image"
            style={{ backgroundImage: `url(${item.img})` }}
          >
            <div className="overlay">

              {showDeleteIcon && onDeleteTrip && (
                <button
                  className="masonry-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // no navegar a la ruta
                    onDeleteTrip(item.id);
                  }}
                  aria-label="Eliminar ruta"
                >
                  <Trash2 size={22} />
                </button>
              )}
              <h3 className="masonry-title">{item.title}</h3>

              
              <div className="stars-block">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`star ${
                      i < Math.round(item.rating ?? 0) ? "filled" : ""
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="rating-value">
                  {item.rating > 0 ? item.rating.toFixed(1) : "—"}
                </span>
              </div>

            </div>
          </div>

          <div className="masonry-info">
            <div className="meta">
              <div className="meta-author">
                {item.authorPic ? (
                  <img
                    src={item.authorPic}
                    alt={item.user}
                    className="meta-avatar"
                  />
                ) : (
                  <img
                    src="/images/person.png"
                    alt="Autor"
                    className="meta-avatar default"
                  />
                )}
                <span>{item.user}</span>
              </div>

              <div className="meta-location">
                  <MapPin className="meta-icon" size={16} />                
                <span>
                  {item.city
                    ? `${item.city}${item.country ? `, ${item.country}` : ""}`
                    : ""}
                </span>
              </div>
            </div>

            <div className="masonry-footer">
              <span>⏱ {item.temps}</span>
              <span className="difficulty">{item.dificultat}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
