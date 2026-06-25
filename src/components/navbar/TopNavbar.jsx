import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, LogOut, Menu, Search, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { notificationService } from "../../services/notificationService";
import ui from "../../styles/ui.module.css";
import styles from "./TopNavbar.module.css";

export default function TopNavbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState([]);
  const [query, setQuery] = useState("");
  const [liveNotifications, setLiveNotifications] = useState([]);

  const notificationTarget =
    user.role === "student" ? "/student/notifications" : `/${user.role}/dashboard`;
  const profileTarget =
    user.role === "admin" ? "/admin/settings" : `/${user.role}/profile`;

  // Fetch real database-backed notifications whenever menu opens or user changes
  useEffect(() => {
    if (!user || !isNotificationsOpen) return;
    let active = true;
    notificationService.getNotifications()
      .then((data) => {
        if (active) {
          setLiveNotifications(data);
        }
      })
      .catch((err) => console.error("Failed to load notifications in TopNavbar", err));
    return () => {
      active = false;
    };
  }, [user, isNotificationsOpen]);

  // Also fetch initial unread count on mount
  useEffect(() => {
    if (!user) return;
    let active = true;
    notificationService.getNotifications()
      .then((data) => {
        if (active) {
          setLiveNotifications(data);
        }
      })
      .catch((err) => console.error("Failed to load notifications in TopNavbar mount", err));
    return () => {
      active = false;
    };
  }, [user]);

  const roleNotifications = useMemo(
    () =>
      liveNotifications
        .map((notification) => ({
          ...notification,
          unread: !notification.isRead && !readIds.includes(notification.id),
        })),
    [liveNotifications, readIds],
  );
  const unreadCount = roleNotifications.filter((notification) => notification.unread).length;

  const onSearch = (event) => {
    event.preventDefault();
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return;

    const routeMap = {
      student: normalizedQuery.includes("assignment")
        ? "/student/assignments"
        : normalizedQuery.includes("quiz")
          ? "/student/quizzes"
          : normalizedQuery.includes("grade")
            ? "/student/grades"
            : "/student/courses",
      teacher: normalizedQuery.includes("assignment")
        ? "/teacher/assignments"
        : normalizedQuery.includes("quiz")
          ? "/teacher/quizzes"
          : normalizedQuery.includes("performance")
            ? "/teacher/performance"
            : "/teacher/courses",
      admin: normalizedQuery.includes("user")
        ? "/admin/users"
        : normalizedQuery.includes("branch")
          ? "/admin/branches"
          : normalizedQuery.includes("semester")
            ? "/admin/semesters"
            : "/admin/courses",
    };

    navigate(routeMap[user.role]);
  };

  const openNotification = (notificationId) => {
    setReadIds((current) =>
      current.includes(notificationId) ? current : [...current, notificationId],
    );
    setIsNotificationsOpen(false);
    navigate(notificationTarget);
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          className={`${ui.iconButton} ${styles.menuButton}`}
          type="button"
          onClick={onMenuClick}
          title="Open navigation"
        >
          <Menu size={20} />
        </button>
        <form className={styles.search} onSubmit={onSearch}>
          <Search size={18} />
          <input
            placeholder="Search courses, users, assignments"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
      </div>
      <div className={styles.right}>
        <div className={styles.notificationWrap}>
          <button
            className={`${ui.iconButton} ${styles.bellButton}`}
            type="button"
            onClick={() => setIsNotificationsOpen((current) => !current)}
            title="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
          {isNotificationsOpen && (
            <div className={styles.notificationMenu}>
              <div className={styles.notificationHeader}>
                <strong>Notifications</strong>
                <button
                  type="button"
                  onClick={() => setReadIds(roleNotifications.map((item) => item.id))}
                >
                  <CheckCheck size={15} />
                  Mark read
                </button>
              </div>
              <div className={styles.notificationList}>
                {roleNotifications.length ? (
                  roleNotifications.map((notification) => (
                    <button
                      className={styles.notificationItem}
                      key={notification.id}
                      type="button"
                      onClick={() => openNotification(notification.id)}
                    >
                      <span className={notification.unread ? styles.unreadDot : styles.readDot} />
                      <span>
                        <strong>{notification.title}</strong>
                        <small>{notification.message}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className={styles.emptyState}>No notifications yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <Link className={styles.profile} to={profileTarget}>
          <span className={styles.avatar}>{user.avatar}</span>
          <span>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </span>
          <UserRound size={18} />
        </Link>
        <button className={ui.iconButton} type="button" onClick={logout} title="Log out">
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
