import { createElement } from "react";
import { NavLink } from "react-router-dom";
import { brand } from "../../assets/brand";
import { ROLE_LABELS } from "../../utils/constants";
import styles from "./Sidebar.module.css";

export default function Sidebar({ role, items, isOpen }) {
  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
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
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
