import { useState } from "react";
import { CheckCircle2, Clock, PlayCircle, Timer } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function Quizzes() {
  const { user } = useAuth();
  const { quizzes } = useRoleData(user);
  const [attempted, setAttempted] = useState({});

  const getQuizState = (quiz) => attempted[quiz.id] || quiz.studentStatus;
  const canAttempt = (quiz) => quiz.status === "Open" && getQuizState(quiz) !== "Completed";
  const openCount = quizzes.filter((quiz) => quiz.status === "Open").length;
  const completedCount = quizzes.filter((quiz) => getQuizState(quiz) === "Completed").length;

  return (
    <section className={styles.page}>
      <PageHeader
        title="Quizzes"
        subtitle="Teacher-created quizzes for your assigned courses. Open quizzes can be attempted from here."
      />
      <div className={styles.learningSummary}>
        <div><strong>{quizzes.length}</strong><span>Total quizzes</span></div>
        <div><strong>{openCount}</strong><span>Open now</span></div>
        <div><strong>{completedCount}</strong><span>Completed</span></div>
      </div>
      <div className={styles.quizGrid}>
        {quizzes.map((quiz) => {
          const state = getQuizState(quiz);
          return (
            <article className={styles.quizCard} key={quiz.id}>
              <div className={styles.quizTop}>
                <span className={styles.iconBox}>
                  {state === "Completed" ? <CheckCircle2 size={19} /> : <Timer size={19} />}
                </span>
                <Badge variant={quiz.status === "Open" ? "success" : quiz.status === "Scheduled" ? "warning" : undefined}>
                  {quiz.status}
                </Badge>
              </div>
              <h3>{quiz.title}</h3>
              <p>{quiz.courseTitle}</p>
              <div className={styles.detailGrid}>
                <span><strong>Date:</strong> {formatDate(quiz.date)}</span>
                <span><strong>Duration:</strong> {quiz.duration}</span>
                <span><strong>Questions:</strong> {quiz.questions}</span>
                <span><strong>Score:</strong> {quiz.score ? `${quiz.score}/${quiz.maxScore}` : "-"}</span>
              </div>
              <div className={styles.topicRow}>
                {quiz.topics.map((topic) => <Badge key={topic}>{topic}</Badge>)}
              </div>
              {canAttempt(quiz) ? (
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => setAttempted((current) => ({ ...current, [quiz.id]: "Completed" }))}
                >
                  <PlayCircle size={17} /> Attempt quiz
                </button>
              ) : (
                <button className={styles.buttonSecondary} type="button" disabled>
                  <Clock size={17} /> {state}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
