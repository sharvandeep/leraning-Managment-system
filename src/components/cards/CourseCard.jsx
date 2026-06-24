import { BookOpen, FileText } from "lucide-react";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import styles from "../../styles/ui.module.css";

export default function CourseCard({ course, action }) {
  return (
    <article className={styles.courseCard}>
      <div>
        <div className={styles.courseMeta}>
          <Badge>{course.code}</Badge>
          <Badge>{course.branch}</Badge>
          {course.semester && <Badge>Semester {course.semester}</Badge>}
        </div>
        <h3>{course.title}</h3>
        <p className={styles.muted}>{course.description}</p>
      </div>
      <ProgressBar label="Course progress" value={course.progress} />
      <div className={styles.courseMeta}>
        <Badge variant="success">
          <BookOpen size={14} /> {course.lessons} lessons
        </Badge>
        <Badge variant="warning">
          <FileText size={14} /> {course.materials} materials
        </Badge>
      </div>
      {action}
    </article>
  );
}
