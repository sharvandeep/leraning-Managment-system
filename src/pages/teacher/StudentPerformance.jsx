import { useState } from "react";
import { Award, ClipboardList, GraduationCap, TrendingUp, Sparkles, Copy, RefreshCw } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import ProgressBar from "../../components/common/ProgressBar";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import { aiService } from "../../services/aiService";
import styles from "../../styles/ui.module.css";

export default function StudentPerformance() {
  const { user } = useAuth();
  const { students, courses, assignments, quizzes, grades, loading } = useRoleData(user);
  const [selectedStudentId, setSelectedStudentId] = useSessionState(
    "lms-teacher-selected-student",
    students[0]?.id || "",
  );
  
  // AI Risk Assessment State
  const [aiReport, setAiReport] = useState({}); // { [studentId]: { riskLevel, analysis, emailDraft } }
  const [aiLoading, setAiLoading] = useState({}); // { [studentId]: boolean }

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

  const handleRunAiAnalysis = async (student) => {
    const id = student.id;
    setAiLoading(prev => ({ ...prev, [id]: true }));
    try {
      const report = await aiService.analyzeStudentPerformance(
        student.name,
        student.branch,
        student.semester,
        student.progress,
        student.average,
        student.submitted,
        student.assignments,
        student.attendance_rate || 82 // default mock attendance
      );
      setAiReport(prev => ({ ...prev, [id]: report }));
    } catch (err) {
      alert("AI Risk Analysis failed: " + err.message);
    } finally {
      setAiLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCopyEmail = (emailText) => {
    navigator.clipboard.writeText(emailText);
    alert("Drafted outreach email copied to clipboard! You can paste it into your mail app.");
  };

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
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>{selectedRow.name}</h2>
              <Badge>{selectedRow.branch}</Badge>
            </div>
            <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className={styles.activityList}>
                <ProgressBar label="Course progress" value={selectedRow.progress} />
                <ProgressBar label="Grade average" value={selectedRow.average} />
              </div>
              <div className={styles.teacherCommandGrid}>
                <div><Award size={22} /><strong>{selectedRow.average}%</strong><span>Published average</span></div>
                <div><ClipboardList size={22} /><strong>{selectedRow.assignments}</strong><span>Assignments</span></div>
                <div><TrendingUp size={22} /><strong>{selectedRow.quizzes}</strong><span>Quizzes</span></div>
              </div>

              {/* AI Risk Assessment panel */}
              <div style={{ 
                border: "1px solid #7c3aed", 
                borderRadius: "12px", 
                backgroundColor: "#fcfaff", 
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 4px 6px -1px rgba(124, 58, 237, 0.05)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#6d28d9", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sparkles size={16} /> AI Student Risk Assessment
                  </h3>
                  {aiReport[selectedRow.id] && (
                    <span style={{ 
                      fontSize: "11px", 
                      fontWeight: "700", 
                      padding: "4px 10px", 
                      borderRadius: "20px",
                      backgroundColor: 
                        aiReport[selectedRow.id].riskLevel === "High" ? "#fee2e2" :
                        aiReport[selectedRow.id].riskLevel === "Medium" ? "#ffedd5" : "#dcfce7",
                      color:
                        aiReport[selectedRow.id].riskLevel === "High" ? "#dc2626" :
                        aiReport[selectedRow.id].riskLevel === "Medium" ? "#d97706" : "#16a34a",
                      border: "1px solid currentColor"
                    }}>
                      {aiReport[selectedRow.id].riskLevel} Risk
                    </span>
                  )}
                </div>

                {!aiReport[selectedRow.id] ? (
                  <div>
                    <p style={{ fontSize: "12.5px", color: "#4b5563", lineHeight: "1.5", margin: "0 0 12px 0" }}>
                      Run an AI analysis on {selectedRow.name}'s academic standing to check for risk levels, missing syllabus goals, and generate an outreach draft.
                    </p>
                    <button 
                      onClick={() => handleRunAiAnalysis(selectedRow)}
                      disabled={aiLoading[selectedRow.id]}
                      style={{ 
                        backgroundColor: "#7c3aed", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "8px", 
                        padding: "8px 16px", 
                        fontSize: "12px", 
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {aiLoading[selectedRow.id] ? "Running assessment..." : "Analyze Risk & Outlines"}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Risk details */}
                    <div style={{ fontSize: "13px", color: "#374151", whiteSpace: "pre-line", lineHeight: "1.6", backgroundColor: "white", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      {aiReport[selectedRow.id].analysis}
                    </div>

                    {/* Email Draft details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#4b5563", textTransform: "uppercase" }}>Drafted Student Outreach Email:</span>
                        <button 
                          onClick={() => handleCopyEmail(aiReport[selectedRow.id].emailDraft)}
                          style={{ background: "none", border: "none", color: "#7c3aed", cursor: "pointer", fontSize: "11px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Copy size={12} /> Copy Draft
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={aiReport[selectedRow.id].emailDraft}
                        style={{ 
                          width: "100%", 
                          height: "120px", 
                          padding: "8px 12px", 
                          fontSize: "12px", 
                          borderRadius: "8px", 
                          border: "1px solid #e2e8f0", 
                          fontFamily: "monospace", 
                          backgroundColor: "#f8fafc",
                          outline: "none",
                          resize: "none"
                        }}
                      />
                    </div>

                    <button 
                      onClick={() => handleRunAiAnalysis(selectedRow)}
                      disabled={aiLoading[selectedRow.id]}
                      style={{ 
                        background: "none", 
                        border: "1px solid #cbd5e1", 
                        color: "#475569",
                        borderRadius: "6px", 
                        padding: "6px 12px", 
                        fontSize: "11px", 
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        alignSelf: "flex-start"
                      }}
                    >
                      <RefreshCw size={11} /> Re-run assessment
                    </button>
                  </div>
                )}
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
