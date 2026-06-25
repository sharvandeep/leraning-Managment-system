import { BellRing, BookOpen, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import { notificationService } from "../../services/notificationService";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function Notifications() {
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService.getNotifications("student")
      .then((data) => {
        setLiveNotifications(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load notifications", err);
        setLoading(false);
      });
  }, []);

  const rows = liveNotifications
    .map((item) => ({ ...item, unread: !item.isRead && !readIds.includes(item.id) }))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  const unreadCount = rows.filter((item) => item.unread).length;

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Fetching notifications..." />;
  }

  return (
    <section className={styles.page}>
      <PageHeader
        title="Notifications"
        subtitle="Teacher updates for your mapped courses, including materials, quiz openings, deadlines, and published grades."
        action={
          <button className={styles.buttonSecondary} type="button" onClick={() => setReadIds(rows.map((item) => item.id))}>
            <CheckCheck size={17} /> Mark all read
          </button>
        }
      />
      <div className={styles.learningSummary}>
        <div><strong>{rows.length}</strong><span>Total updates</span></div>
        <div><strong>{unreadCount}</strong><span>Unread</span></div>
        <div><strong>{rows.length > 0 ? 1 : 0}</strong><span>Courses updated</span></div>
      </div>
      <div className={styles.notificationTimeline}>
        {rows.map((item) => (
          <article key={item.id} className={styles.notificationCard}>
            <span className={styles.iconBox}>
              <BellRing size={19} />
            </span>
            <div>
              <Badge variant={item.unread ? "warning" : "success"}>{item.unread ? "Unread" : "Read"}</Badge>
              <h3>{item.title}</h3>
              <p className={styles.muted}>{item.message}</p>
              <small>{formatDate(item.createdAt)}</small>
            </div>
            <button className={styles.buttonSecondary} type="button" onClick={() => setReadIds((current) => [...new Set([...current, item.id])])}>
              Mark read
            </button>
          </article>
        ))}
        {rows.length === 0 && <p className={styles.muted}>No notifications available.</p>}
      </div>
    </section>
  );
}
