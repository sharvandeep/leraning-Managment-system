import { useState } from "react";
import { CheckCircle2, Clock, FileUp, LockKeyhole, Send } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function Assignments() {
  const { user } = useAuth();
  const { assignments } = useRoleData(user);
  const [submissionState, setSubmissionState] = useState({});
  const [selectedAssignment, setSelectedAssignment] = useState(assignments[0]?.id || "");
  const selected = assignments.find((assignment) => assignment.id === selectedAssignment);

  const getStatus = (assignment) =>
    submissionState[assignment.id] || assignment.studentStatus || assignment.status;

  const submitAssignment = (assignmentId) => {
    setSubmissionState((current) => ({
      ...current,
      [assignmentId]: "Submitted",
    }));
  };

  const pendingCount = assignments.filter(
    (assignment) => getStatus(assignment) !== "Submitted",
  ).length;
  const submittedCount = assignments.length - pendingCount;

  return (
    <section className={styles.page}>
      <PageHeader
        title="Assignments"
        subtitle="Teacher-created assignments for your mapped courses. Open each task, review instructions, and submit work from this page."
      />
      <div className={styles.learningSummary}>
        <div><strong>{assignments.length}</strong><span>Total assignments</span></div>
        <div><strong>{pendingCount}</strong><span>Pending</span></div>
        <div><strong>{submittedCount}</strong><span>Submitted</span></div>
      </div>
      <div className={styles.assignmentWorkspace}>
        <div className={styles.assignmentList}>
          {assignments.map((assignment) => {
            const status = getStatus(assignment);
            return (
              <button
                className={`${styles.assignmentCard} ${
                  selectedAssignment === assignment.id ? styles.assignmentCardActive : ""
                }`}
                key={assignment.id}
                type="button"
                onClick={() => setSelectedAssignment(assignment.id)}
              >
                <span className={styles.iconBox}>
                  {status === "Submitted" ? <CheckCircle2 size={19} /> : <Clock size={19} />}
                </span>
                <span>
                  <strong>{assignment.title}</strong>
                  <small>{assignment.courseTitle}</small>
                  <small>Due {formatDate(assignment.dueDate)}</small>
                </span>
                <Badge variant={status === "Submitted" ? "success" : "warning"}>{status}</Badge>
              </button>
            );
          })}
        </div>
        {selected && (
          <article className={styles.assignmentDetail}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>{selected.title}</h2>
              <Badge>{selected.courseTitle}</Badge>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.detailGrid}>
                <p><strong>Teacher:</strong> {selected.createdBy}</p>
                <p><strong>Created:</strong> {formatDate(selected.createdAt)}</p>
                <p><strong>Due:</strong> {formatDate(selected.dueDate)}</p>
                <p><strong>Marks:</strong> {selected.grade ? `${selected.grade}/${selected.maxMarks}` : selected.maxMarks}</p>
              </div>
              <p className={styles.muted}>{selected.instructions}</p>
              <div className={styles.materialGrid}>
                {selected.attachments.map((attachment) => (
                  <button className={styles.materialCard} key={attachment} type="button">
                    <span className={styles.iconBox}><FileUp size={18} /></span>
                    <strong>{attachment}</strong>
                    <small>Teacher attachment</small>
                  </button>
                ))}
              </div>
              <div className={styles.submissionBox}>
                {getStatus(selected) === "Submitted" ? (
                  <>
                    <CheckCircle2 size={22} />
                    <div>
                      <strong>Submission received</strong>
                      <p>{selected.submittedAt ? `Submitted on ${formatDate(selected.submittedAt)}` : "Submitted just now"}</p>
                    </div>
                    {selected.grade ? <Badge variant="success">Graded</Badge> : <Badge>Awaiting grade</Badge>}
                  </>
                ) : (
                  <>
                    <LockKeyhole size={22} />
                    <div>
                      <strong>Ready for submission</strong>
                      <p>Attach your completed work and submit before the due date.</p>
                    </div>
                    <button className={styles.button} type="button" onClick={() => submitAssignment(selected.id)}>
                      <Send size={17} /> Submit work
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
