import { useRef, useState } from "react";
import { CheckCircle2, Clock, FileUp, LockKeyhole, Send, X } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import { assignmentService } from "../../services/assignmentService";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function Assignments() {
  const { user } = useAuth();
  const { assignments, loading } = useRoleData(user);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [localStatuses, setLocalStatuses] = useState({});
  const fileInputRef = useRef(null);

  const activeAssignments = assignments || [];
  const selected = activeAssignments.find((a) => a.id === selectedAssignment) || activeAssignments[0];

  // Set default selected assignment when data loads
  if (!selectedAssignment && activeAssignments.length > 0) {
    setSelectedAssignment(activeAssignments[0].id);
  }

  const getStatus = (assignment) => {
    return localStatuses[assignment.id] || assignment.student_status || "Not Submitted";
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg("");
      setSuccessMsg("");
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitWork = async (assignmentId) => {
    if (!selectedFile) {
      setErrorMsg("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await assignmentService.submitAssignment(assignmentId, selectedFile);
      setLocalStatuses((current) => ({
        ...current,
        [assignmentId]: "Submitted",
      }));
      setSuccessMsg("Assignment submitted successfully!");
      clearFile();
    } catch (err) {
      console.error("Submission failed", err);
      setErrorMsg("Failed to upload submission. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Loading assignments..." />;
  }

  return (
    <section className={styles.page}>
      <PageHeader
        title="Assignments"
        subtitle="Teacher-created assignments for your mapped courses. Open each task, review instructions, and submit work from this page."
      />
      <div className={styles.learningSummary}>
        <div><strong>{activeAssignments.length}</strong><span>Total assignments</span></div>
        <div><strong>{activeAssignments.filter(a => getStatus(a) !== "Submitted" && getStatus(a) !== "Graded").length}</strong><span>Pending</span></div>
        <div><strong>{activeAssignments.filter(a => getStatus(a) === "Submitted" || getStatus(a) === "Graded").length}</strong><span>Submitted</span></div>
      </div>
      <div className={styles.assignmentWorkspace}>
        <div className={styles.assignmentList}>
          {activeAssignments.map((assignment) => {
            const status = getStatus(assignment);
            return (
              <button
                className={`${styles.assignmentCard} ${
                  selected?.id === assignment.id ? styles.assignmentCardActive : ""
                }`}
                key={assignment.id}
                type="button"
                onClick={() => {
                  setSelectedAssignment(assignment.id);
                  clearFile();
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
              >
                <span className={styles.iconBox}>
                  {status === "Submitted" || status === "Graded" ? <CheckCircle2 size={19} /> : <Clock size={19} />}
                </span>
                <span>
                  <strong>{assignment.title}</strong>
                  <small>{assignment.courseTitle}</small>
                  <small>Due {formatDate(assignment.dueDate)}</small>
                </span>
                <Badge variant={status === "Submitted" || status === "Graded" ? "success" : "warning"}>{status}</Badge>
              </button>
            );
          })}
          {activeAssignments.length === 0 && <p className={styles.muted}>No assignments assigned.</p>}
        </div>
        {selected ? (
          <article className={styles.assignmentDetail}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>{selected.title}</h2>
              <Badge>{selected.courseTitle}</Badge>
            </div>
            <div className={styles.panelBody}>
              {errorMsg && <div className={styles.alert}>{errorMsg}</div>}
              {successMsg && <div className={styles.successMessage}>{successMsg}</div>}
              
              <div className={styles.detailGrid}>
                <p><strong>Due:</strong> {formatDate(selected.dueDate)}</p>
                <p><strong>Marks:</strong> {selected.grade !== null && selected.grade !== undefined ? `${selected.grade}/${selected.total_marks}` : selected.total_marks}</p>
              </div>
              <p className={styles.muted} style={{ margin: "1.5rem 0", whiteSpace: "pre-wrap" }}>{selected.instructions}</p>
              
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />

              <div className={styles.submissionBox}>
                {getStatus(selected) === "Submitted" || getStatus(selected) === "Graded" ? (
                  <>
                    <CheckCircle2 size={22} />
                    <div>
                      <strong>Submission received</strong>
                      <p>{selected.submitted_at ? `Submitted on ${formatDate(selected.submitted_at)}` : "Submitted recently"}</p>
                    </div>
                    {getStatus(selected) === "Graded" ? (
                      <Badge variant="success">Graded</Badge>
                    ) : (
                      <Badge>Awaiting grade</Badge>
                    )}
                  </>
                ) : (
                  <>
                    <LockKeyhole size={22} />
                    <div>
                      {selectedFile ? (
                        <>
                          <strong>Selected File: {selectedFile.name}</strong>
                          <p>Ready to upload and submit.</p>
                        </>
                      ) : (
                        <>
                          <strong>Ready for submission</strong>
                          <p>Attach your completed work and submit before the due date.</p>
                        </>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {selectedFile && (
                        <button className={styles.iconButton} type="button" onClick={clearFile} title="Clear selection">
                          <X size={16} />
                        </button>
                      )}
                      <button className={styles.buttonSecondary} type="button" onClick={handleFileSelect} disabled={uploading}>
                        Choose file
                      </button>
                      {selectedFile && (
                        <button className={styles.button} type="button" onClick={() => submitWork(selected.id)} disabled={uploading}>
                          <Send size={17} /> {uploading ? "Submitting..." : "Submit work"}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {selected.grade !== null && selected.grade !== undefined && (
                <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "var(--radius-md)" }}>
                  <h3 style={{ margin: 0, color: "rgb(34, 197, 94)", fontSize: "1.1rem" }}>Grading Results</h3>
                  <p style={{ margin: "0.5rem 0 0.2rem 0" }}><strong>Score:</strong> {selected.grade} / {selected.total_marks}</p>
                  {selected.feedback && <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.95rem" }}>"{selected.feedback}"</p>}
                </div>
              )}
            </div>
          </article>
        ) : (
          !loading && <p className={styles.muted}>Select an assignment to view details.</p>
        )}
      </div>
    </section>
  );
}
