import { useState, useEffect } from "react";
import { GraduationCap, UserRoundCog } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { branchService } from "../../services/branchService";
import { semesterService } from "../../services/semesterService";
import styles from "../../styles/ui.module.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [successMessage, setSuccessMessage] = useState("");
  const [successTitle, setSuccessTitle] = useState("Registration successful");
  const [successLink, setSuccessLink] = useState({ to: "/login", label: "Return to login" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    role: "student",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    branch_id: "",
    semester_id: "",
  });
  const [error, setError] = useState("");
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);

  useEffect(() => {
    let active = true;
    async function loadDropdowns() {
      try {
        const branchList = await branchService.getBranches();
        const semesterList = await semesterService.getSemesters();
        if (active) {
          setBranches(branchList);
          // Only show Active semesters for registration
          setSemesters(semesterList.filter(s => s.status === "Active"));
        }
      } catch (err) {
        console.error("Failed to load registration options", err);
      }
    }
    loadDropdowns();
    return () => {
      active = false;
    };
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "role" && value === "teacher") {
        next.semester_id = "";
      }
      return next;
    });
  };

  const selectRole = (role) => {
    setForm((current) => ({
      ...current,
      role,
      semester_id: role === "teacher" ? "" : current.semester_id,
    }));
    setError("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      showToast("Passwords do not match.", "error");
      return;
    }
    if (form.role === "student" && !form.semester_id) {
      setError("Students must select a semester.");
      showToast("Students must select a semester.", "error");
      return;
    }
    try {
      setIsSubmitting(true);
      const session = await register(form);
      if (session.needsVerification) {
        setSuccessTitle("Verify your email");
        setSuccessLink({ to: "/login", label: "Return to login" });
        setSuccessMessage(session.message || "Registration successful! An activation link has been sent to your email. Please verify your account before logging in.");
        showToast("Registration successful! Please verify your email.", "success");
      } else {
        const dashboardPath = `/${session.user.role}/dashboard`;
        setSuccessTitle("Registration successful");
        setSuccessLink({ to: dashboardPath, label: "Continue to dashboard" });
        setSuccessMessage(`Welcome, ${session.user.name}! Your ${session.user.role} account has been created successfully. Taking you to your dashboard...`);
        showToast(`Registration successful! Welcome, ${session.user.name}.`, "success");
        window.setTimeout(() => navigate(dashboardPath, { replace: true }), 1800);
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Registration failed. Please check your details.";
      setError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const semesterOptions = semesters.map((s) => ({ value: String(s.semester_id), label: s.name }));

  if (successMessage) {
    return (
      <div className={styles.authCard} style={{ textAlign: "center", padding: "40px 30px" }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "#e0f2fe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px auto",
          color: "#0284c7"
        }}>
          <GraduationCap size={32} />
        </div>
        <h1 className={styles.title} style={{ marginBottom: "12px" }}>{successTitle}</h1>
        <p className={styles.subtitle} style={{ fontSize: "15px", color: "#475569", lineHeight: "1.6", marginBottom: "30px" }}>
          {successMessage}
        </p>
        <Link 
          to={successLink.to} 
          className={styles.button} 
          style={{ 
            display: "inline-block", 
            textDecoration: "none", 
            padding: "12px 30px", 
            borderRadius: "8px", 
            fontWeight: "600",
            backgroundColor: "#0284c7",
            color: "white"
          }}
        >
          {successLink.label}
        </Link>
      </div>
    );
  }

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
        <SelectField label="Branch" name="branch_id" options={branchOptions} value={form.branch_id} onChange={onChange} required />
        {form.role === "student" && (
          <SelectField label="Semester" name="semester_id" options={semesterOptions} value={form.semester_id} onChange={onChange} required />
        )}
        <button className={styles.button} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Register"}
        </button>
      </form>
      <div className={styles.authLinks}>
        <Link to="/login">Already have a login?</Link>
      </div>
    </div>
  );
}
