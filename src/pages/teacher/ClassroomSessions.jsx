import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, Video, Plus, Trash2, Loader2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import { classroomSessionService } from "../../services/classroomSessionService";
import { useToast } from "../../context/ToastContext";
import styles from "../../styles/ui.module.css";

export default function ClassroomSessions() {
  const { user } = useAuth();
  const { courses, loading: coursesLoading } = useRoleData(user);
  const { showToast } = useToast();

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    sessionDate: "",
    startTime: "09:30 AM",
    endTime: "11:00 AM",
    room: "",
    meetingLink: "",
  });

  // Set default selected course once courses load
  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Load sessions when course selection changes
  useEffect(() => {
    if (!selectedCourseId) return;

    let active = true;
    async function loadSessions() {
      setLoadingSessions(true);
      try {
        const data = await classroomSessionService.getSessions(selectedCourseId);
        if (active) {
          setSessions(data);
          setLoadingSessions(false);
        }
      } catch (err) {
        console.error("Failed to load classroom sessions", err);
        if (active) {
          showToast("Failed to load classroom sessions", "error");
          setLoadingSessions(false);
        }
      }
    }

    loadSessions();
    return () => {
      active = false;
    };
  }, [selectedCourseId, showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    if (!form.title.trim()) {
      showToast("Please enter a session title", "error");
      return;
    }
    if (!form.sessionDate) {
      showToast("Please select a session date", "error");
      return;
    }

    setSubmitLoading(true);
    try {
      const newSession = await classroomSessionService.createSession(selectedCourseId, form);
      setSessions((prev) => [...prev, newSession].sort((a, b) => new Date(a.session_date) - new Date(b.session_date)));
      showToast("Classroom session scheduled successfully!", "success");
      
      // Reset form (keeping time defaults)
      setForm({
        title: "",
        description: "",
        sessionDate: "",
        startTime: "09:30 AM",
        endTime: "11:00 AM",
        room: "",
        meetingLink: "",
      });
    } catch (err) {
      console.error("Error creating classroom session", err);
      showToast("Failed to schedule classroom session", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this scheduled session?")) return;

    try {
      await classroomSessionService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      showToast("Classroom session deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting classroom session", err);
      showToast("Failed to delete classroom session", "error");
    }
  };

  if (coursesLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <Loader2 className="animate-spin" size={40} style={{ color: "#0284c7", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#475569" }}>Loading classroom session configurations...</p>
      </div>
    );
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Classroom Sessions Scheduler"
        subtitle="Schedule and manage live classroom sessions or online meetings for your assigned courses."
      />

      {/* Course Selector */}
      <div style={{ marginBottom: "24px", maxWidth: "400px" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
          Select Assigned Course:
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className={styles.input}
          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.title}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: Sessions List */}
        <article className={styles.panel}>
          <div className={styles.panelHeader} style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} style={{ color: "#0284c7" }} /> Scheduled Sessions ({sessions.length})
            </h2>
          </div>
          <div className={styles.panelBody} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {loadingSessions ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <Loader2 className="animate-spin" size={24} style={{ color: "#0284c7" }} />
              </div>
            ) : sessions.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "14px", textAlign: "center", padding: "24px" }}>
                No classroom sessions scheduled for this course yet.
              </p>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.session_id} 
                  style={{ 
                    border: "1px solid #e2e8f0", 
                    borderRadius: "12px", 
                    padding: "16px", 
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
                    <div>
                      <strong style={{ fontSize: "16px", color: "#0f172a" }}>{session.title}</strong>
                      {session.description && (
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>{session.description}</p>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "12px", color: "#475569", marginTop: "4px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={14} style={{ color: "#0284c7" }} />
                        {new Date(session.session_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={14} style={{ color: "#0284c7" }} />
                        {session.start_time} - {session.end_time}
                      </span>
                      {session.room && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <MapPin size={14} style={{ color: "#16a34a" }} />
                          Room: {session.room}
                        </span>
                      )}
                      {session.meeting_link && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Video size={14} style={{ color: "#a855f7" }} />
                          <a href={session.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: "#a855f7", textDecoration: "none", fontWeight: "600" }}>
                            Join Online
                          </a>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSession(session.session_id)}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: "#dc2626", 
                      cursor: "pointer", 
                      padding: "6px",
                      borderRadius: "6px",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    title="Delete Session"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </article>

        {/* RIGHT COLUMN: Schedule Form */}
        <article className={styles.panel}>
          <div className={styles.panelHeader} style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={18} style={{ color: "#0284c7" }} /> Schedule Class Session
            </h2>
          </div>
          <form onSubmit={handleCreateSession} className={styles.panelBody} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <TextField
              label="Session Title *"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              placeholder="e.g. Lecture 5: Introduction to Databases"
            />

            <TextField
              label="Brief Outline / Topic Details"
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder="Outline what students should prepare"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155", display: "block", marginBottom: "-4px" }}>
                Session Date *
              </label>
              <input 
                type="date" 
                name="sessionDate" 
                value={form.sessionDate} 
                onChange={handleInputChange}
                className={styles.input}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <TextField
                label="Start Time *"
                name="startTime"
                value={form.startTime}
                onChange={handleInputChange}
                placeholder="e.g. 09:30 AM"
              />
              <TextField
                label="End Time *"
                name="endTime"
                value={form.endTime}
                onChange={handleInputChange}
                placeholder="e.g. 11:00 AM"
              />
            </div>

            <TextField
              label="Classroom / Room Number"
              name="room"
              value={form.room}
              onChange={handleInputChange}
              placeholder="e.g. Building 3 - Room 402"
            />

            <TextField
              label="Online Meeting Link (optional)"
              name="meetingLink"
              value={form.meetingLink}
              onChange={handleInputChange}
              placeholder="e.g. https://meet.google.com/abc-defg-hij"
            />

            <button 
              type="submit" 
              className={styles.button}
              disabled={submitLoading}
              style={{ 
                width: "100%", 
                padding: "12px", 
                borderRadius: "8px", 
                backgroundColor: "#0284c7", 
                color: "white", 
                fontWeight: "700", 
                border: "none", 
                cursor: "pointer",
                marginTop: "10px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {submitLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Plus size={16} />
              )}
              Schedule Session
            </button>

          </form>
        </article>

      </div>
    </section>
  );
}
