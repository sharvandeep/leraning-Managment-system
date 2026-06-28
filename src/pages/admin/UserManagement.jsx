import { useState, useEffect } from "react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import TextField from "../../components/forms/TextField";
import SelectField from "../../components/forms/SelectField";
import { userService } from "../../services/userService";
import { branchService } from "../../services/branchService";
import { semesterService } from "../../services/semesterService";
import styles from "../../styles/ui.module.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

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

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const deletableUserIds = users
        .filter((u) => u.role !== "admin")
        .map((u) => u.id);
      setSelectedIds(deletableUserIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (userId) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected user accounts? This action will remove all their database records and cannot be undone.`)) {
      return;
    }
    
    setError("");
    setSuccess("");
    setSubmitting(true);
    
    try {
      for (const id of selectedIds) {
        await userService.deleteUser(id);
      }
      setSuccess(`Successfully deleted ${selectedIds.length} user accounts.`);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete some user accounts.");
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className={styles.panelHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className={styles.panelTitle}>Institution Directory</h2>
          {selectedIds.length > 0 && (
            <button
              className={styles.buttonDangerCompact}
              onClick={handleBulkDelete}
              disabled={submitting}
              style={{ padding: "6px 12px", fontSize: "13px" }}
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
        <div className={styles.panelBody}>
          {users.length === 0 ? (
            <p>No registered users found.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          users.length > 0 &&
                          users.filter((u) => u.role !== "admin").every((u) => selectedIds.includes(u.id))
                        }
                      />
                    </th>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Branch</th>
                    <th>Semester</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isDeletable = user.role !== "admin";
                    const isChecked = selectedIds.includes(user.id);
                    return (
                      <tr key={user.id}>
                        <td style={{ textAlign: "center" }}>
                          {isDeletable && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectOne(user.id)}
                            />
                          )}
                        </td>
                        <td>{user.user_id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <Badge>{user.role}</Badge>
                        </td>
                        <td>{user.branch || "Global"}</td>
                        <td>{user.semester || "-"}</td>
                        <td>
                          <button
                            className={styles.buttonDangerCompact}
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                            type="button"
                            disabled={!isDeletable || submitting}
                            onClick={() => handleDelete(user.id, user.name, user.role)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
