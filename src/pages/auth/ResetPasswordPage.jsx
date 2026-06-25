import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import TextField from "../../components/forms/TextField";
import { authService } from "../../services/authService";
import styles from "../../styles/ui.module.css";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword(token, password);
      setSuccess(response.message || "Your password has been successfully reset!");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password reset failed", err);
      setError(
        err.response?.data?.detail || 
        "The password reset link is invalid, expired, or the server is offline."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div>
        <h1 className={styles.title}>Create New Password</h1>
        <p className={styles.subtitle}>Enter your new password below to secure your account.</p>
      </div>
      
      {error && <div className={styles.alertDanger} style={{ padding: "10px", borderRadius: "6px", fontSize: "13px", marginBottom: "15px" }}>{error}</div>}
      {success && (
        <div style={{ display: "grid", gap: "15px" }}>
          <div className={styles.alertSuccess} style={{ padding: "10px", borderRadius: "6px", fontSize: "13px" }}>{success}</div>
          <Link className={styles.button} to="/login" style={{ textAlign: "center", textDecoration: "none" }}>
            Proceed to Login
          </Link>
        </div>
      )}

      {!success && (
        <form className={styles.form} onSubmit={onSubmit}>
          <TextField
            label="New Password"
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={loading}
          />
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Resetting Password..." : "Update Password"}
          </button>
        </form>
      )}

      <div className={styles.authLinks} style={{ marginTop: "10px" }}>
        <Link to="/login">Back to login</Link>
      </div>
    </div>
  );
}
