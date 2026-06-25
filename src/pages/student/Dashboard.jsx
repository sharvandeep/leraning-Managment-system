import { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Flame,
  GraduationCap,
  MessageSquare,
  PlayCircle,
  Star,
  Trophy,
  User,
  Zap,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { courseService } from "../../services/courseService";
import { assignmentService } from "../../services/assignmentService";
import { quizService } from "../../services/quizService";
import { studyTrackingService } from "../../services/studyTrackingService";
import { gamificationService } from "../../services/gamificationService";
import { attendanceService } from "../../services/attendanceService";
import { discussionService } from "../../services/discussionService";
import styles from "../../styles/ui.module.css";

// Helper to format date strings
const formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  
  // New tracking and gamification states
  const [gamification, setGamification] = useState({ streak: 1, active_days: 1, grade_average: 0, achievements: [] });
  const [bookmarks, setBookmarks] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // Calendar states
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date().getDate());

  useEffect(() => {
    if (!user) return;
    
    async function loadDashboardData() {
      try {
        // 1. Fetch courses, assignments, and quizzes
        const fetchedCourses = await courseService.getCourses();
        const courseIds = fetchedCourses.map(c => c.id);
        
        const [fetchedAssignments, fetchedQuizzes] = await Promise.all([
          assignmentService.getAssignments(courseIds),
          quizService.getQuizzes(courseIds)
        ]);

        setCourses(fetchedCourses);
        setAssignments(fetchedAssignments);
        setQuizzes(fetchedQuizzes);

        // 2. Fetch tracking, gamification, and announcements
        const [gameStatus, bookmarkedList, recentList, downloadList] = await Promise.all([
          gamificationService.getGamificationStatus().catch(() => ({ streak: 1, active_days: 1, achievements: [] })),
          studyTrackingService.getBookmarks().catch(() => []),
          studyTrackingService.getRecentlyViewed().catch(() => []),
          studyTrackingService.getDownloads().catch(() => [])
        ]);

        setGamification(gameStatus);
        setBookmarks(bookmarkedList);
        setRecentlyViewed(recentList);
        setDownloads(downloadList);

        // Fetch announcements/posts from their first course as a sample feed
        if (courseIds.length > 0) {
          const feed = await discussionService.getDiscussions(courseIds[0]).catch(() => []);
          setAnnouncements(feed.filter(p => p.is_announcement).slice(0, 3));
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load student dashboard metrics", err);
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <Loader2 className="animate-spin" size={40} style={{ color: "#0284c7", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#475569", fontSize: "16px", fontWeight: "500" }}>Loading your learning hub...</p>
      </div>
    );
  }

  // Derived metrics
  const pendingAssignments = assignments.filter(a => a.status === "Pending");
  const activeQuizzes = quizzes.filter(q => ["Open", "Scheduled"].includes(q.status));
  
  // Calculate average attendance rate across courses
  const avgAttendance = courses.length 
    ? Math.round(courses.reduce((sum, c) => sum + (c.attendance_percentage || 100), 0) / courses.length)
    : 100;

  // Calculate overall course progress average
  const overallProgress = courses.length
    ? Math.round(courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courses.length)
    : 0;

  // Generate calendar days
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  
  const monthName = currentCalendarDate.toLocaleString("default", { month: "long" });

  const prevMonthDays = Array.from({ length: firstDayIndex }, (_, i) => prevMonthTotalDays - firstDayIndex + i + 1);
  const currentMonthDays = Array.from({ length: totalDays }, (_, i) => i + 1);
  
  // Check if a day has assignments or quizzes due
  const getDayDeadlines = (day) => {
    const checkDate = new Date(year, month, day);
    const dateStr = checkDate.toISOString().split("T")[0];
    
    const dayAssignments = assignments.filter(a => a.dueDate === dateStr);
    return {
      assignments: dayAssignments,
      totalCount: dayAssignments.length
    };
  };

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  // Mock static schedule matching course list for realism
  const getTodayClasses = () => {
    if (courses.length === 0) return [];
    const timings = ["09:30 AM", "11:15 AM", "02:00 PM", "03:45 PM"];
    return courses.slice(0, 3).map((c, idx) => ({
      courseTitle: c.title,
      code: c.code,
      time: timings[idx] || "01:00 PM",
      teacher: c.teacher_name,
      room: `Building 3 - Room ${301 + idx * 2}`
    }));
  };

  const todayClasses = getTodayClasses();

  return (
    <section className={styles.page}>
      {/* 1. Futuristic Header Banner */}
      <section className={styles.studentHero} style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", borderRadius: "16px", padding: "24px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", border: "1px solid #bae6fd", marginBottom: "24px" }}>
        <div className={styles.studentHeroContent} style={{ flex: "1 1 500px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ backgroundColor: "#10b981", color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>Student cockpit</span>
            {gamification.streak > 0 && (
              <span style={{ backgroundColor: "#ffedd5", color: "#ea580c", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                <Flame size={14} fill="#ea580c" /> {gamification.streak}-Day Active Streak!
              </span>
            )}
          </div>
          <h1 style={{ color: "#0f172a", fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>Welcome back, {user.name}</h1>
          <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
            Academic Track: <strong style={{ color: "#0284c7" }}>{user.branch}</strong> &bull; Semester <strong style={{ color: "#0284c7" }}>{user.semester}</strong>. Mapped courses are synchronized in real-time with the central university register.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link to="/student/courses" className={styles.button} style={{ textDecoration: "none", backgroundColor: "#0284c7", color: "white", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Launch Classrooms <ArrowRight size={16} />
            </Link>
            <Link to="/student/assignments" className={styles.buttonSecondary} style={{ textDecoration: "none", backgroundColor: "white", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 20px", borderRadius: "8px", fontWeight: "600" }}>
              View Tasks ({pendingAssignments.length})
            </Link>
          </div>
        </div>
        
        <aside style={{ flex: "0 1 300px", backgroundColor: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(8px)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.5)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", minWidth: "260px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
              <span>Average Course Progress</span>
              <strong>{overallProgress}%</strong>
            </div>
            <div style={{ width: "100%", height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${overallProgress}%`, height: "100%", backgroundColor: "#0284c7", borderRadius: "4px", transition: "width 0.6s ease" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ textAlign: "center", backgroundColor: "white", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ display: "block", fontSize: "20px", color: "#0f172a", fontWeight: "800" }}>{courses.length}</strong>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Active Courses</span>
            </div>
            <div style={{ textAlign: "center", backgroundColor: "white", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <strong style={{ display: "block", fontSize: "20px", color: "#16a34a", fontWeight: "800" }}>{avgAttendance}%</strong>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Attendance Rate</span>
            </div>
          </div>
        </aside>
      </section>

      {/* 2. Top Metric Cards */}
      <div className={styles.grid4} style={{ marginBottom: "24px" }}>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyCenter: "center", justifyContent: "center" }}><BookOpen size={24} /></div>
          <div>
            <span style={{ display: "block", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Enrolled Courses</span>
            <strong style={{ fontSize: "22px", color: "#0f172a" }}>{courses.length}</strong>
          </div>
        </div>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyCenter: "center", justifyContent: "center" }}><ClipboardList size={24} /></div>
          <div>
            <span style={{ display: "block", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Pending Assignments</span>
            <strong style={{ fontSize: "22px", color: "#0f172a" }}>{pendingAssignments.length}</strong>
          </div>
        </div>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyCenter: "center", justifyContent: "center" }}><CalendarCheck size={24} /></div>
          <div>
            <span style={{ display: "block", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Active Quizzes</span>
            <strong style={{ fontSize: "22px", color: "#0f172a" }}>{activeQuizzes.length}</strong>
          </div>
        </div>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "8px", backgroundColor: "#faf5ff", color: "#9333ea", display: "flex", alignItems: "center", justifyCenter: "center", justifyContent: "center" }}><Trophy size={24} /></div>
          <div>
            <span style={{ display: "block", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Achievements Unlocked</span>
            <strong style={{ fontSize: "22px", color: "#0f172a" }}>
              {gamification.achievements.filter(a => a.unlocked).length} / {gamification.achievements.length}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Layout splits */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: Academic Center */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* A. Advanced Course Tracker */}
          <article className={styles.panel}>
            <div className={styles.panelHeader} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BookOpen size={18} style={{ color: "#0284c7" }} /> Advanced Course Completion Trackers
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Detailed Progress Metrics</span>
            </div>
            <div className={styles.panelBody} style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
              {courses.map((course) => (
                <div key={course.id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ backgroundColor: "#e2e8f0", color: "#475569", padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", marginRight: "8px" }}>{course.code}</span>
                      <strong style={{ color: "#0f172a", fontSize: "16px" }}>{course.title}</strong>
                      <small style={{ display: "block", color: "#64748b", marginTop: "2px" }}>Faculty: {course.teacherName}</small>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "18px", fontWeight: "800", color: "#0284c7" }}>{Math.round(course.progress)}%</span>
                      <small style={{ display: "block", color: "#64748b", fontSize: "11px" }}>Progress</small>
                    </div>
                  </div>

                  <div style={{ width: "100%", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${course.progress}%`, height: "100%", backgroundColor: "#0284c7", borderRadius: "3px" }} />
                  </div>

                  {/* 4-Column stats grid requested by user */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "4px", textAlign: "center" }}>
                    <div style={{ backgroundColor: "white", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <span style={{ display: "block", fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.025em" }}>Modules</span>
                      <strong style={{ fontSize: "14px", color: "#334155" }}>{course.modules_completed} / {course.modules_total}</strong>
                    </div>
                    <div style={{ backgroundColor: "white", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <span style={{ display: "block", fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.025em" }}>Assignments</span>
                      <strong style={{ fontSize: "14px", color: "#334155" }}>{course.assignments_submitted} / {course.assignments_total}</strong>
                    </div>
                    <div style={{ backgroundColor: "white", padding: "8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <span style={{ display: "block", fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.025em" }}>Quizzes</span>
                      <strong style={{ fontSize: "14px", color: "#334155" }}>{course.quizzes_attempted} / {course.quizzes_total}</strong>
                    </div>
                    <div style={{
                      backgroundColor: "white",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      borderColor: (course.attendance_percentage || 100) < 75 ? "#fecaca" : "#e2e8f0",
                      color: (course.attendance_percentage || 100) < 75 ? "#dc2626" : "#334155"
                    }}>
                      <span style={{ display: "block", fontSize: "10px", color: "#64748b", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.025em" }}>Attendance</span>
                      <strong style={{ fontSize: "14px" }}>{course.attendance_percentage || 100}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* B. Futuristic Calendar Widget */}
          <article className={styles.panel}>
            <div className={styles.panelHeader} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={18} style={{ color: "#0284c7" }} /> Futuristic Workspace Calendar
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button onClick={handlePrevMonth} style={{ background: "none", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "2px", cursor: "pointer", display: "flex" }}><ChevronLeft size={16} /></button>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", minWidth: "110px", textAlign: "center" }}>{monthName} {year}</span>
                <button onClick={handleNextMonth} style={{ background: "none", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "2px", cursor: "pointer", display: "flex" }}><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className={styles.panelBody} style={{ padding: "20px" }}>
              
              {/* Calendar Grid Headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", textAlign: "center", marginBottom: "8px", fontWeight: "600", fontSize: "12px", color: "#64748b" }}>
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>
              
              {/* Calendar Days */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
                {prevMonthDays.map((day, idx) => (
                  <div key={`prev-${idx}`} style={{ minHeight: "50px", padding: "4px", border: "1px solid #f1f5f9", borderRadius: "6px", color: "#cbd5e1", fontSize: "12px", backgroundColor: "#fafafa" }}>
                    {day}
                  </div>
                ))}
                
                {currentMonthDays.map((day) => {
                  const deadlines = getDayDeadlines(day);
                  const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                  const isSelected = day === selectedCalendarDay;
                  
                  return (
                    <div 
                      key={`day-${day}`} 
                      onClick={() => setSelectedCalendarDay(day)}
                      style={{ 
                        minHeight: "60px", 
                        padding: "4px", 
                        border: "1px solid #e2e8f0", 
                        borderRadius: "8px", 
                        fontSize: "12px", 
                        cursor: "pointer",
                        position: "relative",
                        transition: "all 0.2s",
                        backgroundColor: isSelected ? "#f0f9ff" : "white",
                        borderColor: isSelected ? "#0284c7" : isToday ? "#10b981" : "#e2e8f0",
                        boxShadow: isToday ? "0 0 8px rgba(16, 185, 129, 0.2)" : "none",
                        fontWeight: isToday || isSelected ? "700" : "500"
                      }}
                    >
                      <span style={{ 
                        display: "inline-block", 
                        width: "20px", 
                        height: "20px", 
                        lineHeight: "20px", 
                        textAlign: "center", 
                        borderRadius: "50%", 
                        color: isToday ? "white" : "#1e293b",
                        backgroundColor: isToday ? "#10b981" : "transparent"
                      }}>
                        {day}
                      </span>
                      
                      {/* Deadline indicators */}
                      {deadlines.totalCount > 0 && (
                        <div style={{ 
                          position: "absolute", 
                          bottom: "4px", 
                          left: "4px", 
                          right: "4px", 
                          backgroundColor: "#fef2f2", 
                          border: "1px solid #fca5a5",
                          borderRadius: "4px", 
                          padding: "2px", 
                          fontSize: "9px",
                          color: "#b91c1c",
                          textAlign: "center",
                          fontWeight: "700"
                        }}>
                          {deadlines.totalCount} Due
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Day Details Panel */}
              <div style={{ marginTop: "16px", padding: "16px", borderRadius: "8px", border: "1px dashed #cbd5e1", backgroundColor: "#fafafa" }}>
                <strong style={{ fontSize: "14px", color: "#0f172a" }}>Schedule & Deadlines for {monthName} {selectedCalendarDay}:</strong>
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {getDayDeadlines(selectedCalendarDay).totalCount === 0 ? (
                    <span style={{ fontSize: "13px", color: "#64748b" }}>No homework or assessments due on this date. Enjoy your day!</span>
                  ) : (
                    getDayDeadlines(selectedCalendarDay).assignments.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "13px", color: "#b91c1c", fontWeight: "700" }}>[Assignment Due]</span>
                        <strong style={{ fontSize: "13px", color: "#334155" }}>{a.title}</strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{a.maxMarks} Marks</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </article>

          {/* C. Course Discussion Board snippet */}
          <article className={styles.panel}>
            <div className={styles.panelHeader} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={18} style={{ color: "#0284c7" }} /> Course Announcements & Discussions
              </h2>
              <Link to="/student/notifications" style={{ fontSize: "13px", color: "#0284c7", textDecoration: "none" }}>All boards</Link>
            </div>
            <div className={styles.panelBody} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {announcements.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13px" }}>No recent course discussions or faculty announcements.</p>
              ) : (
                announcements.map((post) => (
                  <div key={post.id} style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#e0f2fe", display: "flex", alignItems: "center", justifyCenter: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#0284c7" }}>
                          {post.user_name[0]}
                        </div>
                        <div>
                          <strong style={{ fontSize: "13px", color: "#1e293b" }}>{post.user_name}</strong>
                          <span style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", marginLeft: "6px" }}>{post.user_role}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>{formatShortDate(post.created_at)}</span>
                    </div>
                    <strong style={{ display: "block", fontSize: "14px", color: "#0284c7", marginBottom: "4px" }}>{post.title}</strong>
                    <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", margin: "0" }}>{post.content}</p>
                  </div>
                ))
              )}
            </div>
          </article>

        </div>

        {/* RIGHT COLUMN: Personal Learning Hub */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* A. Today's Class Schedule */}
          <article className={styles.panel}>
            <div className={styles.panelHeader} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={18} style={{ color: "#0284c7" }} /> Today's Lecture Schedule
              </h2>
            </div>
            <div className={styles.panelBody} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {todayClasses.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13px" }}>No lectures scheduled for today.</p>
              ) : (
                todayClasses.map((lecture, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "12px", borderLeft: "4px solid #0284c7", paddingLeft: "12px", paddingY: "4px" }}>
                    <div style={{ minWidth: "70px" }}>
                      <strong style={{ display: "block", fontSize: "13px", color: "#0284c7" }}>{lecture.time}</strong>
                      <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600" }}>ROOM: {lecture.room}</span>
                    </div>
                    <div>
                      <strong style={{ display: "block", fontSize: "13px", color: "#1e293b" }}>{lecture.courseTitle}</strong>
                      <small style={{ color: "#64748b", fontSize: "11px" }}>Prof: {lecture.teacher}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          {/* B. Achievements & Gamification Badges Shelf */}
          <article className={styles.panel}>
            <div className={styles.panelHeader} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Trophy size={18} style={{ color: "#ea580c" }} /> Badges & Achievements
              </h2>
            </div>
            <div className={styles.panelBody} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {gamification.streak > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "8px", padding: "12px" }}>
                  <Flame size={32} fill="#ea580c" style={{ color: "#ea580c" }} />
                  <div>
                    <strong style={{ display: "block", fontSize: "14px", color: "#ea580c" }}>{gamification.streak} Days Continuous Learning</strong>
                    <span style={{ fontSize: "12px", color: "#9a3412" }}>Active learning streak. Visit daily to maintain!</span>
                  </div>
                </div>
              )}
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {gamification.achievements.map((badge) => (
                  <div 
                    key={badge.id} 
                    style={{ 
                      backgroundColor: badge.unlocked ? "#f8fafc" : "#f1f5f9", 
                      border: "1px solid", 
                      borderColor: badge.unlocked ? "#cbd5e1" : "#e2e8f0",
                      borderRadius: "8px", 
                      padding: "12px", 
                      textAlign: "center",
                      opacity: badge.unlocked ? 1 : 0.6,
                      boxShadow: badge.unlocked ? "0 4px 6px -1px rgba(0,0,0,0.05)" : "none"
                    }}
                  >
                    <div style={{ 
                      width: "36px", 
                      height: "36px", 
                      borderRadius: "50%", 
                      backgroundColor: badge.unlocked ? (badge.color === "gold" ? "#fef3c7" : badge.color === "cyan" ? "#ecfeff" : badge.color === "green" ? "#dcfce7" : "#faf5ff") : "#e2e8f0", 
                      color: badge.unlocked ? (badge.color === "gold" ? "#d97706" : badge.color === "cyan" ? "#0891b2" : badge.color === "green" ? "#16a34a" : "#9333ea") : "#94a3b8",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      margin: "0 auto 8px auto"
                    }}>
                      {badge.icon === "Trophy" ? <Trophy size={18} /> : badge.icon === "Award" ? <Trophy size={18} /> : badge.icon === "CalendarCheck" ? <CalendarCheck size={18} /> : <Zap size={18} />}
                    </div>
                    <strong style={{ display: "block", fontSize: "12px", color: "#1e293b" }}>{badge.title}</strong>
                    <span style={{ display: "block", fontSize: "10px", color: "#64748b", marginTop: "2px", lineHeight: "1.3" }}>{badge.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* C. WorkSpace Segment (Collapsible / Grouped Tracking Panel) */}
          <article className={styles.panel}>
            <div className={styles.panelHeader} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Star size={18} style={{ color: "#eab308" }} /> Personal Workspace Drawer
              </h2>
            </div>
            <div className={styles.panelBody} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Tab 1: Bookmarked Lessons */}
              <div>
                <strong style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#475569", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px", marginBottom: "8px" }}>
                  <Star size={14} fill="#eab308" style={{ color: "#eab308" }} /> Bookmarked Modules
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {bookmarks.length === 0 ? (
                    <span style={{ fontSize: "11px", color: "#94a3b8", paddingLeft: "4px" }}>No starred modules. Click the star icon next to modules!</span>
                  ) : (
                    bookmarks.map(b => (
                      <Link to={`/student/courses/${b.course_id}`} key={b.bookmark_id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#0284c7", textDecoration: "none", backgroundColor: "white", border: "1px solid #e2e8f0", padding: "8px", borderRadius: "6px" }}>
                        <strong>{b.module_title}</strong>
                        <span style={{ color: "#64748b" }}>{b.course_title.slice(0, 15)}...</span>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Tab 2: Recently Viewed Courses */}
              <div>
                <strong style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#475569", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px", marginBottom: "8px" }}>
                  <PlayCircle size={14} style={{ color: "#3b82f6" }} /> Recently Viewed Path
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {recentlyViewed.length === 0 ? (
                    <span style={{ fontSize: "11px", color: "#94a3b8", paddingLeft: "4px" }}>No study history found.</span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", paddingLeft: "4px" }}>
                      {recentlyViewed.map((v, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Link to={`/student/courses/${v.course_id}`} style={{ fontSize: "12px", fontWeight: "700", color: "#3b82f6", textDecoration: "none", backgroundColor: "white", border: "1px solid #dbeafe", padding: "4px 8px", borderRadius: "4px" }}>
                            {v.code}
                          </Link>
                          {idx < recentlyViewed.length - 1 && <span style={{ color: "#cbd5e1", fontSize: "11px" }}>&rarr;</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tab 3: Download History */}
              <div>
                <strong style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#475569", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px", marginBottom: "8px" }}>
                  <Download size={14} style={{ color: "#10b981" }} /> Download History Log
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {downloads.length === 0 ? (
                    <span style={{ fontSize: "11px", color: "#94a3b8", paddingLeft: "4px" }}>No downloaded materials. Click files in courses!</span>
                  ) : (
                    downloads.slice(0, 4).map(d => (
                      <div key={d.download_id} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "white", border: "1px solid #e2e8f0", padding: "8px", borderRadius: "6px", fontSize: "11px" }}>
                        <span style={{ color: "#10b981" }}><FileText size={14} /></span>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "1" }}>
                          <strong style={{ color: "#1e293b", display: "block" }}>{d.title}</strong>
                          <span style={{ color: "#64748b" }}>{d.course_title}</span>
                        </div>
                        <span style={{ color: "#94a3b8" }}>{formatShortDate(d.downloaded_at)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </article>

        </div>

      </div>

    </section>
  );
}
