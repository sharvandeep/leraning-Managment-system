import { useState } from "react";
import { GraduationCap, ShieldCheck, UserRoundCog, Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import TextField from "../../components/forms/TextField";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import styles from "../../styles/ui.module.css";

const roleOptions = [
  {
    role: "student",
    title: "Student",
    hint: "Course access",
    email: "student@lms.com",
    icon: GraduationCap,
  },
  {
    role: "teacher",
    title: "Teacher",
    hint: "Class tools",
    email: "teacher@lms.com",
    icon: UserRoundCog,
  },
  {
    role: "admin",
    title: "Admin",
    hint: "Full control",
    email: "admin@lms.com",
    icon: ShieldCheck,
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState("student");
  const [form, setForm] = useState({ email: "student@lms.com", password: "password123" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const session = await login(form);
      if (rememberMe) {
        localStorage.setItem("remembered_email", form.email);
      } else {
        localStorage.removeItem("remembered_email");
      }
      showToast(`Welcome back, ${session.user.name}! Access granted.`, "success");
      const fallback = `/${session.user.role}/dashboard`;
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Invalid email or password.";
      setError(errMsg);
      showToast(errMsg, "error");
    }
  };


  const selectRole = (option) => {
    setSelectedRole(option.role);
    setForm({ email: option.email, password: "password123" });
    setError("");
  };

  return (
    <div className={styles.authCard}>
      <PageIntro title="Welcome back" text="Choose your portal and sign in to continue." />
      <div className={styles.roleSelector} aria-label="Select portal role">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              className={`${styles.roleCard} ${
                selectedRole === option.role ? styles.roleCardActive : ""
              }`}
              key={option.role}
              type="button"
              onClick={() => selectRole(option)}
            >
              <span className={styles.roleIcon}>
                <Icon size={20} />
              </span>
              <strong>{option.title}</strong>
              <small>{option.hint}</small>
            </button>
          );
        })}
      </div>
      {error && <div className={styles.alert}>{error}</div>}
      <form className={styles.form} onSubmit={onSubmit}>
        <TextField
          label="Username"
          name="email"
          type="email"
          placeholder="Enter username or email"
          value={form.email}
          onChange={onChange}
          required
        />
        
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px", position: "relative" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={form.password}
              onChange={onChange}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                paddingRight: "40px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                backgroundColor: "white",
                color: "#1e293b"
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                padding: "0"
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "15px 0" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#475569" }}>
            <input 
              type="checkbox" 
              checked={rememberMe} 
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: "#0284c7", cursor: "pointer" }}
            />
            Remember Me
          </label>
          <Link to="/forgot-password" style={{ fontSize: "14px", color: "#0284c7", textDecoration: "none", fontWeight: "500" }}>Forgot password?</Link>
        </div>

        <button className={styles.button} type="submit" style={{ width: "100%", marginTop: "10px" }}>Sign in</button>
      </form>
      <div className={styles.authLinks} style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
        <Link to="/register">New student or teacher? Register</Link>
      </div>
    </div>
  );
}

function PageIntro({ title, text }) {
  return (
    <div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{text}</p>
    </div>
  );
}
