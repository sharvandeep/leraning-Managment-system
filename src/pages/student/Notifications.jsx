import { BellRing, BookOpen, CheckCheck } from "lucide-react";
import { useState } from "react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import { notifications } from "../../mock/notifications";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function Notifications() {
  const [readIds, setReadIds] = useState([]);
  const rows = notifications
    .filter((item) => item.role === "student")
    .map((item) => ({ ...item, unread: item.unread && !readIds.includes(item.id) }))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  const unreadCount = rows.filter((item) => item.unread).length;

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
        <div><strong>{new Set(rows.map((row) => row.courseId)).size}</strong><span>Courses updated</span></div>
      </div>
      <div className={styles.notificationTimeline}>
        {rows.map((item) => (
          <article key={item.id} className={styles.notificationCard}>
            <span className={styles.iconBox}>
              {item.source === "Teacher" ? <BellRing size={19} /> : <BookOpen size={19} />}
            </span>
            <div>
              <Badge variant={item.unread ? "warning" : "success"}>{item.unread ? "Unread" : "Read"}</Badge>
              <h3>{item.title}</h3>
              <p className={styles.muted}>{item.message}</p>
              <small>{item.courseTitle} - {item.createdBy} - {formatDate(item.createdAt)}</small>
            </div>
            <button className={styles.buttonSecondary} type="button" onClick={() => setReadIds((current) => [...new Set([...current, item.id])])}>
              Mark read
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
