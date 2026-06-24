import { useState } from "react";
import { GraduationCap, UserRoundCog } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import useAuth from "../../hooks/useAuth";
import { BRANCHES, SEMESTERS } from "../../utils/constants";
import styles from "../../styles/ui.module.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    branch: "",
    semester: "",
  });

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      semester: name === "role" && value === "teacher" ? "" : current.semester,
    }));
  };

  const selectRole = (role) => {
    setForm((current) => ({
      ...current,
      role,
      semester: role === "teacher" ? "" : current.semester,
    }));
    setError("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.role === "student" && !form.semester) {
      setError("Students must select a semester.");
      return;
    }
    const session = await register(form);
    navigate(`/${session.user.role}/dashboard`, { replace: true });
  };

  return (
    <div className={styles.authCard}>
      <div>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Register as a student or teacher. Admin accounts are created by the backend team.</p>
      </div>
      <div className={styles.roleSelectorCompact} aria-label="Select registration role">
        <button
          className={`${styles.roleCard} ${
            form.role === "student" ? styles.roleCardActive : ""
          }`}
          type="button"
          onClick={() => selectRole("student")}
        >
          <span className={styles.roleIcon}><GraduationCap size={20} /></span>
          <strong>Student</strong>
          <small>Branch + semester</small>
        </button>
        <button
          className={`${styles.roleCard} ${
            form.role === "teacher" ? styles.roleCardActive : ""
          }`}
          type="button"
          onClick={() => selectRole("teacher")}
        >
          <span className={styles.roleIcon}><UserRoundCog size={20} /></span>
          <strong>Teacher</strong>
          <small>Branch mapped</small>
        </button>
      </div>
      {error && <div className={styles.alert}>{error}</div>}
      <form className={styles.form} onSubmit={onSubmit}>
        <TextField label="Full Name" name="name" placeholder="Enter full name" value={form.name} onChange={onChange} required />
        <TextField label="Email" name="email" type="email" placeholder="Enter email address" value={form.email} onChange={onChange} required />
        <div className={styles.formGrid}>
          <TextField label="Password" name="password" type="password" placeholder="Create password" value={form.password} onChange={onChange} required />
          <TextField label="Confirm Password" name="confirmPassword" type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={onChange} required />
        </div>
        <SelectField label="Branch" name="branch" options={BRANCHES} value={form.branch} onChange={onChange} required />
        {form.role === "student" && (
          <SelectField label="Semester" name="semester" options={SEMESTERS} value={form.semester} onChange={onChange} required />
        )}
        <button className={styles.button} type="submit">Register</button>
      </form>
      <div className={styles.authLinks}>
        <Link to="/login">Already have a login?</Link>
      </div>
    </div>
  );
}
