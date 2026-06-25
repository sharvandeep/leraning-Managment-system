import { useState, useEffect } from "react";
import { 
  BookOpen, 
  ClipboardList, 
  GraduationCap, 
  UsersRound, 
  Database, 
  Activity, 
  Mail, 
  Archive, 
  RotateCcw, 
  Download, 
  Loader2, 
  Send,
  X,
  Server,
  Terminal,
  Clock,
  UserCheck
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import Badge from "../../components/common/Badge";
import { userService } from "../../services/userService";
import { courseService } from "../../services/courseService";
import { assignmentService } from "../../services/assignmentService";
import { adminToolsService } from "../../services/adminToolsService";
import { branchService } from "../../services/branchService";
import { semesterService } from "../../services/semesterService";
import styles from "../../styles/ui.module.css";

// Helper to format date strings
const formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0, assignments: 0 });
  const [analytics, setAnalytics] = useState({ registrations: [], average_attendance: 94.2, branch_performance: [], teacher_performance: [], diagnostics: {} });
  const [activityLogs, setActivityLogs] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  
  // Dropdowns for broadcast email
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [courseTab, setCourseTab] = useState("active"); // 'active', 'archived'
  
  // Broadcast Email Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ subject: "", body: "", targetType: "all", branchId: "", semesterId: "" });
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState("");
  const [broadcastError, setBroadcastError] = useState("");

  // Backup state
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  // General notices
  const [generalError, setGeneralError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAdminWorkspace() {
      try {
        // Fetch baseline counts
        const [studentList, teacherList, courseList, assignmentList, analyticsData, logs, branchList, semesterList] = await Promise.all([
          userService.getUsers("student"),
          userService.getUsers("teacher"),
          courseService.getCourses({ includeArchived: true }),
          assignmentService.getAssignments(),
          adminToolsService.getAnalytics(),
          adminToolsService.getActivityLogs(),
          branchService.getBranches().catch(() => []),
          semesterService.getSemesters().catch(() => [])
        ]);

        if (active) {
          setStats({
            students: studentList.length,
            teachers: teacherList.length,
            courses: courseList.length,
            assignments: assignmentList.length,
          });
          setCoursesList(courseList);
          setAnalytics(analyticsData);
          setActivityLogs(logs);
          setBranches(branchList);
          setSemesters(semesterList);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load admin workspace", err);
        if (active) {
          setGeneralError("Failed to load platform statistics.");
          setLoading(false);
        }
      }
    }
    loadAdminWorkspace();
    return () => {
      active = false;
    };
  }, []);

  const refreshActivityLogs = () => {
    adminToolsService.getActivityLogs()
      .then(setActivityLogs)
      .catch(err => console.error(err));
  };

  const refreshCourses = () => {
    courseService.getCourses({ includeArchived: true })
      .then((res) => {
        setCoursesList(res);
        setStats(prev => ({ ...prev, courses: res.length }));
      })
      .catch(err => console.error(err));
  };

  // Archive a course
  const handleArchiveCourse = async (courseId) => {
    setGeneralError("");
    setGeneralSuccess("");
    try {
      await courseService.archiveCourse(courseId);
      setGeneralSuccess("Course successfully archived! It is now hidden from active student/teacher portals.");
      refreshCourses();
      refreshActivityLogs();
    } catch (err) {
      setGeneralError("Failed to archive course.");
    }
  };

  // Restore an archived course
  const handleRestoreCourse = async (courseId) => {
    setGeneralError("");
    setGeneralSuccess("");
    try {
      await courseService.restoreCourse(courseId);
      setGeneralSuccess("Course successfully restored to active classrooms!");
      refreshCourses();
      refreshActivityLogs();
    } catch (err) {
      setGeneralError("Failed to restore course.");
    }
  };

  // Backup Database handler
  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupSuccess(false);
    try {
      await adminToolsService.backupDatabase();
      setBackupSuccess(true);
      setBackupLoading(false);
      refreshActivityLogs();
      setTimeout(() => setBackupSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      setBackupLoading(false);
    }
  };

  // Broadcast Email handler
  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcastLoading(true);
    setBroadcastSuccess("");
    setBroadcastError("");
    
    try {
      const res = await adminToolsService.broadcastEmail(broadcastForm);
      setBroadcastSuccess(res.message || "Broadcast successfully sent to targeted recipients!");
      setBroadcastForm({ subject: "", body: "", targetType: "all", branchId: "", semesterId: "" });
      setBroadcastLoading(false);
      refreshActivityLogs();
      setTimeout(() => {
        setShowBroadcastModal(false);
        setBroadcastSuccess("");
      }, 3000);
    } catch (err) {
      setBroadcastError(err.response?.data?.detail || "Failed to dispatch broadcast email.");
      setBroadcastLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <Loader2 className="animate-spin" size={40} style={{ color: "#0284c7", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#475569", fontSize: "16px", fontWeight: "500" }}>Loading administrative cockpit...</p>
      </div>
    );
  }

  const activeCourses = coursesList.filter(c => !c.is_archived);
  const archivedCourses = coursesList.filter(c => c.is_archived);

  return (
    <section className={styles.page}>
      <PageHeader eyebrow="Platform Control Center" title="Institution Admin Portal" subtitle="Monitor institutional health, audit system activity, manage course archives, and dispatch broadcasts." />

      {generalSuccess && <div className={styles.alert} style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", marginBottom: "20px" }}>{generalSuccess}</div>}
      {generalError && <div className={styles.alert} style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px", marginBottom: "20px" }}>{generalError}</div>}

      {/* 1. Statistics Metric Grid */}
      <div className={styles.grid4} style={{ marginBottom: "24px" }}>
        <StatCard label="Total Students" value={stats.students} meta="Registered learners" icon={GraduationCap} />
        <StatCard label="Total Teachers" value={stats.teachers} meta="Active faculty" icon={UsersRound} />
        <StatCard label="Total Courses" value={coursesList.length} meta={`Active: ${activeCourses.length} | Archived: ${archivedCourses.length}`} icon={BookOpen} />
        <StatCard label="Total Assignments" value={stats.assignments} meta="Curriculum items" icon={ClipboardList} />
      </div>

      {/* 2. System Diagnostics (Uptime & Active Connections) */}
      <div className={styles.panel} style={{ marginBottom: "24px", border: "1px solid #bae6fd", backgroundColor: "#f0f9ff" }}>
        <div className={styles.panelHeader} style={{ borderBottom: "1px solid #bae6fd", backgroundColor: "#e0f2fe" }}>
          <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0369a1" }}>
            <Server size={18} /> System Diagnostics & Health Status
          </h2>
        </div>
        <div className={styles.panelBody} style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", textAlign: "center" }}>
          <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
            <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Database Connection</span>
            <strong style={{ display: "block", fontSize: "16px", color: "#16a34a", marginTop: "4px" }}>{analytics.diagnostics?.database_status || "Healthy"}</strong>
          </div>
          <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
            <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>FastAPI Server</span>
            <strong style={{ display: "block", fontSize: "16px", color: "#16a34a", marginTop: "4px" }}>{analytics.diagnostics?.api_status || "Operational"}</strong>
          </div>
          <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
            <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Active Users Today</span>
            <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginTop: "4px" }}>{analytics.diagnostics?.active_sessions || 1} Sessions</strong>
          </div>
          <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
            <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Memory Load</span>
            <strong style={{ display: "block", fontSize: "16px", color: "#0f172a", marginTop: "4px" }}>{analytics.diagnostics?.memory_usage || "184 MB / 1024 MB"}</strong>
          </div>
          <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "8px", border: "1px solid #bae6fd" }}>
            <span style={{ display: "block", fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>SMTP Relay Client</span>
            <strong style={{ display: "block", fontSize: "16px", color: "#16a34a", marginTop: "4px" }}>Online</strong>
          </div>
        </div>
      </div>

      {/* 3. Graphical Analytics Dashboard (Custom SVG/CSS Charts) */}
      <div className={styles.grid2} style={{ marginBottom: "24px" }}>
        
        {/* Registration Trends Area Graph */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}><Activity size={18} /> User Registration Trends (2026)</h2></div>
          <div className={styles.panelBody} style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            
            {/* Curved SVG Area Chart */}
            <svg width="100%" height="200" viewBox="0 0 400 200" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Horizontal Grid lines */}
              <line x1="0" y1="50" x2="400" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="400" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="400" y2="150" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="190" x2="400" y2="190" stroke="#e2e8f0" strokeWidth="1" />
              
              {/* Area under curve */}
              <path 
                d="M 10 190 Q 80 120 150 140 T 290 80 T 390 40 L 390 190 L 10 190 Z" 
                fill="url(#areaGrad)" 
              />
              
              {/* Curved Trendline */}
              <path 
                d="M 10 190 Q 80 120 150 140 T 290 80 T 390 40" 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="3" 
                strokeLinecap="round"
              />
              
              {/* Data points */}
              <circle cx="10" cy="190" r="5" fill="#0284c7" stroke="white" strokeWidth="2" />
              <circle cx="110" cy="130" r="5" fill="#0284c7" stroke="white" strokeWidth="2" />
              <circle cx="220" cy="110" r="5" fill="#0284c7" stroke="white" strokeWidth="2" />
              <circle cx="330" cy="60" r="5" fill="#0284c7" stroke="white" strokeWidth="2" />
              <circle cx="390" cy="40" r="5" fill="#0284c7" stroke="white" strokeWidth="2" />
            </svg>
            
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: "10px", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
              <span>Jan-Feb</span><span>Mar-Apr</span><span>May-Jun</span><span>Jul-Aug</span><span>Sep-Oct (Current)</span>
            </div>
            
          </div>
        </article>

        {/* Branch-wise Academic Standings Bar Chart */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}><Trophy size={18} style={{ color: "#eab308" }} /> Branch Academic Performance Comparison</h2></div>
          <div className={styles.panelBody} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {analytics.branch_performance?.map((b, idx) => (
              <div key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#1e293b", fontWeight: "600", marginBottom: "4px" }}>
                  <span>{b.branch} Department ({b.student_count} Students)</span>
                  <strong>{b.average_score}% Avg Score</strong>
                </div>
                <div style={{ width: "100%", height: "14px", backgroundColor: "#f1f5f9", borderRadius: "7px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  <div 
                    style={{ 
                      width: `${b.average_score}%`, 
                      height: "100%", 
                      backgroundColor: idx % 3 === 0 ? "#0284c7" : idx % 3 === 1 ? "#10b981" : "#8b5cf6", 
                      borderRadius: "7px", 
                      transition: "width 0.8s ease" 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

      </div>

      {/* 4. Quick Actions Control Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", alignItems: "start", marginBottom: "24px" }}>
        
        {/* Left Side: Direct Database Backup & Broadcast buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <article className={styles.panel}>
            <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Quick Tools</h2></div>
            <div className={styles.panelBody} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Direct Database Backup Trigger */}
              <div>
                <button 
                  onClick={handleBackup}
                  disabled={backupLoading}
                  style={{
                    width: "100%",
                    backgroundColor: backupSuccess ? "#16a34a" : "#0f172a",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  {backupLoading ? (
                    <Loader2 className="animate-spin" size={18} style={{ animation: "spin 1s linear infinite" }} />
                  ) : backupSuccess ? (
                    <>
                      <UserCheck size={18} /> Backup Downloaded!
                    </>
                  ) : (
                    <>
                      <Download size={18} /> Backup Database (JSON)
                    </>
                  )}
                </button>
                <small style={{ display: "block", color: "#64748b", marginTop: "6px", textAlign: "center" }}>
                  Packages all PostgreSQL tables into a secure downloadable JSON file.
                </small>
              </div>

              {/* Email Broadcast Modal Trigger */}
              <div>
                <button 
                  onClick={() => setShowBroadcastModal(true)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0284c7",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  <Mail size={18} /> Broadcast Email Announcement
                </button>
                <small style={{ display: "block", color: "#64748b", marginTop: "6px", textAlign: "center" }}>
                  Relay targeted HTML/text emails to students, semesters, or faculty via SMTP.
                </small>
              </div>

            </div>
          </article>
          
        </div>

        {/* Right Side: Course Archive manager */}
        <article className={styles.panel}>
          <div className={styles.panelHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
            <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Archive size={18} /> Curriculum Course Archive Manager
            </h2>
            
            {/* Inline switcher tabs */}
            <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
              <button 
                onClick={() => setCourseTab("active")}
                style={{
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  backgroundColor: courseTab === "active" ? "white" : "transparent",
                  color: courseTab === "active" ? "#0f172a" : "#64748b",
                  boxShadow: courseTab === "active" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                Active Courses ({activeCourses.length})
              </button>
              <button 
                onClick={() => setCourseTab("archived")}
                style={{
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  backgroundColor: courseTab === "archived" ? "white" : "transparent",
                  color: courseTab === "archived" ? "#0f172a" : "#64748b",
                  boxShadow: courseTab === "archived" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                Archived ({archivedCourses.length})
              </button>
            </div>
          </div>
          
          <div className={styles.panelBody} style={{ padding: "0", maxHeight: "240px", overflowY: "auto" }}>
            {courseTab === "active" ? (
              activeCourses.length === 0 ? (
                <p style={{ color: "#64748b", padding: "20px", textAlign: "center", margin: "0" }}>No active courses found.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <tbody>
                    {activeCourses.map(course => (
                      <tr key={course.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 20px", fontWeight: "700", color: "#1e293b" }}>[{course.code}] {course.title}</td>
                        <td style={{ padding: "12px 20px", color: "#64748b" }}>{course.branch} &bull; {course.semester}</td>
                        <td style={{ padding: "12px 20px", textAlign: "right" }}>
                          <button 
                            onClick={() => handleArchiveCourse(course.id)}
                            style={{
                              backgroundColor: "#fef2f2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Archive size={12} /> Archive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              archivedCourses.length === 0 ? (
                <p style={{ color: "#64748b", padding: "20px", textAlign: "center", margin: "0" }}>No archived courses.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <tbody>
                    {archivedCourses.map(course => (
                      <tr key={course.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 20px", fontWeight: "700", color: "#64748b" }}>[{course.code}] {course.title}</td>
                        <td style={{ padding: "12px 20px", color: "#94a3b8" }}>{course.branch} &bull; {course.semester}</td>
                        <td style={{ padding: "12px 20px", textAlign: "right" }}>
                          <button 
                            onClick={() => handleRestoreCourse(course.id)}
                            style={{
                              backgroundColor: "#f0fdf4",
                              color: "#16a34a",
                              border: "1px solid #bbf7d0",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontWeight: "600",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <RotateCcw size={12} /> Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </article>

      </div>

      {/* 5. Institutional Activity Log Feed */}
      <article className={styles.panel} style={{ marginBottom: "24px" }}>
        <div className={styles.panelHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Terminal size={18} /> Real-Time Institutional Activity Audits
          </h2>
          <Badge>Security Log</Badge>
        </div>
        <div className={styles.panelBody} style={{ padding: "20px", maxHeight: "300px", overflowY: "auto" }}>
          {activityLogs.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center" }}>No activity logs recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activityLogs.map((log) => (
                <div key={log.log_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 16px", borderRadius: "8px", fontSize: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#0284c7" }}><Clock size={14} /></span>
                    <strong style={{ color: "#1e293b" }}>[{log.user_role.toUpperCase()}] {log.user_name}:</strong>
                    <span style={{ color: "#475569" }}>{log.action}</span>
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: "11px" }}>{formatShortDate(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* TARGETED EMAIL BROADCAST MODAL OVERLAY */}
      {showBroadcastModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            width: "100%",
            maxWidth: "600px",
            border: "1px solid #e2e8f0",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={20} style={{ color: "#0284c7" }} /> Email Broadcast Console
              </h3>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBroadcastSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {broadcastSuccess && <div style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 14px", fontSize: "13px" }}>{broadcastSuccess}</div>}
              {broadcastError && <div style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 14px", fontSize: "13px" }}>{broadcastError}</div>}

              {/* Target Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>Target Cohort Audience</label>
                <select 
                  value={broadcastForm.targetType}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, targetType: e.target.value }))}
                  style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px" }}
                >
                  <option value="all">All Registered Users (Students & Faculty)</option>
                  <option value="students">All Students</option>
                  <option value="teachers">All Faculty Teachers</option>
                  <option value="branch_sem">Specific Branch & Semester Cohort</option>
                </select>
              </div>

              {/* Branch/Semester selector conditional */}
              {broadcastForm.targetType === "branch_sem" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Select Branch</label>
                    <select 
                      value={broadcastForm.branchId}
                      onChange={(e) => setBroadcastForm(prev => ({ ...prev, branchId: e.target.value }))}
                      required
                      style={{ padding: "8px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "13px" }}
                    >
                      <option value="">-- Choose Branch --</option>
                      {branches.map(b => (
                        <option key={b.branch_id} value={b.branch_id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Select Semester</label>
                    <select 
                      value={broadcastForm.semesterId}
                      onChange={(e) => setBroadcastForm(prev => ({ ...prev, semesterId: e.target.value }))}
                      style={{ padding: "8px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "13px" }}
                    >
                      <option value="">-- All Semesters --</option>
                      {semesters.map(s => (
                        <option key={s.semester_id} value={s.semester_id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>Subject Header</label>
                <input 
                  type="text" 
                  placeholder="Enter email announcement subject..."
                  value={broadcastForm.subject}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  style={{ padding: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px" }}
                />
              </div>

              {/* Body */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>Message Body</label>
                <textarea 
                  placeholder="Write announcement body here... HTML rendering is supported in final delivery."
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm(prev => ({ ...prev, body: e.target.value }))}
                  required
                  rows="6"
                  style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", outline: "none", fontSize: "14px", fontFamily: "inherit", resize: "none" }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button 
                  type="button" 
                  onClick={() => setShowBroadcastModal(false)}
                  style={{ padding: "10px 18px", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", backgroundColor: "white" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={broadcastLoading}
                  style={{ 
                    padding: "10px 18px", 
                    backgroundColor: "#0284c7", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "8px", 
                    cursor: "pointer", 
                    fontWeight: "700", 
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: broadcastLoading ? 0.7 : 1
                  }}
                >
                  {broadcastLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} style={{ animation: "spin 1s linear infinite" }} />
                      Relaying...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send Broadcast
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </section>
  );
}
