import { Award, ClipboardList, GraduationCap, TrendingUp } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import ProgressBar from "../../components/common/ProgressBar";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import styles from "../../styles/ui.module.css";

export default function StudentPerformance() {
  const { user } = useAuth();
  const { students, courses, assignments, quizzes, grades, loading } = useRoleData(user);
  const [selectedStudentId, setSelectedStudentId] = useSessionState(
    "lms-teacher-selected-student",
    students[0]?.id || "",
  );
  const selectedStudent = students.find((student) => student.id === selectedStudentId) || students[0];

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Calculating performance statistics..." />;
  }


  const performanceRows = students.map((student) => {
    const studentCourses = courses.filter(
      (course) => course.branch === student.branch && course.semester === student.semester,
    );
    const courseIds = studentCourses.map((course) => course.id);
    const studentAssignments = assignments.filter((assignment) =>
      courseIds.includes(assignment.courseId),
    );
    const studentQuizzes = quizzes.filter((quiz) => courseIds.includes(quiz.courseId));
    const studentGrades = grades.filter((grade) => courseIds.includes(grade.courseId));
    const progress = studentCourses.length
      ? Math.round(
          studentCourses.reduce((sum, course) => sum + course.progress, 0) /
            studentCourses.length,
        )
      : 0;
    const average = studentGrades.length
      ? Math.round(
          studentGrades.reduce(
            (sum, grade) => sum + (grade.score / grade.maxScore) * 100,
            0,
          ) / studentGrades.length,
        )
      : 0;

    return {
      ...student,
      progress,
      average,
      courses: studentCourses.length,
      assignments: studentAssignments.length,
      quizzes: studentQuizzes.length,
      submitted: studentAssignments.filter((assignment) => assignment.studentStatus === "Submitted").length,
    };
  });
  const selectedRow =
    performanceRows.find((row) => row.id === selectedStudent?.id) || performanceRows[0];

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Student Performance"
        subtitle={`Students mapped to ${user.branch}. Performance values are derived from their mapped courses, assignments, quizzes, and published grades.`}
      />
      <div className={styles.learningSummary}>
        <div><strong>{performanceRows.length}</strong><span>Branch students</span></div>
        <div><strong>{selectedRow?.average || 0}%</strong><span>Selected average</span></div>
        <div><strong>{selectedRow?.progress || 0}%</strong><span>Selected progress</span></div>
      </div>
      <div className={styles.assignmentWorkspace}>
        <div className={styles.assignmentList}>
          {performanceRows.map((row) => (
            <button
              className={`${styles.assignmentCard} ${
                selectedRow?.id === row.id ? styles.assignmentCardActive : ""
              }`}
              key={row.id}
              type="button"
              onClick={() => setSelectedStudentId(row.id)}
            >
              <span className={styles.iconBox}><GraduationCap size={18} /></span>
              <span>
                <strong>{row.name}</strong>
                <small>{row.branch} - Semester {row.semester}</small>
                <small>{row.submitted}/{row.assignments} assignments submitted</small>
              </span>
              <Badge>{row.average}%</Badge>
            </button>
          ))}
        </div>
        {selectedRow && (
          <article className={styles.assignmentDetail}>
            <div className={styles.panelHeader}><h2 className={styles.panelTitle}>{selectedRow.name}</h2><Badge>{selectedRow.branch}</Badge></div>
            <div className={styles.panelBody}>
              <div className={styles.activityList}>
                <ProgressBar label="Course progress" value={selectedRow.progress} />
                <ProgressBar label="Grade average" value={selectedRow.average} />
              </div>
              <div className={styles.teacherCommandGrid}>
                <div><Award size={22} /><strong>{selectedRow.average}%</strong><span>Published average</span></div>
                <div><ClipboardList size={22} /><strong>{selectedRow.assignments}</strong><span>Assignments</span></div>
                <div><TrendingUp size={22} /><strong>{selectedRow.quizzes}</strong><span>Quizzes</span></div>
              </div>
            </div>
          </article>
        )}
      </div>
      <div className={styles.analyticsGrid}>
        {performanceRows.map((row) => (
          <div className={styles.analyticsBar} key={row.id}>
            <span>{row.name.split(" ")[0]}</span>
            <div><i style={{ height: `${Math.max(row.progress, 8)}%` }} /></div>
            <strong>{row.progress}%</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
