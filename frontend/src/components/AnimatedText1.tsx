import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function AnimatedText1({ text, className="", delay = 0.03 }: AnimatedTextProps) {
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const chars = el.textContent?.split("") ?? [];
    el.textContent = "";

    chars.forEach((char) => {
      const span = document.createElement("span");
      span.textContent = char;
      el.appendChild(span);
    });

    const spans = Array.from(el.querySelectorAll("span"));

    gsap.fromTo(
      spans,
      { opacity: 0, y: 40 },
      {
        opacity: 0.7,
        y: 0,
        duration: 0.75,         
        ease: "power3.out",
        stagger: delay,
      }
    );
  }, [text, delay]);

  return <h2 ref={textRef} className={className}>{text}</h2>;
}
