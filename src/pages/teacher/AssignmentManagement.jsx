import { CheckCircle2, Download, Eye, Plus, Star, X, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import { assignmentService } from "../../services/assignmentService";
import { aiService } from "../../services/aiService";
import { formatDate } from "../../utils/formatters";
import API_URL from "../../services/api";
import styles from "../../styles/ui.module.css";


export default function AssignmentManagement() {
  const { user } = useAuth();
  const { assignments, courses, loading } = useRoleData(user);
  const [createdAssignments, setCreatedAssignments] = useSessionState(
    "lms-teacher-assignments",
    [],
  );
  
  const courseIds = useMemo(() => courses.map((course) => course.id), [courses]);
  const sessionRows = useMemo(() => createdAssignments.filter((item) => courseIds.includes(item.courseId)), [createdAssignments, courseIds]);
  const rows = useMemo(() => [...assignments, ...sessionRows], [assignments, sessionRows]);

  const [selectedId, setSelectedId] = useSessionState(
    "lms-teacher-selected-assignment",
    rows[0]?.id || "",
  );
  const selected = rows.find((assignment) => assignment.id === selectedId) || rows[0];

  const [form, setForm] = useState({
    courseId: courses[0]?.id || "",
    title: "",
    instructions: "",
    dueDate: "",
    maxMarks: "",
  });

  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marks: "", feedback: "" });
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sync selectedId when data loads
  useEffect(() => {
    if (!selectedId && rows.length > 0) {
      setSelectedId(rows[0].id);
    }
  }, [rows, selectedId, setSelectedId]);

  // Load submissions for selected assignment
  useEffect(() => {
    if (!selected) return;
    let active = true;
    async function fetchSubmissions() {
      try {
        const fetched = await assignmentService.getSubmissions(selected.id);
        if (active) {
          setSubmissions(fetched);
          setSelectedSubmission(null); // Reset active review on assignment switch
          setSuccessMsg("");
          setErrorMsg("");
        }
      } catch (err) {
        console.error("Error loading submissions", err);
      }
    }
    fetchSubmissions();
    return () => {
      active = false;
    };
  }, [selected]);

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const createAssignment = async () => {
    const course = courses.find((item) => item.id === form.courseId);
    if (!course || !form.title.trim()) return;

    const payload = {
      title: form.title.trim(),
      instructions: form.instructions.trim() || "Instructions will be shared in class.",
      dueDate: form.dueDate || new Date().toISOString().split("T")[0],
      maxMarks: Number(form.maxMarks) || 100,
    };

    try {
      const savedAsg = await assignmentService.createAssignment(course.id, payload);
      setCreatedAssignments((current) => [savedAsg, ...current]);
      setSelectedId(savedAsg.id);
      setForm({ courseId: course.id, title: "", instructions: "", dueDate: "", maxMarks: "" });
      setSuccessMsg("Assignment published successfully!");
    } catch (err) {
      console.error("Failed to create assignment", err);
    }
  };

  const startReview = (sub) => {
    setSelectedSubmission(sub);
    setGradeForm({
      marks: sub.marks !== null && sub.marks !== undefined ? String(sub.marks) : "",
      feedback: sub.feedback || "",
    });
    setSuccessMsg("");
    setErrorMsg("");
  };

  const submitGrade = async () => {
    if (!selectedSubmission) return;
    if (gradeForm.marks.trim() === "") {
      setErrorMsg("Please enter a grade score.");
      return;
    }

    try {
      await assignmentService.gradeSubmission(
        selectedSubmission.submissionId,
        Number(gradeForm.marks),
        gradeForm.feedback.trim()
      );

      // Update local state
      setSubmissions((current) =>
        current.map((sub) =>
          sub.submissionId === selectedSubmission.submissionId
            ? { 
                ...sub, 
                status: "Graded", 
                marks: Number(gradeForm.marks), 
                feedback: gradeForm.feedback.trim() 
              }
            : sub
        )
      );
      setSuccessMsg("Submission graded successfully!");
      setSelectedSubmission(null);
    } catch (err) {
      console.error("Failed to submit grade", err);
      setErrorMsg("Failed to save grade. Please try again.");
    }
  };

  const [aiGradingLoading, setAiGradingLoading] = useState(false);

  const handleAiGrade = async () => {
    if (!selected || !selectedSubmission) return;
    setAiGradingLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const result = await aiService.gradeAssignment(
        selected.title,
        selected.instructions,
        selected.total_marks || selected.maxMarks || 100,
        selectedSubmission.studentName,
        selectedSubmission.file_path || "Submitted document file"
      );
      setGradeForm({
        marks: String(result.score),
        feedback: result.feedback
      });
      setSuccessMsg("AI Grade and feedback suggestions drafted successfully!");
    } catch (err) {
      setErrorMsg("AI grading helper failed: " + err.message);
    } finally {
      setAiGradingLoading(false);
    }
  };


  // Build the full backend URL for file downloads
  const getFileUrl = (filePath) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || API_URL;
    const host = apiBase.replace("/api", "");
    return `${host}${filePath}`;
  };

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Loading assignments..." />;
  }

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Assignment Management"
        subtitle="Create assignments for assigned courses, review student submissions, and grade work in real time."
        action={<button className={styles.button} type="button" onClick={createAssignment}><Plus size={18} /> Publish Assignment</button>}
      />
      <div className={styles.assignmentWorkspace}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Create Assignment</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
              <SelectField label="Course" name="courseId" options={courses.map((course) => ({ label: course.title, value: course.id }))} value={form.courseId} onChange={updateForm} />
              <TextField label="Assignment Title" name="title" value={form.title} onChange={updateForm} />
              <TextField label="Instructions" name="instructions" as="textarea" value={form.instructions} onChange={updateForm} />
              <div className={styles.formGrid}>
                <TextField label="Due Date" name="dueDate" type="date" value={form.dueDate} onChange={updateForm} />
                <TextField label="Max Marks" name="maxMarks" type="number" value={form.maxMarks} onChange={updateForm} />
              </div>
              <button className={styles.button} type="button" onClick={createAssignment}><Plus size={18} /> Create Assignment</button>
            </form>
          </div>
        </article>

        <article className={styles.assignmentDetail}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Assignment Review</h2>
            {selected && <Badge>{selected.courseTitle}</Badge>}
          </div>
          <div className={styles.panelBody}>
            {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
            {errorMsg && <div className={styles.alert}>{errorMsg}</div>}

            {selected ? (
              <>
                <h3>{selected.title}</h3>
                <p className={styles.muted} style={{ marginBottom: "1.5rem" }}>{selected.instructions}</p>
                <div className={styles.detailGrid} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                  <span><strong>Due:</strong> {formatDate(selected.dueDate)}</span>
                  <span><strong>Max Marks:</strong> {selected.total_marks}</span>
                  <span><strong>Submissions:</strong> {submissions.length}</span>
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <h4 style={{ marginBottom: "0.8rem" }}>Student Submissions</h4>
                  {submissions.length > 0 ? (
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                            <th style={{ padding: "0.5rem 0" }}>Student</th>
                            <th>Status</th>
                            <th>Grade</th>
                            <th style={{ textAlign: "right" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((sub) => (
                            <tr key={sub.submissionId} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                              <td style={{ padding: "0.6rem 0" }}><strong>{sub.studentName}</strong></td>
                              <td><Badge variant={sub.status === "Graded" ? "success" : "warning"}>{sub.status}</Badge></td>
                              <td>{sub.status === "Graded" ? `${sub.marks}/${selected.total_marks}` : "-"}</td>
                              <td style={{ textAlign: "right" }}>
                                <button className={styles.buttonSecondary} style={{ padding: "0.2rem 0.6rem", fontSize: "0.85rem" }} type="button" onClick={() => startReview(sub)}>
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className={styles.muted} style={{ fontSize: "0.95rem" }}>No students have submitted work for this assignment yet.</p>
                  )}
                </div>
              </>
            ) : (
              <p className={styles.muted}>Create or select an assignment.</p>
            )}
          </div>
        </article>
      </div>

      {selectedSubmission && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <article className={styles.panel} style={{ width: "90%", maxWidth: "500px", position: "relative", boxShadow: "var(--shadow-lg)" }}>
            <button style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer" }} onClick={() => setSelectedSubmission(null)}>
              <X size={20} />
            </button>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Review Submission</h2>
            </div>
            <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p><strong>Student:</strong> {selectedSubmission.studentName}</p>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.8rem", backgroundColor: "var(--surface-variant)", borderRadius: "var(--radius-md)" }}>
                <Eye size={20} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Submitted File</strong>
                  <small className={styles.muted}>Click download to inspect file</small>
                </div>
                <a href={getFileUrl(selectedSubmission.file_path)} target="_blank" rel="noopener noreferrer" className={styles.button} style={{ textDecoration: "none", display: "flex", gap: "0.4rem", padding: "0.4rem 0.8rem", fontSize: "0.9rem" }}>
                  <Download size={15} /> Download
                </a>
              </div>

              <div className={styles.form} style={{ marginTop: "0.5rem" }}>
                <button 
                  className={styles.buttonSecondary} 
                  type="button" 
                  onClick={handleAiGrade}
                  disabled={aiGradingLoading}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    width: "100%", 
                    justifyContent: "center", 
                    marginBottom: "1rem", 
                    border: "1px solid #7c3aed", 
                    color: "#7c3aed",
                    fontWeight: "600",
                    background: "#fdfaff" 
                  }}
                >
                  <Sparkles size={16} /> {aiGradingLoading ? "AI analyzing submission..." : "✨ Auto Grade & Feedback with AI"}
                </button>

                <TextField 
                  label={`Score (Max: ${selected.total_marks})`}
                  name="marks"
                  type="number"
                  placeholder="Enter points"
                  value={gradeForm.marks}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, marks: e.target.value }))}
                />
                <TextField 
                  label="Feedback Comments"
                  name="feedback"
                  as="textarea"
                  placeholder="Good work! Provide comments here..."
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                />
                <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.5rem" }}>
                  <button className={styles.button} type="button" style={{ flex: 1 }} onClick={submitGrade}>
                    <Star size={16} /> Submit Grade
                  </button>
                  <button className={styles.buttonSecondary} type="button" onClick={() => setSelectedSubmission(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}

      <div className={styles.gradeGrid}>
        {rows.map((assignment) => (
          <button className={styles.gradeCard} key={assignment.id} type="button" onClick={() => setSelectedId(assignment.id)}>
            <div className={styles.quizTop}>
              <span className={styles.iconBox}><CheckCircle2 size={18} /></span>
              <Badge variant={assignment.id.startsWith("session") ? "success" : undefined}>{assignment.id.startsWith("session") ? "Session" : "Live"}</Badge>
            </div>
            <h3>{assignment.title}</h3>
            <p>{assignment.courseTitle}</p>
            <div className={styles.detailGrid}>
              <span><strong>Due:</strong> {formatDate(assignment.dueDate)}</span>
              <span><strong>Pending:</strong> {assignment.submissions || 0} submissions</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
