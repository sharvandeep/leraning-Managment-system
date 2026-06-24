import styles from "../../styles/ui.module.css";

const variants = {
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
};

export default function Badge({ children, variant }) {
  return <span className={`${styles.badge} ${variants[variant] || ""}`}>{children}</span>;
}
