import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { authService } from "../../services/authService";
import styles from "../../styles/ui.module.css";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token was found in the URL.");
      return;
    }

    authService.verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message || "Your account has been successfully verified! You can now log in.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.detail || "Invalid or expired verification token.");
      });
  }, [token]);

  return (
    <div className={styles.authCard} style={{ textAlign: "center", padding: "40px 30px" }}>
      {status === "verifying" && (
        <>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto",
            color: "#0284c7"
          }}>
            <Loader2 className="animate-spin" size={48} style={{ animation: "spin 1s linear infinite" }} />
          </div>
          <h1 className={styles.title}>Verifying account</h1>
          <p className={styles.subtitle}>Please wait while we activate your student account...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto",
            color: "#16a34a"
          }}>
            <CheckCircle2 size={32} />
          </div>
          <h1 className={styles.title}>Verification Complete</h1>
          <p className={styles.subtitle} style={{ fontSize: "15px", color: "#475569", lineHeight: "1.6", marginBottom: "30px" }}>
            {message}
          </p>
          <Link 
            to="/login" 
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
            Sign in to LearnSphear
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto",
            color: "#dc2626"
          }}>
            <XCircle size={32} />
          </div>
          <h1 className={styles.title}>Activation Failed</h1>
          <p className={styles.subtitle} style={{ fontSize: "15px", color: "#ef4444", lineHeight: "1.6", marginBottom: "30px" }}>
            {message}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link 
              to="/register" 
              className={styles.buttonSecondary}
              style={{ 
                display: "inline-block", 
                textDecoration: "none", 
                padding: "12px 24px", 
                borderRadius: "8px", 
                fontWeight: "600"
              }}
            >
              Back to signup
            </Link>
            <Link 
              to="/login" 
              className={styles.button}
              style={{ 
                display: "inline-block", 
                textDecoration: "none", 
                padding: "12px 24px", 
                borderRadius: "8px", 
                fontWeight: "600",
                backgroundColor: "#0284c7",
                color: "white"
              }}
            >
              Sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
