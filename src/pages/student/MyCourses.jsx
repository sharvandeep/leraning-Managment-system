import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock, FileText } from "lucide-react";
import CourseCard from "../../components/cards/CourseCard";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import styles from "../../styles/ui.module.css";

export default function MyCourses() {
  const { user } = useAuth();
  const { courses } = useRoleData(user);

  return (
    <section className={styles.page}>
      <PageHeader
        title="My Courses"
        subtitle={`Courses mapped automatically for ${user.branch}, semester ${user.semester}. Lessons are created by admin and materials are uploaded by teachers.`}
      />
      <div className={styles.learningSummary}>
        <div>
          <strong>{courses.length}</strong>
          <span>Mapped courses</span>
        </div>
        <div>
          <strong>{courses.reduce((sum, course) => sum + course.completedLessons, 0)}</strong>
          <span>Lessons completed</span>
        </div>
        <div>
          <strong>{courses.reduce((sum, course) => sum + course.materialsList.length, 0)}</strong>
          <span>Teacher materials</span>
        </div>
      </div>
      <div className={styles.grid3}>
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            action={
              <div className={styles.courseActionStack}>
                <div className={styles.courseMeta}>
                  <Badge variant="success">
                    <BookOpen size={14} /> {course.completedLessons}/{course.lessons} lessons
                  </Badge>
                  <Badge variant="warning">
                    <Clock size={14} /> {course.totalHours} hrs
                  </Badge>
                  <Badge>
                    <FileText size={14} /> {course.materialsList.length} files
                  </Badge>
                </div>
                <Link className={styles.button} to={`/student/courses/${course.id}`}>
                  Open course <ArrowRight size={17} />
                </Link>
              </div>
            }
          />
        ))}
      </div>
    </section>
  );
}
