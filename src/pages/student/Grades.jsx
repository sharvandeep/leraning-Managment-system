import { Award, BookOpen, TrendingUp } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import ProgressBar from "../../components/common/ProgressBar";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function Grades() {
  const { user } = useAuth();
  const { grades } = useRoleData(user);
  const average = grades.length
    ? Math.round(
        grades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 100, 0) /
          grades.length,
      )
    : 0;

  return (
    <section className={styles.page}>
      <PageHeader title="Grades" subtitle="Published grades from teacher-created assignments, quizzes, and exams." />
      <div className={styles.learningSummary}>
        <div><strong>{average}%</strong><span>Overall average</span></div>
        <div><strong>{grades.length}</strong><span>Published results</span></div>
        <div><strong>{grades.filter((grade) => grade.type === "Quiz").length}</strong><span>Quiz grades</span></div>
      </div>
      <div className={styles.gradeGrid}>
        {grades.map((grade) => {
          const percentage = Math.round((grade.score / grade.maxScore) * 100);
          return (
            <article className={styles.gradeCard} key={grade.id}>
              <div className={styles.quizTop}>
                <span className={styles.iconBox}>
                  {grade.type === "Quiz" ? <TrendingUp size={19} /> : grade.type === "Assignment" ? <BookOpen size={19} /> : <Award size={19} />}
                </span>
                <Badge>{grade.type}</Badge>
              </div>
              <h3>{grade.assessment}</h3>
              <p>{grade.courseTitle}</p>
              <ProgressBar label="Score" value={percentage} />
              <div className={styles.detailGrid}>
                <span><strong>Marks:</strong> {grade.score}/{grade.maxScore}</span>
                <span><strong>Published:</strong> {formatDate(grade.publishedAt)}</span>
                <span><strong>Teacher:</strong> {grade.publishedBy}</span>
              </div>
              <p className={styles.feedbackBox}>{grade.feedback}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
