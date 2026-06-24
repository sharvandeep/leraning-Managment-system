import { useState } from "react";
import { Link } from "react-router-dom";
import TextField from "../../components/forms/TextField";
import { authService } from "../../services/authService";
import styles from "../../styles/ui.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    const response = await authService.forgotPassword(email);
    setMessage(response.message);
  };

  return (
    <div className={styles.authCard}>
      <div>
        <h1 className={styles.title}>Reset password</h1>
        <p className={styles.subtitle}>Enter your username or email and we will prepare reset instructions.</p>
      </div>
      {message && <div className={styles.successMessage}>{message}</div>}
      <form className={styles.form} onSubmit={onSubmit}>
        <TextField
          label="Username"
          type="email"
          placeholder="Enter username or email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button className={styles.button} type="submit">Send reset link</button>
      </form>
      <div className={styles.authLinks}>
        <Link to="/login">Back to login</Link>
      </div>
    </div>
  );
}
