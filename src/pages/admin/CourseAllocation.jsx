import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/tables/DataTable";
import Badge from "../../components/common/Badge";
import { courseService } from "../../services/courseService";
import { branchService } from "../../services/branchService";
import { semesterService } from "../../services/semesterService";
import { userService } from "../../services/userService";
import styles from "../../styles/ui.module.css";

export default function CourseAllocation() {
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // Filters
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // UI status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionStatus, setActionStatus] = useState({}); // courseId -> "saving" | "saved" | "error"

  // Local dropdown selections: courseId -> teacherId
  const [selections, setSelections] = useState({});

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [courseList, branchList, semesterList, teacherList] = await Promise.all([
        courseService.getCourses(),
        branchService.getBranches(),
        semesterService.getSemesters(),
        userService.getUsers("teacher"),
      ]);
      
      setCourses(courseList);
      setBranches(branchList);
      setSemesters(semesterList);
      setTeachers(teacherList);

      // Initialize dropdown selections
      const initialSelections = {};
      courseList.forEach((c) => {
        initialSelections[c.id] = c.teacherId || "";
      });
      setSelections(initialSelections);
    } catch (err) {
      console.error("Failed to load course allocation data", err);
      setError("Failed to retrieve platform records. Ensure the backend and database are online.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (courseId) => {
    setError("");
    setSuccess("");
    const selectedTeacherId = selections[courseId];
    
    setActionStatus((prev) => ({ ...prev, [courseId]: "saving" }));
    try {
      await courseService.assignTeacher(courseId, selectedTeacherId || null);
      
      // Update the course list in state to reflect the new assignment
      setCourses((prevCourses) =>
        prevCourses.map((c) => {
          if (c.id === courseId) {
            const assignedTeacher = teachers.find(t => String(t.id) === String(selectedTeacherId));
            return {
              ...c,
              teacherId: selectedTeacherId ? String(selectedTeacherId) : "",
              teacherName: assignedTeacher ? assignedTeacher.name : "Not Assigned"
            };
          }
          return c;
        })
      );

      setActionStatus((prev) => ({ ...prev, [courseId]: "saved" }));
      setSuccess("Faculty allocation synchronized successfully!");
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setActionStatus((prev) => ({ ...prev, [courseId]: undefined }));
      }, 3000);
    } catch (err) {
      setActionStatus((prev) => ({ ...prev, [courseId]: "error" }));
      setError(err.response?.data?.detail || "Failed to assign faculty to the selected course.");
    }
  };

  // Filtered courses
  const filteredCourses = courses.filter((c) => {
    const matchesBranch = !selectedBranch || String(c.branchId) === String(selectedBranch);
    const matchesSemester = !selectedSemester || String(c.semesterId) === String(selectedSemester);
    const matchesSearch = !searchQuery || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBranch && matchesSemester && matchesSearch;
  });

  // Quick stats
  const totalCourses = courses.length;
  const assignedCoursesCount = courses.filter(c => c.teacherId).length;
  const unassignedCoursesCount = totalCourses - assignedCoursesCount;
  const totalTeachers = teachers.length;

  const branchOptions = branches.map((b) => ({ value: String(b.branch_id), label: b.name }));
  const semesterOptions = semesters.map((s) => ({ value: String(s.semester_id), label: `${s.name} (${s.status})` }));
  
  // Teachers options: Not Assigned + all teachers
  const teacherOptions = [
    { value: "", label: "Not Assigned" },
    ...teachers.map((t) => ({ value: String(t.id), label: `${t.name} (${t.branch || "Faculty"})` }))
  ];

  const columns = [
    { key: "code", label: "Code" },
    { key: "title", label: "Course Title" },
    { 
      key: "branch", 
      label: "Branch & Sem", 
      render: (row) => (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <Badge>{row.branch}</Badge>
          <Badge>{row.semester}</Badge>
        </div>
      ) 
    },
    {
      key: "assignment",
      label: "Assign Faculty Member",
      render: (row) => {
        const course = courses.find((c) => c.id === row.id);
        const dbTeacherId = course ? (course.teacherId || "") : "";
        const currentSelection = selections[row.id] || "";
        const hasChanged = String(currentSelection) !== String(dbTeacherId);
        const status = actionStatus[row.id];

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              className={styles.select}
              style={{ width: "220px", padding: "6px 12px", margin: 0 }}
              value={currentSelection}
              onChange={(e) => setSelections((prev) => ({ ...prev, [row.id]: e.target.value }))}
            >
              {teacherOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {hasChanged && (
              <button
                className={styles.button}
                style={{ padding: "6px 14px", fontSize: "12px", width: "auto", minWidth: "75px" }}
                onClick={() => handleAssign(row.id)}
                disabled={status === "saving"}
              >
                {status === "saving" ? "Saving..." : "Save"}
              </button>
            )}

            {status === "saved" && (
              <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold" }}>
                ✓ Saved
              </span>
            )}
            
            {status === "error" && (
              <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: "bold" }}>
                ✗ Error
              </span>
            )}
          </div>
        );
      }
    }
  ];

  const rows = filteredCourses.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    branch: c.branch,
    semester: c.semester,
    teacherName: c.teacherName
  }));

  if (loading) {
    return (
      <section className={styles.page}>
        <PageHeader title="Course Allocation" subtitle="Retrieving department curriculum records..." />
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <div className={styles.panelTitle}>Loading all courses and active faculty list...</div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <PageHeader 
        title="Course Allocation" 
        subtitle="Manage and allocate faculty members to branch and semester specific courses." 
      />

      {error && <div className={styles.alertDanger} style={{ marginBottom: "20px" }}>{error}</div>}
      {success && <div className={styles.alertSuccess} style={{ marginBottom: "20px" }}>{success}</div>}

      {/* Stats Cards */}
      <div className={styles.grid4} style={{ marginBottom: "24px" }}>
        <article className={styles.panel} style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "500", textTransform: "uppercase" }}>Total Curriculum Courses</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginTop: "8px", color: "#6366f1" }}>{totalCourses}</div>
        </article>
        <article className={styles.panel} style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "500", textTransform: "uppercase" }}>Allocated Courses</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginTop: "8px", color: "#10b981" }}>{assignedCoursesCount}</div>
        </article>
        <article className={styles.panel} style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "500", textTransform: "uppercase" }}>Unallocated Courses</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginTop: "8px", color: "#f59e0b" }}>{unassignedCoursesCount}</div>
        </article>
        <article className={styles.panel} style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "500", textTransform: "uppercase" }}>Registered Faculty</div>
          <div style={{ fontSize: "28px", fontWeight: "bold", marginTop: "8px", color: "#ec4899" }}>{totalTeachers}</div>
        </article>
      </div>

      {/* Filters and Table */}
      <article className={styles.panel}>
        <div className={styles.panelHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <h2 className={styles.panelTitle}>Curriculum Assignments ({filteredCourses.length})</h2>
          
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: "160px" }}>
              <select
                className={styles.select}
                style={{ padding: "6px 12px" }}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">All Branches</option>
                {branchOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div style={{ width: "160px" }}>
              <select
                className={styles.select}
                style={{ padding: "6px 12px" }}
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                <option value="">All Semesters</option>
                {semesterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div style={{ width: "200px" }}>
              <input
                className={styles.select}
                style={{ padding: "6px 12px" }}
                type="text"
                placeholder="Search course title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.panelBody} style={{ padding: 0 }}>
          {filteredCourses.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
              No curriculum courses match the current filter criteria.
            </div>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </div>
      </article>
    </section>
  );
}
