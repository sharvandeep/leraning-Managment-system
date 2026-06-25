import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import TextField from "../../components/forms/TextField";
import DataTable from "../../components/tables/DataTable";
import { branchService } from "../../services/branchService";
import styles from "../../styles/ui.module.css";

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadBranches() {
    try {
      const list = await branchService.getBranches();
      setBranches(list);
    } catch (err) {
      console.error("Failed to load branches", err);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    
    if (!name.trim()) {
      setError("Branch name is required.");
      return;
    }
    
    setSubmitting(true);
    try {
      await branchService.createBranch({ name: name.trim() });
      setSuccess("Branch created successfully!");
      setName("");
      loadBranches();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create branch. It might already exist.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (branchId) => {
    setError("");
    setSuccess("");
    if (!window.confirm("Are you sure you want to delete this branch?")) {
      return;
    }
    try {
      await branchService.deleteBranch(branchId);
      setSuccess("Branch deleted successfully!");
      loadBranches();
    } catch (err) {
      setError(err.response?.data?.detail || "Cannot delete branch. It may be linked to active users or courses.");
    }
  };

  const rows = branches.map((b) => ({
    id: b.branch_id,
    branch_id: b.branch_id,
    name: b.name,
  }));

  const columns = [
    { key: "branch_id", label: "Branch ID" },
    { key: "name", label: "Branch Name" },
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
      <PageHeader title="Branch Management" subtitle="Maintain academic branches used in registration, course mapping, and reporting." />
      
      {error && <div className={styles.alertDanger}>{error}</div>}
      {success && <div className={styles.alertSuccess}>{success}</div>}

      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Add New Branch</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <TextField 
                label="Branch Name" 
                placeholder="e.g., CSE, AI&DS, IT" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
              <button className={styles.button} type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Add Branch"}
              </button>
            </form>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Existing Branches ({branches.length})</h2></div>
          <div className={styles.panelBody}>
            {branches.length === 0 ? (
              <p>No branches found in database.</p>
            ) : (
              <DataTable columns={columns} rows={rows} />
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
