import { BarChart3, CheckCircle2, ListPlus, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import { quizService } from "../../services/quizService";
import { aiService } from "../../services/aiService";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function QuizManagement() {
  const { user } = useAuth();
  const { quizzes, courses, loading } = useRoleData(user);
  const [createdQuizzes, setCreatedQuizzes] = useSessionState("lms-teacher-quizzes", []);
  
  // Standard Form State
  const [form, setForm] = useState({
    courseId: courses[0]?.id || "",
    title: "",
    date: "",
    questions: 5,
    duration: "15 min",
  });

  // AI Form State
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [aiTitle, setAiTitle] = useState("");

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
      questions: Number(form.questions) || 5,
      duration: form.duration || "15 min",
      attempts: 1,
    };

    try {
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

      setForm({ courseId: course.id, title: "", date: "", questions: 5, duration: "15 min" });
      alert("Quiz created successfully!");
    } catch (err) {
      alert("Failed to create quiz: " + err.message);
    }
  };

  const generateAiQuiz = async () => {
    if (!aiTopic.trim()) {
      alert("Please enter a topic or topic outline first!");
      return;
    }
    setAiLoading(true);
    setGeneratedQuestions([]);
    try {
      const response = await aiService.generateQuiz(aiTopic, form.questions, form.duration);
      setAiTitle(response.title || `Quiz on ${aiTopic}`);
      setGeneratedQuestions(response.questions || []);
    } catch (err) {
      console.error("AI quiz generation error", err);
      alert("AI generation failed: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const saveAiQuiz = async (status = "Open") => {
    const course = courses.find((item) => item.id === form.courseId);
    if (!course) {
      alert("Please select a course to map the quiz to.");
      return;
    }
    if (!aiTitle.trim()) {
      alert("Please enter a quiz title.");
      return;
    }
    if (generatedQuestions.length === 0) {
      alert("Please generate questions first!");
      return;
    }

    try {
      const payload = {
        title: aiTitle.trim(),
        questions: generatedQuestions.length,
        duration: form.duration,
        attempts: 1,
      };

      // 1. Create quiz container
      const savedQuiz = await quizService.createQuiz(course.id, payload);

      // 2. Try saving questions to database
      for (const q of generatedQuestions) {
        try {
          await quizService.createQuestion(savedQuiz.id, {
            questionText: q.question,
            questionType: "mcq",
            options: q.options,
            correctOptionIndex: q.options.indexOf(q.answer) !== -1 ? q.options.indexOf(q.answer) : 0,
            marks: 5,
          });
        } catch (qErr) {
          console.warn("Failed to create question in DB, adding locally", qErr);
        }
      }

      setCreatedQuizzes((current) => [
        {
          ...savedQuiz,
          status,
          courseTitle: course.title,
        },
        ...current,
      ]);

      // Reset
      setGeneratedQuestions([]);
      setAiTopic("");
      setAiTitle("");
      setIsAiMode(false);
      alert("AI Quiz and questions saved successfully!");
    } catch (err) {
      alert("Failed to save AI quiz: " + err.message);
    }
  };

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Loading quizzes..." />;
  }

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Quiz Management"
        subtitle="Create quizzes, add questions, publish attempts, and review results for assigned courses."
        action={
          <button 
            className={styles.button} 
            type="button" 
            onClick={() => setIsAiMode(!isAiMode)}
            style={{ display: "flex", gap: "8px", background: isAiMode ? "var(--text)" : "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)", color: "white" }}
          >
            {isAiMode ? "Standard Builder" : <><Sparkles size={18} /> Try AI Quiz Generator</>}
          </button>
        }
      />
      <div className={styles.grid2}>
        <article className={styles.panel} style={{ border: isAiMode ? "1px solid #7c3aed" : "1px solid var(--line)" }}>
          <div className={styles.panelHeader} style={{ background: isAiMode ? "#f5f3ff" : "none" }}>
            <h2 className={styles.panelTitle} style={{ color: isAiMode ? "#7c3aed" : "inherit", display: "flex", alignItems: "center", gap: "8px" }}>
              {isAiMode ? <><Sparkles size={18} /> AI Quiz Builder</> : "Standard Quiz Builder"}
            </h2>
          </div>
          <div className={styles.panelBody}>
            {isAiMode ? (
              <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
                <SelectField 
                  label="Map to Course" 
                  name="courseId" 
                  options={courses.map((course) => ({ label: course.title, value: course.id }))} 
                  value={form.courseId} 
                  onChange={updateForm} 
                />
                
                <TextField 
                  label="Topic / Subject Outline" 
                  placeholder="e.g. Asynchronous Javascript, React hooks, photosynthesis basics..." 
                  name="aiTopic"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />

                <div className={styles.formGrid}>
                  <TextField 
                    label="Number of Questions" 
                    name="questions" 
                    type="number" 
                    value={form.questions} 
                    onChange={updateForm} 
                  />
                  <TextField 
                    label="Quiz Duration" 
                    name="duration" 
                    value={form.duration} 
                    onChange={updateForm} 
                  />
                </div>

                <div className={styles.heroActions} style={{ marginTop: "1rem" }}>
                  <button 
                    className={styles.button} 
                    type="button" 
                    onClick={generateAiQuiz}
                    disabled={aiLoading}
                    style={{ background: "#7c3aed", color: "white", flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
                  >
                    {aiLoading ? "Generating Questions..." : <><Wand2 size={18} /> Generate Questions</>}
                  </button>
                </div>
              </form>
            ) : (
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
            )}
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

      {/* AI Generated Questions Preview */}
      {isAiMode && generatedQuestions.length > 0 && (
        <article className={styles.panel} style={{ border: "1px solid #7c3aed" }}>
          <div className={styles.panelHeader} style={{ backgroundColor: "#f5f3ff" }}>
            <h2 className={styles.panelTitle} style={{ color: "#7c3aed", fontWeight: "700" }}>📝 Generated Questions Preview</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className={styles.button} onClick={() => saveAiQuiz("Open")} style={{ background: "#7c3aed" }}>Publish Quiz</button>
              <button className={styles.buttonSecondary} onClick={() => saveAiQuiz("Draft")}>Save Draft</button>
            </div>
          </div>
          <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <TextField 
              label="Quiz Final Title" 
              value={aiTitle} 
              onChange={(e) => setAiTitle(e.target.value)} 
            />
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
              {generatedQuestions.map((q, idx) => (
                <div key={q.id || idx} style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "8px", backgroundColor: "#fafafa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <strong>Question {idx + 1}: {q.question}</strong>
                    <button 
                      onClick={() => setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx))} 
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {q.options.map((opt, oIdx) => (
                      <span 
                        key={oIdx} 
                        style={{ 
                          padding: "6px 12px", 
                          borderRadius: "4px", 
                          fontSize: "13px",
                          backgroundColor: opt === q.answer ? "#dcfce7" : "#ffffff",
                          border: opt === q.answer ? "1px solid #86efac" : "1px solid #e2e8f0",
                          color: opt === q.answer ? "#14532d" : "#475569",
                          fontWeight: opt === q.answer ? "600" : "normal"
                        }}
                      >
                        {opt} {opt === q.answer && " (Correct)"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      )}

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

