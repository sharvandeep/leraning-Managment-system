import { useState } from "react";
import { GraduationCap, ShieldCheck, UserRoundCog } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import TextField from "../../components/forms/TextField";
import useAuth from "../../hooks/useAuth";
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
  const [selectedRole, setSelectedRole] = useState("student");
  const [form, setForm] = useState({ email: "student@lms.com", password: "password123" });
  const [error, setError] = useState("");

  const onChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const session = await login(form);
      const fallback = `/${session.user.role}/dashboard`;
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      setError(err.message);
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
        <TextField
          label="Password"
          name="password"
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={onChange}
          required
        />
        <button className={styles.button} type="submit">Sign in</button>
      </form>
      <div className={styles.authLinks}>
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/register">New login? Register</Link>
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
