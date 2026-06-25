import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileUp,
  PenTool,
  UsersRound,
  Calendar,
  AlertCircle,
  Trophy,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import ActivityItem from "../../components/cards/ActivityItem";
import Badge from "../../components/common/Badge";
import ProgressBar from "../../components/common/ProgressBar";
import useAuth from "../../hooks/useAuth";
import StatCard from "../../components/common/StatCard";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import styles from "../../styles/ui.module.css";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const data = useRoleData(user);
  const [sessionMaterials] = useSessionState("lms-teacher-materials", []);
  const [sessionAssignments] = useSessionState("lms-teacher-assignments", []);
  const [sessionQuizzes] = useSessionState("lms-teacher-quizzes", []);
  
  // Performer categories states
  const [performers, setPerformers] = useState({ top: [], average: [], weak: [] });

  useEffect(() => {
    if (data.loading || !data.students) return;
    
    // Dynamically classify students into Top, Average, and Weak performers using real database-driven grades
    const classified = { top: [], average: [], weak: [] };
    
    data.students.forEach((student) => {
      const score = typeof student.averageGrade === "number" ? student.averageGrade : 0;
      
      const studentWithGrade = {
        ...student,
        avgGrade: score
      };

      if (score >= 85) {
        classified.top.push(studentWithGrade);
      } else if (score >= 50) {
        classified.average.push(studentWithGrade);
      } else {
        classified.weak.push(studentWithGrade);
      }
    });

    setPerformers(classified);
  }, [data.loading, data.students]);

  if (data.loading) {
    return (
      <section className={`${styles.page} ${styles.teacherPage}`}>
        <p className={styles.muted}>Loading your teacher workspace...</p>
      </section>
    );
  }

  const courseIds = data.courses.map((course) => course.id);
  const createdAssignments = sessionAssignments.filter((item) =>
    courseIds.includes(item.courseId),
  );
  const createdQuizzes = sessionQuizzes.filter((item) => courseIds.includes(item.courseId));
  const createdMaterials = sessionMaterials.filter((item) =>
    courseIds.includes(item.courseId),
  );
  const assignments = [...data.assignments, ...createdAssignments];
  const quizzes = [...data.quizzes, ...createdQuizzes];
  const materialCount =
    data.courses.reduce((sum, course) => sum + (course.materialsList?.length || 0), 0) +
    createdMaterials.length;
    
  const pendingGrading = assignments.reduce(
    (sum, item) => sum + Math.max((item.submissions || 0) - (item.graded || 0), 0),
    0,
  );
  const avgProgress = data.courses.length
    ? Math.round(
        data.courses.reduce((sum, course) => sum + course.progress, 0) /
          data.courses.length,
      )
    : 0;

  // Teacher Lecture Timings for Today's Schedule
  const todaySchedule = data.courses.slice(0, 3).map((c, idx) => {
    const times = ["09:00 AM", "11:00 AM", "03:00 PM"];
    return {
      time: times[idx] || "01:00 PM",
      course: c.title,
      code: c.code,
      classroom: `Lab Block - Room ${201 + idx * 3}`
    };
  });

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      {/* Hero Header Banner */}
      <section className={styles.studentHero} style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0", borderRadius: "16px", padding: "24px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", marginBottom: "24px" }}>
        <div className={styles.studentHeroContent} style={{ flex: "1 1 500px" }}>
          <Badge variant="success">Teacher Workspace</Badge>
          <h1 style={{ color: "#0f172a", fontSize: "28px", fontWeight: "800", marginTop: "8px", marginBottom: "8px" }}>Welcome back, {user.name}</h1>
          <p style={{ color: "#374151", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
            Academic Track: <strong style={{ color: "#16a34a" }}>{user.branch} Faculty</strong>. Manage lesson uploads, grading queues, online quizzes, and record daily lecture attendance sheets for your assigned student batches.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link className={styles.button} style={{ backgroundColor: "#16a34a", color: "white", textDecoration: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }} to="/teacher/materials">
              Upload study files <FileUp size={18} />
            </Link>
            <Link className={styles.buttonSecondary} style={{ backgroundColor: "white", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", textDecoration: "none" }} to="/teacher/assignments">
              Create assignment
            </Link>
          </div>
        </div>
        <aside className={styles.studentHeroPanel} style={{ flex: "0 1 300px", backgroundColor: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(8px)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.5)", padding: "20px" }}>
          <div className={styles.profileChip} style={{ marginBottom: "12px" }}>
            <span>{user.avatar}</span>
            <div>
              <strong style={{ color: "#0f172a" }}>{user.name}</strong>
              <small style={{ color: "#475569" }}>{user.branch} Department</small>
            </div>
          </div>
          <ProgressBar label="Assigned course progress" value={avgProgress} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px", textAlign: "center" }}>
            <div style={{ backgroundColor: "white", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>{assignments.length}</strong>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Assignments</span>
            </div>
            <div style={{ backgroundColor: "white", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>{quizzes.length}</strong>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Quizzes</span>
            </div>
          </div>
        </aside>
      </section>

      {/* Metric Cards */}
      <div className={styles.grid4} style={{ marginBottom: "24px" }}>
        <StatCard label="Assigned Students" value={data.students.length} meta={`${user.branch} branch`} icon={UsersRound} />
        <StatCard label="Assigned Courses" value={data.courses.length} meta="Admin mapped" icon={BookOpen} />
        <StatCard label="Pending Grading" value={pendingGrading} meta="Submissions awaiting review" icon={ClipboardCheck} />
        <StatCard label="Materials" value={materialCount} meta="Teacher uploads" icon={FileUp} />
      </div>

      {/* 4-Column Command Grid including the new Attendance sheet */}
      <div className={styles.teacherCommandGrid} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <Link to="/teacher/courses" style={{ textDecoration: "none" }}><BookOpen size={22} /><strong>Assigned Courses</strong><span>Review course details</span></Link>
        <Link to="/teacher/content" style={{ textDecoration: "none" }}><ClipboardCheck size={22} /><strong>Course Content</strong><span>Inspect modules</span></Link>
        <Link to="/teacher/quizzes" style={{ textDecoration: "none" }}><PenTool size={22} /><strong>Quiz Builder</strong><span>Create quiz boards</span></Link>
        
        {/* PURE LMS ATTENDANCE BOARD LINK */}
        <Link to="/teacher/attendance" style={{ textDecoration: "none", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}><Users size={22} style={{ color: "#16a34a" }} /><strong>Attendance Sheet</strong><span style={{ color: "#15803d" }}>Mark student attendance</span></Link>
      </div>

      {/* Dashboard Split Sections */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        
        {/* Today's schedule & Grading Queue */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}><h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={18} /> Today's Lecture Schedule</h2></div>
            <div className={styles.panelBody} style={{ padding: "20px" }}>
              {todaySchedule.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13px" }}>No lectures scheduled for today.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {todaySchedule.map((s, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "16px", borderLeft: "4px solid #16a34a", paddingLeft: "12px", paddingY: "4px" }}>
                      <div style={{ minWidth: "80px" }}>
                        <strong style={{ display: "block", fontSize: "14px", color: "#16a34a" }}>{s.time}</strong>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{s.classroom}</span>
                      </div>
                      <div>
                        <strong style={{ display: "block", fontSize: "14px", color: "#1e293b" }}>{s.course}</strong>
                        <small style={{ color: "#64748b" }}>Code: {s.code}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Grading Queue</h2></div>
            <div className={styles.panelBody}>
              <div className={styles.deadlineList}>
                {assignments.map((assignment) => (
                  <Link className={styles.deadlineItem} key={assignment.id} to="/teacher/assignments" style={{ textDecoration: "none" }}>
                    <strong>{assignment.title}</strong>
                    <small>{assignment.courseTitle} &bull; {Math.max((assignment.submissions || 0) - (assignment.graded || 0), 0)} pending</small>
                  </Link>
                ))}
              </div>
            </div>
          </article>
        </div>

        {/* Dynamic Student Comparison (Top, Average, Weak performers list) */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Trophy size={18} style={{ color: "#eab308" }} /> Student Performance Segment
            </h2>
          </div>
          <div className={styles.panelBody} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Top Performers */}
            <div>
              <strong style={{ display: "block", fontSize: "13px", color: "#15803d", borderBottom: "1px solid #dcfce7", paddingBottom: "4px", marginBottom: "8px" }}>
                ⭐ Top Performers (&ge; 85% Average)
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {performers.top.length === 0 ? (
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>No students classified yet.</span>
                ) : (
                  performers.top.map(student => (
                    <div key={student.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f0fdf4", padding: "8px 12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                      <span style={{ fontSize: "13px", color: "#14532d", fontWeight: "600" }}>{student.full_name}</span>
                      <strong style={{ fontSize: "13px", color: "#16a34a" }}>{student.avgGrade}% avg</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Average Performers */}
            <div>
              <strong style={{ display: "block", fontSize: "13px", color: "#b45309", borderBottom: "1px solid #fef3c7", paddingBottom: "4px", marginBottom: "8px" }}>
                📊 Average Performers (50% - 84% Average)
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {performers.average.length === 0 ? (
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>No students classified yet.</span>
                ) : (
                  performers.average.map(student => (
                    <div key={student.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fffbeb", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fde68a" }}>
                      <span style={{ fontSize: "13px", color: "#78350f", fontWeight: "600" }}>{student.full_name}</span>
                      <strong style={{ fontSize: "13px", color: "#d97706" }}>{student.avgGrade}% avg</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Weak Performers */}
            <div>
              <strong style={{ display: "block", fontSize: "13px", color: "#b91c1c", borderBottom: "1px solid #fee2e2", paddingBottom: "4px", marginBottom: "8px" }}>
                ⚠️ Weak Performers (&lt; 50% Average)
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {performers.weak.length === 0 ? (
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>No students in critical standings. Good job!</span>
                ) : (
                  performers.weak.map(student => (
                    <div key={student.user_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fef2f2", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                      <span style={{ fontSize: "13px", color: "#7f1d1d", fontWeight: "600" }}>{student.full_name}</span>
                      <strong style={{ fontSize: "13px", color: "#dc2626", display: "flex", alignItems: "center", gap: "4px" }}>
                        <AlertCircle size={12} /> {student.avgGrade}% avg
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </article>

      </div>

      {/* Session uploads */}
      <article className={styles.panel}>
        <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Recent Teacher Activity Uploads</h2></div>
        <div className={styles.panelBody}>
          <div className={styles.activityList}>
            {createdMaterials.slice(-3).map((material) => (
              <ActivityItem
                key={material.id}
                activity={{
                  title: `Uploaded ${material.type}: ${material.title}`,
                  detail: material.courseTitle,
                  createdAt: "This session",
                }}
              />
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}
