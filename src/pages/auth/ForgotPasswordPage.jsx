import { useState } from "react";
import { Link } from "react-router-dom";
import TextField from "../../components/forms/TextField";
import { authService } from "../../services/authService";
import styles from "../../styles/ui.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      setMessage(response.message || "Reset link sent! Please check your inbox.");
    } catch (err) {
      console.error("Forgot password request failed", err);
      setError(
        err.response?.data?.detail || 
        "Failed to request password reset. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div>
        <h1 className={styles.title}>Reset password</h1>
        <p className={styles.subtitle}>Enter your username or email and we will prepare reset instructions.</p>
      </div>
      {error && <div className={styles.alertDanger} style={{ padding: "10px", borderRadius: "6px", fontSize: "13px", marginBottom: "15px" }}>{error}</div>}
      {message && <div className={styles.alertSuccess} style={{ padding: "10px", borderRadius: "6px", fontSize: "13px", marginBottom: "15px" }}>{message}</div>}
      <form className={styles.form} onSubmit={onSubmit}>
        <TextField
          label="Username"
          type="email"
          placeholder="Enter username or email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={loading}
        />
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <div className={styles.authLinks}>
        <Link to="/login">Back to login</Link>
      </div>
    </div>
  );
}
