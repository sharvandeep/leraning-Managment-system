import { BarChart3, CheckCircle2, ListPlus, Plus, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { useState, useEffect } from "react";
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

  // Quiz Attempts Review State
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [quizResults, setQuizResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const courseIds = courses.map((course) => course.id);
  const rows = [...quizzes, ...createdQuizzes.filter((quiz) => courseIds.includes(quiz.courseId))];
  const averageQuizScore = rows.length
    ? Math.round(rows.reduce((sum, quiz) => sum + (quiz.averageScore || 0), 0) / rows.length)
    : 0;

  const selectedQuiz = rows.find((q) => q.id === selectedQuizId);

  // Load quiz attempt results when a quiz is selected
  useEffect(() => {
    if (!selectedQuizId) return;
    let active = true;
    setResultsLoading(true);
    
    quizService.getQuizResults(selectedQuizId)
      .then((res) => {
        if (active) {
          setQuizResults(res);
          setResultsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load quiz attempt results", err);
        if (active) {
          setQuizResults([]);
          setResultsLoading(false);
        }
      });
      
    return () => {
      active = false;
    };
  }, [selectedQuizId]);

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
    } catch (err) {
      alert("Failed to create quiz: " + err.message);
    }
  };

  const generateAiQuiz = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const result = await aiService.generateQuiz(aiTopic, 5, "15 min");
      setGeneratedQuestions(result.questions);
      setAiTitle(result.title || `AI Quiz: ${aiTopic.trim()}`);
    } catch (err) {
      alert("Failed to generate AI Quiz: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const saveAiQuiz = async (status = "Open") => {
    const course = courses[0]; // Default to teacher's first course
    if (!course || !aiTitle.trim()) return;

    try {
      // 1. Create quiz container
      const payload = {
        title: aiTitle.trim(),
        questions: generatedQuestions.length,
        duration: "15 min",
        attempts: 1,
      };
      const newQuiz = await quizService.createQuiz(course.id, payload);

      // 2. Create questions in DB
      for (const q of generatedQuestions) {
        await quizService.createQuestion(newQuiz.id, {
          questionText: q.question,
          options: q.options,
          correctOptionIndex: q.options.indexOf(q.answer) !== -1 ? q.options.indexOf(q.answer) : 0,
          marks: 5
        });
      }

      setCreatedQuizzes((current) => [
        {
          ...newQuiz,
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
      alert("AI Quiz created & published successfully!");
    } catch (err) {
      alert("Failed to save AI Quiz: " + err.message);
    }
  };

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Synchronizing class quizzes..." />;
  }

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Quiz Management"
        subtitle="Schedule mock papers, generate AI evaluations, and review student grades."
        action={
          <button 
            className={styles.button} 
            onClick={() => setIsAiMode(!isAiMode)}
            style={{ 
              background: isAiMode ? "linear-gradient(135deg, #475569 0%, #1e293b 100%)" : "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              gap: "6px" 
            }}
          >
            <Sparkles size={16} /> {isAiMode ? "Use Standard Builder" : "Try AI Quiz Generator"}
          </button>
        }
      />

      <div className={styles.assignmentWorkspace}>
        {/* Left Form: Builder */}
        {!isAiMode ? (
          <article className={styles.panel}>
            <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Schedule Quiz</h2></div>
            <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <SelectField
                label="Assign to Course"
                name="courseId"
                onChange={updateForm}
                options={courses.map((item) => ({ label: item.title, value: item.id }))}
                value={form.courseId}
              />
              <TextField label="Quiz Title" name="title" onChange={updateForm} value={form.title} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <TextField label="Questions count" name="questions" type="number" onChange={updateForm} value={form.questions} />
                <SelectField
                  label="Time limit"
                  name="duration"
                  onChange={updateForm}
                  options={[
                    { label: "15 Minutes", value: "15 min" },
                    { label: "30 Minutes", value: "30 min" },
                    { label: "45 Minutes", value: "45 min" },
                    { label: "60 Minutes", value: "60 min" },
                  ]}
                  value={form.duration}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button className={styles.button} onClick={() => createQuiz("Open")} type="button">
                  <CheckCircle2 size={16} style={{ marginRight: "4px" }} /> Publish Quiz
                </button>
                <button className={styles.buttonSecondary} onClick={() => createQuiz("Draft")} type="button">
                  <ListPlus size={16} style={{ marginRight: "4px" }} /> Save Draft
                </button>
              </div>
            </div>
          </article>
        ) : (
          <article className={styles.panel} style={{ border: "1px solid #7c3aed", backgroundColor: "#fdfaff" }}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle} style={{ color: "#6d28d9", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={18} /> AI Quiz Generator
              </h2>
            </div>
            <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.5", margin: 0 }}>
                Specify a topic, and AI will draft five multiple-choice questions with answers instantly!
              </p>
              
              <TextField 
                label="Study Topic / Syllabus Module" 
                placeholder="e.g. React Hooks, JavaScript Closures" 
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />

              <button 
                className={styles.button} 
                onClick={generateAiQuiz} 
                disabled={aiLoading || !aiTopic.trim()}
                style={{ 
                  background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)", 
                  color: "white", 
                  marginTop: "8px",
                  opacity: (aiLoading || !aiTopic.trim()) ? 0.6 : 1
                }}
              >
                {aiLoading ? "Generating questions..." : "Generate Questions"}
              </button>
            </div>
          </article>
        )}

        {/* Right Form: Aggregate Overview */}
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

      {/* Classroom Quizzes List */}
      <div style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "12px" }}>Active Quizzes (Click Card to Review Attempts)</h2>
        <div className={styles.quizGrid}>
          {rows.map((quiz) => (
            <article 
              className={styles.quizCard} 
              key={quiz.id}
              onClick={() => setSelectedQuizId(quiz.id)}
              style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className={styles.quizTop}>
                <span className={styles.iconBox}><CheckCircle2 size={18} /></span>
                <Badge variant={quiz.status === "Open" ? "success" : quiz.status === "Scheduled" ? "warning" : undefined}>{quiz.status}</Badge>
              </div>
              <h3>{quiz.title}</h3>
              <p>{quiz.courseTitle}</p>
              <div className={styles.detailGrid}>
                <span><strong>Date:</strong> {formatDate(quiz.date)}</span>
                <span><strong>Questions:</strong> {quiz.questions}</span>
                <span><strong>Attempts Allowed:</strong> {quiz.attempts}</span>
                <span><strong>Avg Score:</strong> {quiz.averageScore || 0}%</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Attempts Review Modal */}
      {selectedQuizId && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <article className={styles.panel} style={{ width: "90%", maxWidth: "600px", position: "relative", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
            <button 
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} 
              onClick={() => { setSelectedQuizId(null); setQuizResults([]); }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <X size={18} />
            </button>
            
            <div className={styles.panelHeader} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <h2 className={styles.panelTitle}>Review Quiz Attempts</h2>
            </div>
            
            <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "24px" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{selectedQuiz?.title}</h3>
                <p className={styles.muted} style={{ margin: 0, fontSize: "13px" }}>Course: {selectedQuiz?.courseTitle}</p>
              </div>
              
              <div style={{ marginTop: "12px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.025em" }}>Student Submissions</h4>
                
                {resultsLoading ? (
                  <p style={{ color: "#64748b", fontSize: "13.5px" }}>Loading attempts from database...</p>
                ) : quizResults.length > 0 ? (
                  <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                          <th style={{ padding: "10px 12px", fontWeight: "600", color: "#475569" }}>Student</th>
                          <th style={{ padding: "10px 12px", fontWeight: "600", color: "#475569" }}>Date Attempted</th>
                          <th style={{ padding: "10px 12px", fontWeight: "600", color: "#475569" }}>Score</th>
                          <th style={{ padding: "10px 12px", fontWeight: "600", color: "#475569", textAlign: "right" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizResults.map((res, index) => {
                          const maxScore = selectedQuiz?.maxScore || 10;
                          const percent = Math.round((res.score / maxScore) * 100);
                          return (
                            <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 12px", fontWeight: "600", color: "#1e293b" }}>{res.studentName}</td>
                              <td style={{ padding: "10px 12px", color: "#64748b" }}>{formatDate(res.attemptDate)}</td>
                              <td style={{ padding: "10px 12px", fontWeight: "700", color: "#0f172a" }}>{res.score} / {maxScore}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                <Badge variant={percent >= 50 ? "success" : "warning"}>{percent}%</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "13.5px" }}>No students have attempted this quiz yet.</p>
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>
      )}

    </section>
  );
}
