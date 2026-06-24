import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Gauge,
  GraduationCap,
  PenLine,
  Trophy,
} from "lucide-react";
import { Link } from "react-router-dom";
import ActivityItem from "../../components/cards/ActivityItem";
import Badge from "../../components/common/Badge";
import ProgressBar from "../../components/common/ProgressBar";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { activities } from "../../mock/activities";
import { notifications } from "../../mock/notifications";
import { formatDate } from "../../utils/formatters";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import styles from "../../styles/ui.module.css";

export default function StudentDashboard() {
  const { user } = useAuth();
  const data = useRoleData(user);

  if (data.loading) {
    return <PageHeader title="Loading..." subtitle="Loading your student portal..." />;
  }

  const mappedCourseIds = data.courses.map((course) => course.id);
  const pendingAssignments = data.assignments.filter(
    (item) => item.status === "Pending",
  );
  const activeQuizzes = data.quizzes.filter((item) =>
    ["Open", "Scheduled"].includes(item.status),
  );
  const overallProgress = data.courses.length
    ? Math.round(
        data.courses.reduce((sum, course) => sum + course.progress, 0) /
          data.courses.length,
      )
    : 0;
  const averageGrade = data.grades.length
    ? Math.round(
        data.grades.reduce(
          (sum, grade) => sum + (grade.score / grade.maxScore) * 100,
          0,
        ) / data.grades.length,
      )
    : 0;
  const upcomingAssignments = [...data.assignments].sort(
    (left, right) => new Date(left.dueDate) - new Date(right.dueDate),
  );
  const nextCourse = [...data.courses].sort(
    (left, right) => right.progress - left.progress,
  )[0];
  const studentActivities = activities.filter((item) => item.role === "student");
  const studentNotifications = notifications.filter((item) => item.role === "student");

  return (
    <section className={`${styles.page} ${styles.studentDashboard}`}>
      <section className={styles.studentHero}>
        <div className={styles.studentHeroContent}>
          <Badge variant="success">Student Portal</Badge>
          <h1>Good to see you, {user.name}</h1>
          <p>
            Your active learning plan is mapped from {user.branch}, semester{" "}
            {user.semester}. No manual enrollment is needed.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.button} to="/student/courses">
              Continue learning <ArrowRight size={18} />
            </Link>
            <Link className={styles.buttonSecondary} to="/student/assignments">
              View assignments
            </Link>
          </div>
        </div>
        <aside className={styles.studentHeroPanel}>
          <div className={styles.profileChip}>
            <span>{user.avatar}</span>
            <div>
              <strong>{user.name}</strong>
              <small>
                {user.branch} - Semester {user.semester}
              </small>
            </div>
          </div>
          <ProgressBar label="Overall progress" value={overallProgress} />
          <div className={styles.heroMetricGrid}>
            <div>
              <strong>{mappedCourseIds.length}</strong>
              <span>Mapped courses</span>
            </div>
            <div>
              <strong>{averageGrade}%</strong>
              <span>Grade average</span>
            </div>
          </div>
        </aside>
      </section>

      <div className={styles.grid4}>
        <StatCard
          label="Assigned Courses"
          value={data.courses.length}
          meta={`${user.branch}, semester ${user.semester}`}
          icon={BookOpen}
        />
        <StatCard
          label="Pending Assignments"
          value={pendingAssignments.length}
          meta={`${data.assignments.length} total assigned`}
          icon={ClipboardList}
        />
        <StatCard
          label="Active Quizzes"
          value={activeQuizzes.length}
          meta={`${data.quizzes.length} quizzes mapped`}
          icon={PenLine}
        />
        <StatCard
          label="Overall Progress"
          value={`${overallProgress}%`}
          meta={`${averageGrade}% grade average`}
          icon={Gauge}
        />
      </div>

      <div className={styles.dashboardSplit}>
        <Panel
          title="Mapped Course Progress"
          action={<Link to="/student/courses">View all</Link>}
        >
          <div className={styles.courseProgressList}>
            {data.courses.map((course) => (
              <article className={styles.courseProgressCard} key={course.id}>
                <div>
                  <Badge>{course.code}</Badge>
                  <h3>{course.title}</h3>
                  <p>{course.teacherName}</p>
                </div>
                <ProgressBar label="Progress" value={course.progress} />
                <Link className={styles.buttonSecondary} to={`/student/courses/${course.id}`}>
                  Open course
                </Link>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="Today's Focus"
          action={<Link to="/student/quizzes">Quiz center</Link>}
        >
          <div className={styles.focusCard}>
            <span className={styles.iconBox}>
              <GraduationCap size={22} />
            </span>
            <div>
              <strong>{nextCourse?.title || "No mapped course"}</strong>
              <p>
                Best next step based on highest active progress and current mapped
                courses.
              </p>
            </div>
            {nextCourse && (
              <Link className={styles.button} to={`/student/courses/${nextCourse.id}`}>
                Resume
              </Link>
            )}
          </div>
          <div className={styles.quickActions}>
            <Link to="/student/assignments">
              <ClipboardList size={18} />
              Assignments
            </Link>
            <Link to="/student/quizzes">
              <PenLine size={18} />
              Quizzes
            </Link>
            <Link to="/student/grades">
              <Trophy size={18} />
              Grades
            </Link>
          </div>
        </Panel>
      </div>

      <div className={styles.grid3}>
        <Panel title="Upcoming Work" action={<Link to="/student/assignments">Open</Link>}>
          <div className={styles.deadlineList}>
            {upcomingAssignments.map((assignment) => (
              <Link
                className={styles.deadlineItem}
                key={assignment.id}
                to="/student/assignments"
              >
                <span className={styles.deadlineDate}>
                  <CalendarClock size={18} />
                  {formatDate(assignment.dueDate)}
                </span>
                <strong>{assignment.title}</strong>
                <small>
                  {assignment.status} - {assignment.maxMarks} marks
                </small>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Announcements" action={<Link to="/student/notifications">All</Link>}>
          <div className={styles.activityList}>
            {studentNotifications.map((item) => (
              <ActivityItem
                key={item.id}
                activity={{
                  title: item.title,
                  detail: item.message,
                  createdAt: item.createdAt,
                }}
              />
            ))}
          </div>
        </Panel>
        <Panel title="Recent Activities">
          <div className={styles.activityList}>
            {studentActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Learning Analytics" action={<Link to="/student/grades">Review grades</Link>}>
        <div className={styles.analyticsGrid}>
          {data.courses.map((course) => (
            <div className={styles.analyticsBar} key={course.id}>
              <span>{course.code}</span>
              <div>
                <i style={{ height: `${Math.max(course.progress, 12)}%` }} />
              </div>
              <strong>{course.progress}%</strong>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Panel({ title, action, children }) {
  return (
    <article className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{title}</h2>
        {action && <div className={styles.panelAction}>{action}</div>}
      </div>
      <div className={styles.panelBody}>{children}</div>
    </article>
  );
}
