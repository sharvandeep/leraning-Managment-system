import { useState, useEffect } from "react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import TextField from "../../components/forms/TextField";
import SelectField from "../../components/forms/SelectField";
import DataTable from "../../components/tables/DataTable";
import { userService } from "../../services/userService";
import { branchService } from "../../services/branchService";
import { semesterService } from "../../services/semesterService";
import styles from "../../styles/ui.module.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [branchId, setBranchId] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      const [userList, branchList, semesterList] = await Promise.all([
        userService.getUsers(),
        branchService.getBranches(),
        semesterService.getSemesters(),
      ]);
      setUsers(userList);
      setBranches(branchList);
      setSemesters(semesterList.filter(s => s.status === "Active"));
    } catch (err) {
      console.error("Failed to load user management data", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !password || !branchId || !role) {
      setError("Please fill out all required fields.");
      return;
    }

    if (role === "student" && !semesterId) {
      setError("Students must be assigned to a semester.");
      return;
    }

    setSubmitting(true);
    try {
      await userService.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        branchId: Number(branchId),
        semesterId: role === "student" ? Number(semesterId) : undefined,
      });
      setSuccess(`Account for ${name} (${role}) created successfully!`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("student");
      setBranchId("");
      setSemesterId("");
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create user account. Email may already be registered.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId, userFullName, userRole) => {
    setError("");
    setSuccess("");
    
    if (userRole === "admin") {
      setError("Protecting system integrity: Admin accounts cannot be deleted from this interface.");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete the ${userRole} account for "${userFullName}"? This action will remove their enrollments, submissions, and database records.`)) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      setSuccess("User account deleted successfully!");
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete user account.");
    }
  };

  const rows = users.map((u) => ({
    id: u.id,
    user_id: u.user_id,
    name: u.name,
    email: u.email,
    role: u.role,
    branch: u.branch || "Global", // resolved branch name
    semester: u.semester || "-", // resolved semester name
  }));

  const columns = [
    { key: "user_id", label: "User ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (row) => <Badge>{row.role}</Badge> },
    { key: "branch", label: "Branch" },
    { key: "semester", label: "Semester" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          className={styles.buttonDangerCompact}
          style={{ padding: "4px 8px", fontSize: "12px" }}
          type="button"
          disabled={row.role === "admin"}
          onClick={() => handleDelete(row.id, row.name, row.role)}
        >
          Delete
        </button>
      ),
    },
  ];

  const branchOptions = branches.map((b) => ({ value: String(b.branch_id), label: b.name }));
  const semesterOptions = semesters.map((s) => ({ value: String(s.semester_id), label: s.name }));
  const roleOptions = [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Teacher" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <section className={styles.page}>
      <PageHeader title="User Management" subtitle="Review and register students, teachers, and system administrators directly into the database." />
      
      {error && <div className={styles.alertDanger}>{error}</div>}
      {success && <div className={styles.alertSuccess}>{success}</div>}

      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Create User Account</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <TextField 
                label="Full Name" 
                placeholder="Enter full name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
              <TextField 
                label="Email Address" 
                type="email"
                placeholder="e.g., student@lms.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <TextField 
                label="Password" 
                type="password"
                placeholder="Enter account password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <SelectField 
                label="Account Role" 
                options={roleOptions} 
                value={role} 
                onChange={(e) => {
                  setRole(e.target.value);
                  if (e.target.value !== "student") setSemesterId("");
                }} 
                required 
              />
              <div className={styles.formGrid}>
                <SelectField 
                  label="Branch" 
                  options={branchOptions} 
                  value={branchId} 
                  onChange={(e) => setBranchId(e.target.value)} 
                  required 
                />
                {role === "student" && (
                  <SelectField 
                    label="Semester" 
                    options={semesterOptions} 
                    value={semesterId} 
                    onChange={(e) => setSemesterId(e.target.value)} 
                    required 
                  />
                )}
              </div>
              <button className={styles.button} type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Quick Stats</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.bulletList} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><strong>Total Users:</strong> {users.length}</div>
              <div><strong>Students Registered:</strong> {users.filter(u => u.role === "student").length}</div>
              <div><strong>Teachers Active:</strong> {users.filter(u => u.role === "teacher").length}</div>
              <div><strong>Administrators:</strong> {users.filter(u => u.role === "admin").length}</div>
            </div>
          </div>
        </article>
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Institution Directory</h2></div>
        <div className={styles.panelBody}>
          {users.length === 0 ? (
            <p>No registered users found.</p>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </div>
      </article>
    </section>
  );
}
