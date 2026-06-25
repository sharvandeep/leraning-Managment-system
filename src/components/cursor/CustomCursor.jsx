import { useEffect, useRef, useCallback } from "react";
import "./CustomCursor.css";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const posRef = useRef({ x: -100, y: -100 });
  const targetRef = useRef({ x: -100, y: -100 });
  const scaleRef = useRef({ w: 0, h: 0, active: false });
  const rafRef = useRef(null);
  const hoveredRef = useRef(null);

  const animate = useCallback(() => {
    const ease = 0.15;
    const p = posRef.current;
    const t = targetRef.current;

    p.x += (t.x - p.x) * ease;
    p.y += (t.y - p.y) * ease;

    if (cursorRef.current) {
      const s = scaleRef.current;
      if (s.active) {
        cursorRef.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
        cursorRef.current.style.setProperty("--box-w", `${s.w}px`);
        cursorRef.current.style.setProperty("--box-h", `${s.h}px`);
        cursorRef.current.classList.add("is-hover");
      } else {
        cursorRef.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
        cursorRef.current.style.setProperty("--box-w", "36px");
        cursorRef.current.style.setProperty("--box-h", "36px");
        cursorRef.current.classList.remove("is-hover");
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("custom-cursor-active");

    const onMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e) => {
      const el = e.target.closest(
        "a, button, [role='button'], input[type='submit'], .clickable, select, label[for], [class*='link'], [class*='button'], [class*='Button']"
      );
      if (el && el !== hoveredRef.current) {
        hoveredRef.current = el;
        const r = el.getBoundingClientRect();
        scaleRef.current = { w: r.width + 16, h: r.height + 16, active: true };
      } else if (!el && hoveredRef.current) {
        hoveredRef.current = null;
        scaleRef.current = { w: 0, h: 0, active: false };
      }
    };

    const onLeave = () => {
      posRef.current = { x: -100, y: -100 };
      targetRef.current = { x: -100, y: -100 };
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  return (
    <div ref={cursorRef} className="cursor-root">
      {/* The dot — stays perfectly centered */}
      <div className="cursor-dot" />
      {/* The square — rotates around the dot */}
      <div className="cursor-square" />
    </div>
  );
}
