import { ArrowRight, BookOpen, FileText, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import CourseCard from "../../components/cards/CourseCard";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import styles from "../../styles/ui.module.css";

export default function AssignedCourses() {
  const { user } = useAuth();
  const { courses, students, assignments, quizzes } = useRoleData(user);
  const [sessionMaterials] = useSessionState("lms-teacher-materials", []);

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Assigned Courses"
        subtitle="Admin controls course creation and assignment. Teachers manage delivery for these mapped courses."
      />
      <div className={styles.learningSummary}>
        <div><strong>{courses.length}</strong><span>Assigned courses</span></div>
        <div><strong>{students.length}</strong><span>Mapped students</span></div>
        <div><strong>{assignments.length + quizzes.length}</strong><span>Assessments</span></div>
      </div>
      <div className={styles.grid3}>
        {courses.map((course) => {
          const extraMaterials = sessionMaterials.filter((item) => item.courseId === course.id);
          return (
            <CourseCard
              key={course.id}
              course={{ ...course, materials: course.materialsList.length + extraMaterials.length }}
              action={
                <div className={styles.courseActionStack}>
                  <div className={styles.courseMeta}>
                    <Badge variant="success"><UsersRound size={14} /> {students.length} students</Badge>
                    <Badge><BookOpen size={14} /> {course.lessons} admin lessons</Badge>
                    <Badge variant="warning"><FileText size={14} /> {course.materialsList.length + extraMaterials.length} materials</Badge>
                  </div>
                  <div className={styles.heroActions}>
                    <Link className={styles.button} to="/teacher/content">
                      Manage content <ArrowRight size={17} />
                    </Link>
                    <Link className={styles.buttonSecondary} to="/teacher/materials">
                      Upload material
                    </Link>
                  </div>
                </div>
              }
            />
          );
        })}
      </div>
    </section>
  );
}
