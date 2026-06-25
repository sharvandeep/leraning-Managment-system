import { useEffect, useState } from "react";
import { Users, Calendar, CheckCircle2, XCircle, Save, Loader2 } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import { courseService } from "../../services/courseService";
import { attendanceService } from "../../services/attendanceService";
import styles from "../../styles/ui.module.css";

export default function AttendanceManagement() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: 'Present' | 'Absent' }
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Load teacher's assigned courses on mount
  useEffect(() => {
    courseService.getCourses()
      .then((res) => {
        setCourses(res);
        if (res.length > 0) {
          setSelectedCourseId(res[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch courses for attendance", err);
        setError("Failed to load assigned courses.");
        setLoading(false);
      });
  }, []);

  // Fetch enrolled students and their attendance logs when course or date changes
  useEffect(() => {
    if (!selectedCourseId) return;

    setLoading(true);
    setError("");
    setSuccess("");

    attendanceService.getCourseAttendance(selectedCourseId)
      .then((res) => {
        setStudents(res.students || []);
        
        // Initialize attendance records for the selected date
        const initialRecords = {};
        res.students.forEach((student) => {
          // If there is already a record for this date in the history, use it. Otherwise, default to 'Present'.
          const existingStatus = student.history ? student.history[selectedDate] : null;
          initialRecords[student.student_id] = existingStatus || "Present";
        });
        setAttendanceRecords(initialRecords);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load student list for course attendance", err);
        setError("Failed to load student list for this course.");
        setLoading(false);
      });
  }, [selectedCourseId, selectedDate]);

  const handleStatusToggle = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((student) => {
      updated[student.student_id] = status;
    });
    setAttendanceRecords(updated);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCourseId) return;

    setSubmitLoading(true);
    setError("");
    setSuccess("");

    const recordsPayload = Object.keys(attendanceRecords).map((studentId) => ({
      studentId: Number(studentId),
      status: attendanceRecords[studentId]
    }));

    try {
      await attendanceService.submitAttendance({
        courseId: selectedCourseId,
        date: selectedDate,
        records: recordsPayload
      });
      setSuccess(`Attendance sheet successfully recorded for ${selectedDate}!`);
      
      // Refresh students list to update attendance percentages
      const refreshData = await attendanceService.getCourseAttendance(selectedCourseId);
      setStudents(refreshData.students || []);
      setSubmitLoading(false);
    } catch (err) {
      console.error("Failed to submit attendance sheet", err);
      setError(err.response?.data?.detail || "Failed to record attendance sheet. Please try again.");
      setSubmitLoading(false);
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <Loader2 className="animate-spin" size={40} style={{ color: "#16a34a", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#475569", fontSize: "16px", fontWeight: "500" }}>Loading attendance manager...</p>
      </div>
    );
  }

  return (
    <section className={styles.page}>
      <PageHeader title="Attendance Board" subtitle="Manage and record daily lecture attendance sheets." />

      {/* Control Panel (Course & Date selection) */}
      <div className={styles.panel} style={{ marginBottom: "24px", border: "1px solid #bbf7d0", backgroundColor: "#f0fdf4" }}>
        <div className={styles.panelBody} style={{ padding: "20px" }}>
          <form style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 250px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>Select Course</label>
              <select 
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", backgroundColor: "white", outline: "none" }}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>[{c.code}] {c.title}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px" }}>
              <label style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>Lecture Date</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", backgroundColor: "white", outline: "none" }}
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {error && <div className={styles.alert} style={{ backgroundColor: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px", marginBottom: "20px" }}>{error}</div>}
      {success && <div className={styles.alert} style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", marginBottom: "20px" }}>{success}</div>}

      {/* Students Attendance Table */}
      {selectedCourseId && (
        <article className={styles.panel}>
          <div className={styles.panelHeader} style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
            <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={18} style={{ color: "#16a34a" }} /> Students Enrollment Roll ({students.length})
            </h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                type="button" 
                onClick={() => handleMarkAll("Present")}
                style={{ backgroundColor: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
              >
                Mark All Present
              </button>
              <button 
                type="button" 
                onClick={() => handleMarkAll("Absent")}
                style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
              >
                Mark All Absent
              </button>
            </div>
          </div>
          <div className={styles.panelBody} style={{ padding: "0" }}>
            {students.length === 0 ? (
              <p style={{ color: "#64748b", padding: "30px", textAlign: "center", margin: "0" }}>No students enrolled in this course.</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600" }}>
                        <th style={{ padding: "16px 20px" }}>Student Name</th>
                        <th style={{ padding: "16px 20px" }}>Email</th>
                        <th style={{ padding: "16px 20px", textAlign: "center" }}>Current Attendance</th>
                        <th style={{ padding: "16px 20px", textAlign: "center", width: "240px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const status = attendanceRecords[student.student_id] || "Present";
                        return (
                          <tr key={student.student_id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 0.2s" }}>
                            <td style={{ padding: "14px 20px", color: "#0f172a", fontWeight: "600" }}>{student.full_name}</td>
                            <td style={{ padding: "14px 20px", color: "#475569" }}>{student.email}</td>
                            <td style={{ padding: "14px 20px", textAlign: "center" }}>
                              <span style={{ 
                                fontWeight: "700", 
                                color: student.percentage < 75 ? "#dc2626" : "#16a34a",
                                backgroundColor: student.percentage < 75 ? "#fef2f2" : "#f0fdf4",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "13px"
                              }}>
                                {student.percentage}% ({student.present_count}/{student.total_count})
                              </span>
                            </td>
                            <td style={{ padding: "14px 20px", textAlign: "center" }}>
                              <div style={{ display: "inline-flex", gap: "6px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
                                <button
                                  type="button"
                                  onClick={() => handleStatusToggle(student.student_id, "Present")}
                                  style={{
                                    border: "none",
                                    padding: "6px 16px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    backgroundColor: status === "Present" ? "#16a34a" : "transparent",
                                    color: status === "Present" ? "white" : "#475569"
                                  }}
                                >
                                  <CheckCircle2 size={12} /> Present
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusToggle(student.student_id, "Absent")}
                                  style={{
                                    border: "none",
                                    padding: "6px 16px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    backgroundColor: status === "Absent" ? "#dc2626" : "transparent",
                                    color: status === "Absent" ? "white" : "#475569"
                                  }}
                                >
                                  <XCircle size={12} /> Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Save Attendance button */}
                <div style={{ padding: "20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    style={{
                      backgroundColor: "#16a34a",
                      color: "white",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      opacity: submitLoading ? 0.7 : 1
                    }}
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} style={{ animation: "spin 1s linear infinite" }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Attendance Sheet
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>
        </article>
      )}
    </section>
  );
}
