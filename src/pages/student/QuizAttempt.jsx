import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Timer, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Play, Award, RefreshCcw } from "lucide-react";
import { quizService } from "../../services/quizService";
import PageHeader from "../../components/common/PageHeader";
import Badge from "../../components/common/Badge";
import styles from "../../styles/ui.module.css";

export default function QuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedOptionIndex }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState(null);

  // Security and start states
  const [isStarted, setIsStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer Countdown state
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Load quiz details
  useEffect(() => {
    let active = true;
    async function loadQuizData() {
      try {
        const fetchedQuiz = await quizService.getQuizById(quizId);
        const fetchedQuestions = await quizService.getQuestions(quizId);

        if (active) {
          setQuiz(fetchedQuiz);
          setQuestions(fetchedQuestions);
          
          const minutes = Number(fetchedQuiz.duration?.replace(/\D/g, "")) || 15;
          setTimeLeft(minutes * 60);

          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load quiz attempt data", err);
        if (active) {
          setError("Failed to load quiz details. Make sure you haven't already attempted this quiz.");
          setLoading(false);
        }
      }
    }
    loadQuizData();
    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  // Start countdown timer ONLY when quiz is started
  useEffect(() => {
    if (!isStarted || loading || isSubmitted || error || timeLeft <= 0) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true); // Auto-submit when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isStarted, loading, isSubmitted, error, timeLeft]);

  // Exam Fullscreen Security Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);

      // If student exits fullscreen, auto-submit quiz immediately
      if (isStarted && !isSubmitted && !isCurrentlyFullscreen) {
        alert("⚠️ SECURITY VIOLATION DETECTED:\nExiting full screen mode is strictly prohibited during the assessment. Your attempt has been automatically submitted.");
        handleSubmit(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [isStarted, isSubmitted, questions, answers]);

  const startQuiz = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.mozRequestFullScreen) { /* Firefox */
        await element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) { /* IE/Edge */
        await element.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn("Fullscreen request rejected or blocked by browser", err);
    }
    setIsStarted(true);
  };

  const handleSelectOption = (qId, optionIdx) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleSubmit = async (auto = false) => {
    if (isSubmitted) return;
    if (timerRef.current) clearInterval(timerRef.current);

    if (!auto && Object.keys(answers).length < questions.length) {
      const confirmSubmit = window.confirm("You have unanswered questions. Are you sure you want to submit?");
      if (!confirmSubmit) {
        // Restart timer
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => prev - 1);
        }, 1000);
        return;
      }
    }

    setLoading(true);
    
    // Attempt exit fullscreen if we are in it
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    } catch (e) {
      // Ignored
    }

    try {
      // Map frontend answers to backend schema
      const payloadAnswers = questions.map(q => {
        const ansIdx = answers[q.id];
        
        if (quiz?.isLocalAi) {
          return {
            question_id: q.id,
            selected_option_id: ansIdx !== undefined ? ansIdx : null
          };
        }

        let selectedOptionId = null;
        if (ansIdx !== undefined && q.rawOptions && q.rawOptions[ansIdx]) {
          selectedOptionId = q.rawOptions[ansIdx].option_id;
        }

        return {
          question_id: Number(q.id),
          selected_option_id: selectedOptionId
        };
      });

      const attemptResult = await quizService.submitQuizAttempt(quizId, {
        answers: payloadAnswers
      });

      setResults(attemptResult);
      setIsSubmitted(true);
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading && !isSubmitted) {
    return <PageHeader title="Loading Quiz..." subtitle="Setting up your test interface..." />;
  }

  if (error) {
    return (
      <section className={styles.page}>
        <PageHeader title="Quiz Unavailable" subtitle="Could not start attempt." />
        <article className={styles.panel} style={{ padding: "30px", textAlign: "center" }}>
          <AlertTriangle size={48} style={{ color: "#eab308", marginBottom: "16px" }} />
          <p>{error}</p>
          <button className={styles.button} style={{ marginTop: "16px" }} onClick={() => navigate("/student/quizzes")}>
            Back to Quizzes
          </button>
        </article>
      </section>
    );
  }

  // 1. Render Start Screen (Enter Full Screen Trigger)
  if (!isStarted && !isSubmitted) {
    const totalMarks = questions.length * 5;
    return (
      <section className={styles.page}>
        <PageHeader title="Quiz Ready" subtitle={quiz?.title} />
        <div style={{ maxWidth: "600px", margin: "40px auto" }}>
          <article className={styles.panel} style={{ padding: "32px", textAlign: "center" }}>
            <Play size={48} style={{ color: "#7c3aed", marginBottom: "16px" }} />
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "12px", color: "#0f172a" }}>
              Start Assessment Environment
            </h2>
            <p className={styles.muted} style={{ marginBottom: "20px", fontSize: "14px", lineHeight: "1.6" }}>
              You are about to start **{quiz?.title}** for **{quiz?.courseTitle}**. 
              Please read the instructions carefully before starting:
            </p>
            
            <div style={{ textAlign: "left", backgroundColor: "#f8fafc", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "24px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px", color: "#334155" }}>
              <div>⏳ **Duration:** {quiz?.duration || "15 min"}</div>
              <div>📝 **Questions:** {questions.length} Questions (Multiple Choice)</div>
              <div>🎯 **Marks:** {quiz?.maxScore || totalMarks} Points total</div>
              <div style={{ color: "#b45309", fontWeight: "600", marginTop: "8px" }}>
                ⚠️ Security Rules:
              </div>
              <div style={{ color: "#b45309" }}>
                • Exiting fullscreen mode at any time will **auto-submit** your assessment.
              </div>
              <div style={{ color: "#b45309" }}>
                • The AI Tutor Chatbot is disabled in the exam environment.
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button 
                className={styles.button} 
                onClick={startQuiz}
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)", color: "white", padding: "12px 30px", fontWeight: "700" }}
              >
                🚀 Enter Full Screen & Start Quiz
              </button>
              <button className={styles.buttonSecondary} onClick={() => navigate("/student/quizzes")}>
                Cancel
              </button>
            </div>
          </article>
        </div>
      </section>
    );
  }

  const currentQuestion = questions[currentIdx];
  const selectedOption = currentQuestion ? answers[currentQuestion.id] : undefined;

  // 2. Render Result Screen if Submitted
  if (isSubmitted && results) {
    const totalMarks = questions.length * 5;
    const percentage = Math.round((results.score / (quiz?.maxScore || totalMarks)) * 100);
    const passed = percentage >= 50;

    return (
      <section className={styles.page}>
        <PageHeader title="Quiz Completed" subtitle="Assessment Results & Review" />
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <article className={styles.panel} style={{ textAlign: "center", padding: "40px 20px", border: passed ? "2px solid #22c55e" : "2px solid #ef4444" }}>
            <Award size={64} style={{ color: passed ? "#22c55e" : "#ef4444", marginBottom: "16px" }} />
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>
              {passed ? "Excellent Effort!" : "Keep Practicing!"}
            </h2>
            <p className={styles.muted} style={{ marginBottom: "24px" }}>
              You have completed the assessment **{quiz?.title}**.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "400px", margin: "0 auto 30px" }}>
              <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Your Score</span>
                <strong style={{ fontSize: "28px", color: passed ? "#22c55e" : "#ef4444" }}>
                  {results.score} / {quiz?.maxScore || totalMarks}
                </strong>
              </div>
              <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Percentage</span>
                <strong style={{ fontSize: "28px", color: "#0f172a" }}>{percentage}%</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button className={styles.button} onClick={() => navigate("/student/quizzes")}>
                Return to Quizzes
              </button>
              <button 
                className={styles.buttonSecondary} 
                onClick={() => {
                  setIsSubmitted(false);
                  setAnswers({});
                  setCurrentIdx(0);
                  setIsStarted(false); // Go back to start screen
                  const minutes = Number(quiz.duration?.replace(/\D/g, "")) || 15;
                  setTimeLeft(minutes * 60);
                }}
              >
                <RefreshCcw size={16} style={{ marginRight: "4px" }} /> Retry Attempt
              </button>
            </div>
          </article>

          {/* Correct Answers Review */}
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Review Answers</h2>
            </div>
            <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {questions.map((q, idx) => {
                const userAnsIdx = answers[q.id];
                const isCorrect = userAnsIdx === q.correctOptionIndex;
                return (
                  <div key={q.id} style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
                      <span style={{ 
                        display: "inline-grid", 
                        placeItems: "center", 
                        width: "24px", 
                        height: "24px", 
                        borderRadius: "50%", 
                        backgroundColor: isCorrect ? "#dcfce7" : "#fee2e2",
                        color: isCorrect ? "#166534" : "#991b1b",
                        fontSize: "12px",
                        fontWeight: "700"
                      }}>{idx + 1}</span>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>{q.questionText}</strong>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "32px" }}>
                      {q.options.map((opt, oIdx) => {
                        const isUserSelected = userAnsIdx === oIdx;
                        const isCorrectOpt = q.correctOptionIndex === oIdx;
                        
                        let borderStyle = "1px solid #e2e8f0";
                        let bg = "#ffffff";
                        let fg = "#475569";

                        if (isCorrectOpt) {
                          borderStyle = "1px solid #86efac";
                          bg = "#f0fdf4";
                          fg = "#166534";
                        } else if (isUserSelected && !isCorrect) {
                          borderStyle = "1px solid #fca5a5";
                          bg = "#fef2f2";
                          fg = "#991b1b";
                        }

                        return (
                          <div key={oIdx} style={{ 
                            padding: "8px 12px", 
                            borderRadius: "6px", 
                            border: borderStyle, 
                            backgroundColor: bg,
                            color: fg,
                            fontSize: "13px",
                            fontWeight: isUserSelected || isCorrectOpt ? "600" : "normal"
                          }}>
                            {opt} {isCorrectOpt && " (Correct Answer)"} {isUserSelected && !isCorrect && " (Your Answer)"}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </section>
    );
  }

  // 3. Render Exam Environment
  return (
    <section className={styles.page}>
      <PageHeader 
        title={quiz?.title} 
        subtitle={`${quiz?.courseTitle} • Total Questions: ${questions.length}`} 
        action={
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            backgroundColor: timeLeft < 60 ? "#fee2e2" : "#f1f5f9", 
            color: timeLeft < 60 ? "#ef4444" : "#475569", 
            padding: "8px 16px", 
            borderRadius: "999px",
            fontWeight: "700",
            fontSize: "14px",
            border: timeLeft < 60 ? "1px solid #fca5a5" : "1px solid #cbd5e1"
          }}>
            <Timer size={18} /> {formatTime(timeLeft)}
          </div>
        }
      />

      <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Progress Tracker bar */}
        <div style={{ display: "flex", gap: "6px" }}>
          {questions.map((_, idx) => {
            const answered = answers[questions[idx].id] !== undefined;
            const active = idx === currentIdx;
            return (
              <div 
                key={idx} 
                style={{ 
                  flex: 1, 
                  height: "6px", 
                  borderRadius: "3px", 
                  backgroundColor: active ? "#7c3aed" : answered ? "#c084fc" : "#e2e8f0" 
                }} 
              />
            );
          })}
        </div>

        {/* Current Question Panel */}
        {currentQuestion && (
          <article className={styles.panel} style={{ animation: "fadeIn 0.2s" }}>
            <div className={styles.panelHeader} style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#7c3aed", textTransform: "uppercase" }}>
                Question {currentIdx + 1} of {questions.length}
              </span>
            </div>
            
            <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "600", color: "#0f172a", lineHeight: "1.5" }}>
                {currentQuestion.questionText}
              </h3>

              {/* Multiple Choice Options List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {currentQuestion.options.map((optionText, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                      style={{
                        textAlign: "left",
                        width: "100%",
                        padding: "16px 20px",
                        borderRadius: "10px",
                        border: isSelected ? "2px solid #7c3aed" : "1px solid #e2e8f0",
                        backgroundColor: isSelected ? "#fdfaff" : "#ffffff",
                        color: isSelected ? "#6b21a8" : "#334155",
                        fontWeight: isSelected ? "600" : "normal",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        outline: "none"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#c084fc";
                          e.currentTarget.style.backgroundColor = "#faf5ff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.backgroundColor = "#ffffff";
                        }
                      }}
                    >
                      <span style={{
                        display: "inline-grid",
                        placeItems: "center",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        border: isSelected ? "2px solid #7c3aed" : "1px solid #cbd5e1",
                        backgroundColor: isSelected ? "#7c3aed" : "#ffffff",
                        color: isSelected ? "white" : "#64748b",
                        fontSize: "11px",
                        fontWeight: "700"
                      }}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      {optionText}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            className={styles.buttonSecondary}
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={16} /> Previous
          </button>

          {currentIdx === questions.length - 1 ? (
            <button
              className={styles.button}
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)", color: "white", padding: "10px 24px" }}
              onClick={() => handleSubmit(false)}
            >
              <CheckCircle size={16} style={{ marginRight: "6px" }} /> Submit Quiz
            </button>
          ) : (
            <button
              className={styles.button}
              onClick={() => setCurrentIdx(prev => prev + 1)}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
