import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileUp,
  PenTool,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import ActivityItem from "../../components/cards/ActivityItem";
import Badge from "../../components/common/Badge";
import ProgressBar from "../../components/common/ProgressBar";
import StatCard from "../../components/common/StatCard";
import { activities } from "../../mock/activities";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import styles from "../../styles/ui.module.css";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const data = useRoleData(user);
  const [sessionMaterials] = useSessionState("lms-teacher-materials", []);
  const [sessionAssignments] = useSessionState("lms-teacher-assignments", []);
  const [sessionQuizzes] = useSessionState("lms-teacher-quizzes", []);

  if (data.loading) {
    return (
      <section className={`${styles.page} ${styles.teacherPage}`}>
        <p className={styles.muted}>Loading your teacher workspace...</p>
      </section>
    );
  }

  const courseIds = data.courses.map((course) => course.id);
  const createdAssignments = sessionAssignments.filter((item) =>
    courseIds.includes(item.courseId),
  );
  const createdQuizzes = sessionQuizzes.filter((item) => courseIds.includes(item.courseId));
  const createdMaterials = sessionMaterials.filter((item) =>
    courseIds.includes(item.courseId),
  );
  const assignments = [...data.assignments, ...createdAssignments];
  const quizzes = [...data.quizzes, ...createdQuizzes];
  const materialCount =
    data.courses.reduce((sum, course) => sum + course.materialsList.length, 0) +
    createdMaterials.length;
  const pendingGrading = assignments.reduce(
    (sum, item) => sum + Math.max((item.submissions || 0) - (item.graded || 0), 0),
    0,
  );
  const avgProgress = data.courses.length
    ? Math.round(
        data.courses.reduce((sum, course) => sum + course.progress, 0) /
          data.courses.length,
      )
    : 0;

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <section className={styles.teacherHero}>
        <div>
          <Badge variant="success">Teacher Workspace</Badge>
          <h1>Welcome, {user.name}</h1>
          <p>
            Manage delivery for {user.branch}. Courses are assigned by admin; materials,
            assignments, quizzes, and grading are controlled from this portal.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.button} to="/teacher/materials">
              Upload material <FileUp size={18} />
            </Link>
            <Link className={styles.buttonSecondary} to="/teacher/assignments">
              Create assignment <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <aside>
          <div className={styles.profileChip}>
            <span>{user.avatar}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.branch} faculty</small>
            </div>
          </div>
          <ProgressBar label="Assigned course progress" value={avgProgress} />
          <div className={styles.heroMetricGrid}>
            <div><strong>{assignments.length}</strong><span>Assignments</span></div>
            <div><strong>{quizzes.length}</strong><span>Quizzes</span></div>
          </div>
        </aside>
      </section>

      <div className={styles.grid4}>
        <StatCard label="Assigned Students" value={data.students.length} meta={`${user.branch} branch`} icon={UsersRound} />
        <StatCard label="Assigned Courses" value={data.courses.length} meta="Admin mapped" icon={BookOpen} />
        <StatCard label="Pending Grading" value={pendingGrading} meta="Submissions awaiting review" icon={ClipboardCheck} />
        <StatCard label="Materials" value={materialCount} meta="Teacher uploads" icon={FileUp} />
      </div>

      <div className={styles.teacherCommandGrid}>
        <Link to="/teacher/courses"><BookOpen size={22} /><strong>Assigned Courses</strong><span>Review admin-created course maps</span></Link>
        <Link to="/teacher/content"><ClipboardCheck size={22} /><strong>Course Content</strong><span>Inspect lessons and materials</span></Link>
        <Link to="/teacher/quizzes"><PenTool size={22} /><strong>Quiz Builder</strong><span>Create and review quiz results</span></Link>
      </div>

      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Recent Teacher Activity</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.activityList}>
              {activities.filter((item) => item.role === "teacher").map((activity) => <ActivityItem key={activity.id} activity={activity} />)}
              {createdMaterials.slice(-2).map((material) => (
                <ActivityItem
                  key={material.id}
                  activity={{
                    title: `Uploaded ${material.type}: ${material.title}`,
                    detail: material.courseTitle,
                    createdAt: "This session",
                  }}
                />
              ))}
            </div>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Grading Queue</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.deadlineList}>
              {assignments.map((assignment) => (
                <Link className={styles.deadlineItem} key={assignment.id} to="/teacher/assignments">
                  <strong>{assignment.title}</strong>
                  <small>{assignment.courseTitle} - {Math.max((assignment.submissions || 0) - (assignment.graded || 0), 0)} pending</small>
                </Link>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
