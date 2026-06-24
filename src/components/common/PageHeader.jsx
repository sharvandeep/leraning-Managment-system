import styles from "../../styles/ui.module.css";

export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <header className={styles.pageHeader}>
      <div>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
