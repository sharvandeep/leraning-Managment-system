import { BarChart3, CheckCircle2, ListPlus, Plus } from "lucide-react";
import { useState } from "react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import { quizService } from "../../services/quizService";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function QuizManagement() {
  const { user } = useAuth();
  const { quizzes, courses, loading } = useRoleData(user);
  const [createdQuizzes, setCreatedQuizzes] = useSessionState("lms-teacher-quizzes", []);
  const [form, setForm] = useState({
    courseId: courses[0]?.id || "",
    title: "",
    date: "",
    questions: 10,
    duration: "30 min",
  });

  const courseIds = courses.map((course) => course.id);
  const rows = [...quizzes, ...createdQuizzes.filter((quiz) => courseIds.includes(quiz.courseId))];
  const averageQuizScore = rows.length
    ? Math.round(rows.reduce((sum, quiz) => sum + (quiz.averageScore || 0), 0) / rows.length)
    : 0;

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const createQuiz = async (status = "Draft") => {
    const course = courses.find((item) => item.id === form.courseId);
    if (!course || !form.title.trim()) return;

    const payload = {
      title: form.title.trim(),
      questions: Number(form.questions) || 10,
      duration: form.duration || "30 min",
      attempts: 1,
    };

    // Save to backend via service
    const savedQuiz = await quizService.createQuiz(course.id, payload);

    setCreatedQuizzes((current) => [
      {
        ...savedQuiz,
        status,
        courseTitle: course.title,
      },
      ...current,
    ]);

    setForm({ courseId: course.id, title: "", date: "", questions: 10, duration: "30 min" });
  };

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Loading quizzes..." />;
  }


  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Quiz Management"
        subtitle="Create quizzes, add questions, publish attempts, and review results for assigned courses."
        action={<button className={styles.button} type="button" onClick={() => createQuiz("Open")}><Plus size={18} /> Publish Quiz</button>}
      />
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Quiz Builder</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
              <SelectField label="Course" name="courseId" options={courses.map((course) => ({ label: course.title, value: course.id }))} value={form.courseId} onChange={updateForm} />
              <TextField label="Quiz Title" name="title" value={form.title} onChange={updateForm} />
              <div className={styles.formGrid}>
                <TextField label="Questions" name="questions" type="number" value={form.questions} onChange={updateForm} />
                <TextField label="Duration" name="duration" value={form.duration} onChange={updateForm} />
              </div>
              <TextField label="Quiz Date" name="date" type="date" value={form.date} onChange={updateForm} />
              <div className={styles.heroActions}>
                <button className={styles.buttonSecondary} type="button" onClick={() => setForm((current) => ({ ...current, questions: Number(current.questions) + 1 }))}><ListPlus size={18} /> Add Question</button>
                <button className={styles.button} type="button" onClick={() => createQuiz("Open")}>Publish</button>
                <button className={styles.buttonSecondary} type="button" onClick={() => createQuiz("Draft")}>Save Draft</button>
              </div>
            </form>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Results Overview</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.focusCard}>
              <span className={styles.iconBox}><BarChart3 size={22} /></span>
              <div>
                <strong>{averageQuizScore}% average score</strong>
                <p>{rows.length} quizzes mapped to assigned courses.</p>
              </div>
            </div>
            <div className={styles.analyticsGrid}>
              {rows.map((quiz) => (
                <div className={styles.analyticsBar} key={quiz.id}>
                  <span>{quiz.title.slice(0, 12)}</span>
                  <div><i style={{ height: `${Math.max(quiz.averageScore || 8, 8)}%` }} /></div>
                  <strong>{quiz.averageScore || 0}%</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
      <div className={styles.quizGrid}>
        {rows.map((quiz) => (
          <article className={styles.quizCard} key={quiz.id}>
            <div className={styles.quizTop}>
              <span className={styles.iconBox}><CheckCircle2 size={18} /></span>
              <Badge variant={quiz.status === "Open" ? "success" : quiz.status === "Scheduled" ? "warning" : undefined}>{quiz.status}</Badge>
            </div>
            <h3>{quiz.title}</h3>
            <p>{quiz.courseTitle}</p>
            <div className={styles.detailGrid}>
              <span><strong>Date:</strong> {formatDate(quiz.date)}</span>
              <span><strong>Questions:</strong> {quiz.questions}</span>
              <span><strong>Attempts:</strong> {quiz.attempts}</span>
              <span><strong>Average:</strong> {quiz.averageScore || 0}%</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
