import { percent } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function ProgressBar({ value, label }) {
  return (
    <div>
      <div className={styles.progressRow}>
        <span>{label}</span>
        <strong>{percent(value)}</strong>
      </div>
      <div className={styles.progressTrack} aria-label={`${label} ${percent(value)}`}>
        <div className={styles.progressFill} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
