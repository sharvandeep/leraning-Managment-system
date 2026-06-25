import { createElement, useRef, useEffect, useCallback } from "react";
import { NavLink } from "react-router-dom";
import { brand } from "../../assets/brand";
import { ROLE_LABELS } from "../../utils/constants";
import styles from "./Sidebar.module.css";

export default function Sidebar({ role, items, isOpen }) {
  const sidebarRef = useRef(null);
  const glossRef = useRef(null);
  const mouseYRef = useRef(0);
  const currentYRef = useRef(0);
  const rafRef = useRef(null);

  // Smooth glossy follower animation
  const animateGloss = useCallback(() => {
    const ease = 0.08;
    currentYRef.current += (mouseYRef.current - currentYRef.current) * ease;

    if (glossRef.current) {
      glossRef.current.style.transform = `translateY(${currentYRef.current}px) translateX(-50%)`;
    }

    rafRef.current = requestAnimationFrame(animateGloss);
  }, []);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleMove = (e) => {
      const rect = sidebar.getBoundingClientRect();
      mouseYRef.current = e.clientY - rect.top - 120; // offset for centering
    };

    const handleEnter = () => {
      if (glossRef.current) glossRef.current.style.opacity = "1";
    };

    const handleLeave = () => {
      if (glossRef.current) glossRef.current.style.opacity = "0";
    };

    sidebar.addEventListener("mousemove", handleMove, { passive: true });
    sidebar.addEventListener("mouseenter", handleEnter);
    sidebar.addEventListener("mouseleave", handleLeave);

    rafRef.current = requestAnimationFrame(animateGloss);

    return () => {
      sidebar.removeEventListener("mousemove", handleMove);
      sidebar.removeEventListener("mouseenter", handleEnter);
      sidebar.removeEventListener("mouseleave", handleLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animateGloss]);

  return (
    <aside
      ref={sidebarRef}
      className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
    >
      {/* Floating glossy shield that follows mouse */}
      <div ref={glossRef} className={styles.glossShield} />
      {/* Top edge shine line */}
      <div className={styles.topShine} />

      <div className={styles.brand}>
        <span className={styles.logo}>LS</span>
        <span>
          {brand.name}
          <span className={styles.role}>{ROLE_LABELS[role]} Portal</span>
        </span>
      </div>
      <nav className={styles.nav} aria-label={`${ROLE_LABELS[role]} navigation`}>
        {items.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ""}`
            }
            key={item.to}
            to={item.to}
          >
            {createElement(item.icon, { size: 19 })}
            <span>{item.label}</span>
            {/* Glossy hover shimmer per link */}
            <span className={styles.linkShimmer} />
          </NavLink>
        ))}
      </nav>

      {/* Bottom decorative gradient bar */}
      <div className={styles.bottomGlow} />
    </aside>
  );
}
