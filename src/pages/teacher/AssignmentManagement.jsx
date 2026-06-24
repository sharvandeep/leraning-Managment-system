import { CheckCircle2, Eye, Plus, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import { assignmentService } from "../../services/assignmentService";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function AssignmentManagement() {
  const { user } = useAuth();
  const { assignments, courses, students, loading } = useRoleData(user);
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

    // Save to backend via service
    const savedAsg = await assignmentService.createAssignment(course.id, payload);

    setCreatedAssignments((current) => [savedAsg, ...current]);
    setSelectedId(savedAsg.id);
    setForm({ courseId: course.id, title: "", instructions: "", dueDate: "", maxMarks: "" });
  };

  const gradeNext = async () => {
    if (!selected) return;

    // Find first pending submission
    const pendingSub = submissions.find((sub) => sub.status === "Pending");

    if (pendingSub) {
      // Grade using backend service
      await assignmentService.gradeSubmission(pendingSub.submissionId, 85, "Good implementation");
      // Update local state
      setSubmissions((current) =>
        current.map((sub) =>
          sub.submissionId === pendingSub.submissionId
            ? { ...sub, status: "Graded", marks: 85, feedback: "Good implementation" }
            : sub
        )
      );
    } else {
      // Fallback/Simulated grading if no database submissions exist
      if (!selected.id.startsWith("session-asg")) return;
      setCreatedAssignments((current) =>
        current.map((assignment) =>
          assignment.id === selected.id
            ? {
                ...assignment,
                submissions: Math.max(assignment.submissions, students.length),
                graded: Math.min(Math.max(assignment.graded + 1, 1), students.length),
              }
            : assignment,
        ),
      );
    }
  };

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Loading assignments..." />;
  }

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Assignment Management"
        subtitle="Create assignments for assigned courses, review submissions, and grade session-created work."
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
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Assignment Review</h2>{selected && <Badge>{selected.courseTitle}</Badge>}</div>
          <div className={styles.panelBody}>
            {selected ? (
              <>
                <h3>{selected.title}</h3>
                <p className={styles.muted}>{selected.instructions}</p>
                <div className={styles.detailGrid}>
                  <span><strong>Due:</strong> {formatDate(selected.dueDate)}</span>
                  <span><strong>Marks:</strong> {selected.maxMarks}</span>
                  <span><strong>Submissions:</strong> {selected.submissions || 0}</span>
                  <span><strong>Graded:</strong> {selected.graded || 0}</span>
                </div>
                {submissions.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <h4>Active Submissions ({submissions.length})</h4>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {submissions.map((sub) => (
                        <li key={sub.submissionId} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
                          <span>{sub.studentName}</span>
                          <Badge variant={sub.status === "Graded" ? "success" : "warning"}>{sub.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className={styles.heroActions}>
                  <button className={styles.buttonSecondary} type="button"><Eye size={18} /> View submissions</button>
                  <button className={styles.button} type="button" onClick={gradeNext}><Star size={18} /> Grade next</button>
                </div>
              </>
            ) : (
              <p className={styles.muted}>Create or select an assignment.</p>
            )}
          </div>
        </article>
      </div>
      <div className={styles.gradeGrid}>
        {rows.map((assignment) => (
          <button className={styles.gradeCard} key={assignment.id} type="button" onClick={() => setSelectedId(assignment.id)}>
            <div className={styles.quizTop}>
              <span className={styles.iconBox}><CheckCircle2 size={18} /></span>
              <Badge variant={assignment.id.startsWith("session") ? "success" : undefined}>{assignment.id.startsWith("session") ? "Session" : "Mock"}</Badge>
            </div>
            <h3>{assignment.title}</h3>
            <p>{assignment.courseTitle}</p>
            <div className={styles.detailGrid}>
              <span><strong>Due:</strong> {formatDate(assignment.dueDate)}</span>
              <span><strong>Pending:</strong> {Math.max((assignment.submissions || 0) - (assignment.graded || 0), 0)}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

