import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import DataTable from "../../components/tables/DataTable";
import { semesterService } from "../../services/semesterService";
import styles from "../../styles/ui.module.css";

export default function SemesterManagement() {
  const [semesters, setSemesters] = useState([]);
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Active");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadSemesters() {
    try {
      const list = await semesterService.getSemesters();
      setSemesters(list);
    } catch (err) {
      console.error("Failed to load semesters", err);
    }
  }

  useEffect(() => {
    loadSemesters();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!number || !name.trim()) {
      setError("Both semester number and name are required.");
      return;
    }

    setSubmitting(true);
    try {
      await semesterService.createSemester({
        number: Number(number),
        name: name.trim(),
        status,
      });
      setSuccess("Semester created successfully!");
      setNumber("");
      setName("");
      setStatus("Active");
      loadSemesters();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create semester. The number might already exist.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (semesterId) => {
    setError("");
    setSuccess("");
    if (!window.confirm("Are you sure you want to delete this semester?")) {
      return;
    }
    try {
      await semesterService.deleteSemester(semesterId);
      setSuccess("Semester deleted successfully!");
      loadSemesters();
    } catch (err) {
      setError(err.response?.data?.detail || "Cannot delete semester. It may be linked to active users, courses, or batches.");
    }
  };

  const rows = semesters.map((s) => ({
    id: s.semester_id,
    semester_id: s.semester_id,
    number: s.number,
    name: s.name,
    status: s.status,
  }));

  const columns = [
    { key: "semester_id", label: "Semester ID" },
    { key: "number", label: "Number" },
    { key: "name", label: "Semester Name" },
    { key: "status", label: "Status" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          className={styles.buttonDangerCompact}
          style={{ padding: "4px 8px", fontSize: "12px" }}
          type="button"
          onClick={() => handleDelete(row.id)}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <section className={styles.page}>
      <PageHeader title="Semester Management" subtitle="Configure semester labels, active status, and slot planning." />

      {error && <div className={styles.alertDanger}>{error}</div>}
      {success && <div className={styles.alertSuccess}>{success}</div>}

      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Semester Setup</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <TextField
                label="Semester Number"
                type="number"
                placeholder="e.g., 1, 2, 3"
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value);
                  if (e.target.value && !name) {
                    setName(`Semester ${e.target.value}`);
                  }
                }}
                required
              />
              <TextField
                label="Semester Name"
                placeholder="e.g., Semester 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <SelectField
                label="Status"
                options={["Active", "Planned", "Archived"]}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              />
              <button className={styles.button} type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Add Semester"}
              </button>
            </form>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Existing Semesters ({semesters.length})</h2></div>
          <div className={styles.panelBody}>
            {semesters.length === 0 ? (
              <p>No semesters found in database.</p>
            ) : (
              <DataTable columns={columns} rows={rows} />
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
