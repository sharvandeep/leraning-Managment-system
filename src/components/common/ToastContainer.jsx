import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export default function ToastContainer({ toasts, onRemove }) {
  const containerStyle = {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 999999,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    maxWidth: "360px",
    pointerEvents: "none",
  };

  const getToastStyle = (type) => {
    const base = {
      pointerEvents: "auto",
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "16px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      backdropFilter: "blur(8px)",
      border: "1px solid",
      color: "#0f172a",
      animation: "toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      transform: "translateY(20px)",
      opacity: 0,
      fontFamily: "'Segoe UI', Roboto, sans-serif",
    };

    if (type === "success") {
      return {
        ...base,
        backgroundColor: "rgba(240, 253, 244, 0.95)", // light green
        borderColor: "#bbf7d0",
        borderLeft: "4px solid #16a34a",
      };
    }
    if (type === "error") {
      return {
        ...base,
        backgroundColor: "rgba(254, 242, 242, 0.95)", // light red
        borderColor: "#fca5a5",
        borderLeft: "4px solid #dc2626",
      };
    }
    return {
      ...base,
      backgroundColor: "rgba(240, 249, 255, 0.95)", // light blue
      borderColor: "#bae6fd",
      borderLeft: "4px solid #0284c7",
    };
  };

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <div style={containerStyle}>
        {toasts.map((toast) => {
          const style = getToastStyle(toast.type);
          const Icon = toast.type === "success" 
            ? CheckCircle2 
            : toast.type === "error" 
              ? AlertTriangle 
              : Info;
          const iconColor = toast.type === "success" 
            ? "#16a34a" 
            : toast.type === "error" 
              ? "#dc2626" 
              : "#0284c7";

          return (
            <div key={toast.id} style={style}>
              <Icon size={20} style={{ color: iconColor, flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flexGrow: 1, fontSize: "14px", fontWeight: "500", lineHeight: "1.4", color: "#1e293b" }}>
                {toast.message}
              </div>
              <button
                onClick={() => onRemove(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
