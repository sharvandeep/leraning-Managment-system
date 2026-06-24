import styles from "../../styles/ui.module.css";

export default function ActivityItem({ activity }) {
  return (
    <div className={styles.activityItem}>
      <span className={styles.activityDot} />
      <div>
        <strong>{activity.title}</strong>
        <p className={styles.muted}>{activity.detail}</p>
        <small className={styles.muted}>{activity.createdAt}</small>
      </div>
    </div>
  );
}
