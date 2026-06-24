import { BookOpen, ClipboardCheck, FileUp, Mail, MapPin, PenTool, ShieldCheck, UserRound } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import styles from "../../styles/ui.module.css";

export default function Profile() {
  const { user } = useAuth();
  const { courses, students, assignments, quizzes } = useRoleData(user);
  const [materials] = useSessionState("lms-teacher-materials", []);
  const sessionMaterials = materials.filter((material) =>
    courses.some((course) => course.id === material.courseId),
  );

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader title="Profile" subtitle="Teacher profile, branch assignment, and delivery permissions." />
      <section className={styles.profileHero}>
        <div className={styles.profileAvatar}>{user.avatar}</div>
        <div>
          <Badge>Teacher</Badge>
          <h1>{user.name}</h1>
          <p>{user.branch} faculty</p>
        </div>
      </section>
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Teacher Details</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.profileInfoList}>
              <p><UserRound size={18} /><span><strong>Name</strong>{user.name}</span></p>
              <p><Mail size={18} /><span><strong>Email</strong>{user.email}</span></p>
              <p><MapPin size={18} /><span><strong>Branch</strong>{user.branch}</span></p>
              <p><ShieldCheck size={18} /><span><strong>Permissions</strong>Materials, assignments, quizzes, grading</span></p>
            </div>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Workspace Summary</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.teacherCommandGrid}>
              <div><BookOpen size={22} /><strong>{courses.length}</strong><span>Courses</span></div>
              <div><UserRound size={22} /><strong>{students.length}</strong><span>Students</span></div>
              <div><FileUp size={22} /><strong>{sessionMaterials.length}</strong><span>Session uploads</span></div>
            </div>
          </div>
        </article>
      </div>
      <div className={styles.teacherCommandGrid}>
        <div><ClipboardCheck size={22} /><strong>{assignments.length}</strong><span>Assignments mapped</span></div>
        <div><PenTool size={22} /><strong>{quizzes.length}</strong><span>Quizzes mapped</span></div>
        <div><ShieldCheck size={22} /><strong>Admin</strong><span>Courses are admin-controlled</span></div>
      </div>
    </section>
  );
}
