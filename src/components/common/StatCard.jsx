import styles from "../../styles/ui.module.css";

export default function StatCard({ label, value, meta, icon: Icon }) {
  return (
    <article className={`${styles.statCard} floating-hover backlight`}>
      <div className={styles.statTop}>
        <p className={styles.statLabel}>{label}</p>
        {Icon && (
          <span className={styles.iconBox} aria-hidden="true">
            <Icon size={21} />
          </span>
        )}
      </div>
      <p className={styles.statValue}>{value}</p>
      {meta && <p className={styles.statMeta}>{meta}</p>}
    </article>
  );
}
