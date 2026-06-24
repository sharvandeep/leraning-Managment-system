import { BookOpen, ClipboardList, GraduationCap, UsersRound } from "lucide-react";
import ActivityItem from "../../components/cards/ActivityItem";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { activities } from "../../mock/activities";
import { assignments } from "../../mock/assignments";
import { courses } from "../../mock/courses";
import { users } from "../../mock/users";
import styles from "../../styles/ui.module.css";

export default function AdminDashboard() {
  const students = users.filter((user) => user.role === "student");
  const teachers = users.filter((user) => user.role === "teacher");

  return (
    <section className={styles.page}>
      <PageHeader eyebrow="Admin Dashboard" title="Institution Control Center" subtitle="Manage users, courses, branches, semesters, and platform configuration." />
      <div className={styles.grid4}>
        <StatCard label="Total Students" value={students.length} meta="Registered learners" icon={GraduationCap} />
        <StatCard label="Total Teachers" value={teachers.length} meta="Active faculty" icon={UsersRound} />
        <StatCard label="Total Courses" value={courses.length} meta="Admin-created courses" icon={BookOpen} />
        <StatCard label="Total Assignments" value={assignments.length} meta="Across all courses" icon={ClipboardList} />
      </div>
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Administrative Activity</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.activityList}>
              {activities.filter((item) => item.role === "admin").map((activity) => <ActivityItem key={activity.id} activity={activity} />)}
            </div>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelBody}>
            <div className={styles.chartPlaceholder}>Enrollment and course distribution chart placeholder</div>
          </div>
        </article>
      </div>
    </section>
  );
}
