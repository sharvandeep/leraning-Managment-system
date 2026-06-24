import { Mail, MapPin, ShieldCheck, UserRound } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import ProgressBar from "../../components/common/ProgressBar";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import styles from "../../styles/ui.module.css";

export default function Profile() {
  const { user } = useAuth();
  const { courses, assignments, quizzes, grades } = useRoleData(user);
  const progress = courses.length
    ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)
    : 0;
  const average = grades.length
    ? Math.round(
        grades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 100, 0) /
          grades.length,
      )
    : 0;

  return (
    <section className={styles.page}>
      <PageHeader title="Profile" subtitle="Your academic profile drives automatic course mapping." />
      <section className={styles.profileHero}>
        <div className={styles.profileAvatar}>{user.avatar}</div>
        <div>
          <Badge>Student</Badge>
          <h1>{user.name}</h1>
          <p>{user.branch} - Semester {user.semester}</p>
        </div>
      </section>
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Personal Details</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.profileInfoList}>
              <p><UserRound size={18} /><span><strong>Name</strong>{user.name}</span></p>
              <p><Mail size={18} /><span><strong>Email</strong>{user.email}</span></p>
              <p><MapPin size={18} /><span><strong>Branch</strong>{user.branch}</span></p>
              <p><ShieldCheck size={18} /><span><strong>Semester</strong>{user.semester}</span></p>
            </div>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Academic Snapshot</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.activityList}>
              <ProgressBar label="Overall progress" value={progress} />
              <ProgressBar label="Grade average" value={average} />
            </div>
            <div className={styles.learningSummary}>
              <div><strong>{courses.length}</strong><span>Courses</span></div>
              <div><strong>{assignments.length}</strong><span>Assignments</span></div>
              <div><strong>{quizzes.length}</strong><span>Quizzes</span></div>
            </div>
          </div>
        </article>
      </div>
      <article className={styles.panel}>
        <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Mapped Courses</h2></div>
        <div className={styles.panelBody}>
          <div className={styles.courseProgressList}>
            {courses.map((course) => (
              <div className={styles.courseProgressCard} key={course.id}>
                <div>
                  <Badge>{course.code}</Badge>
                  <h3>{course.title}</h3>
                  <p>{course.teacherName}</p>
                </div>
                <ProgressBar label="Progress" value={course.progress} />
                <Badge variant="success">{course.completedLessons}/{course.lessons} lessons</Badge>
              </div>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}
