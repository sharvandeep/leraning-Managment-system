import { useState, useEffect } from "react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import TextField from "../../components/forms/TextField";
import SelectField from "../../components/forms/SelectField";
import DataTable from "../../components/tables/DataTable";
import { courseService } from "../../services/courseService";
import { branchService } from "../../services/branchService";
import { semesterService } from "../../services/semesterService";
import { userService } from "../../services/userService";
import styles from "../../styles/ui.module.css";

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // States for inline teacher assignment
  const [selections, setSelections] = useState({});
  const [actionStatus, setActionStatus] = useState({});

  async function loadData() {
    try {
      const [courseList, branchList, semesterList, teacherList] = await Promise.all([
        courseService.getCourses(),
        branchService.getBranches(),
        semesterService.getSemesters(),
        userService.getUsers("teacher"),
      ]);
      setCourses(courseList);
      setBranches(branchList);
      setSemesters(semesterList.filter(s => s.status === "Active"));
      setTeachers(teacherList);

      // Initialize selections map
      const initialSelections = {};
      courseList.forEach((c) => {
        initialSelections[c.id] = c.teacherId || "";
      });
      setSelections(initialSelections);
    } catch (err) {
      console.error("Failed to load course management data", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (courseId, selectedTeacherId) => {
    setError("");
    setSuccess("");
    setActionStatus((prev) => ({ ...prev, [courseId]: "saving" }));
    try {
      await courseService.assignTeacher(courseId, selectedTeacherId || null);
      
      // Update local course state
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
      setSuccess("Faculty assignment updated successfully.");
      setTimeout(() => {
        setActionStatus((prev) => ({ ...prev, [courseId]: undefined }));
      }, 3000);
    } catch (err) {
      setActionStatus((prev) => ({ ...prev, [courseId]: "error" }));
      setError(err.response?.data?.detail || "Failed to assign teacher.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !branchId || !semesterId) {
      setError("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await courseService.createCourse({
        title: title.trim(),
        description: description.trim(),
        branchId: Number(branchId),
        semesterId: Number(semesterId),
        teacherId: teacherId ? Number(teacherId) : 0, // 0 means not assigned in backend
      });
      setSuccess("Course created successfully!");
      setTitle("");
      setDescription("");
      setBranchId("");
      setSemesterId("");
      setTeacherId("");
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create course. Please check your entries.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    setError("");
    setSuccess("");
    if (!window.confirm("Are you sure you want to delete this course? All modules, materials, and submissions will also be deleted.")) {
      return;
    }
    try {
      await courseService.deleteCourse(courseId);
      setSuccess("Course deleted successfully!");
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete course.");
    }
  };

  const rows = courses.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    branch: c.branch, // resolved string
    semester: c.semester, // resolved string (e.g., "Semester 1")
    teacherName: c.teacherName, // resolved teacher name
  }));

  const columns = [
    { key: "code", label: "Code" },
    { key: "title", label: "Title" },
    { key: "branch", label: "Branch" },
    { key: "semester", label: "Semester", render: (row) => <Badge>{row.semester}</Badge> },
    {
      key: "teacherName",
      label: "Assigned Faculty",
      render: (row) => {
        const course = courses.find((c) => c.id === row.id);
        const dbTeacherId = course ? (course.teacherId || "") : "";
        const currentSelection = selections[row.id] !== undefined ? selections[row.id] : dbTeacherId;
        const hasChanged = String(currentSelection) !== String(dbTeacherId);
        const status = actionStatus[row.id];

        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              className={styles.select}
              style={{ width: "160px", padding: "4px 8px", fontSize: "12px", margin: 0, height: "auto" }}
              value={currentSelection}
              onChange={(e) => setSelections((prev) => ({ ...prev, [row.id]: e.target.value }))}
            >
              <option value="">Not Assigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>

            {hasChanged && (
              <button
                className={styles.button}
                style={{ padding: "4px 8px", fontSize: "11px", width: "auto", minWidth: "50px", height: "auto" }}
                onClick={() => handleAssign(row.id, currentSelection)}
                disabled={status === "saving"}
              >
                {status === "saving" ? "..." : "Save"}
              </button>
            )}

            {status === "saved" && (
              <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold" }}>
                ✓
              </span>
            )}
            {status === "error" && (
              <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: "bold" }}>
                ✗
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          className={styles.buttonDangerCompact}
          style={{ padding: "4px 8px", fontSize: "12px" }}
          type="button"
          onClick={() => handleDelete(row.id)}
        >
          Delete
        </button>
      ),
    },
  ];

  const branchOptions = branches.map((b) => ({ value: String(b.branch_id), label: b.name }));
  const semesterOptions = semesters.map((s) => ({ value: String(s.semester_id), label: s.name }));
  const teacherOptions = teachers.map((t) => ({ value: String(t.id), label: `${t.name} (${t.branch || "Faculty"})` }));

  return (
    <section className={styles.page}>
      <PageHeader title="Course Management" subtitle="Admins create and map courses to branch and semester. Students receive courses from this mapping." />
      
      {error && <div className={styles.alertDanger}>{error}</div>}
      {success && <div className={styles.alertSuccess}>{success}</div>}

      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Create & Assign Course</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <TextField 
                label="Course Title" 
                placeholder="e.g., Database Management Systems" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
              <div className={styles.formGrid}>
                <SelectField 
                  label="Branch" 
                  options={branchOptions} 
                  value={branchId} 
                  onChange={(e) => setBranchId(e.target.value)} 
                  required 
                />
                <SelectField 
                  label="Semester" 
                  options={semesterOptions} 
                  value={semesterId} 
                  onChange={(e) => setSemesterId(e.target.value)} 
                  required 
                />
              </div>
              <SelectField 
                label="Assign Teacher" 
                options={teacherOptions} 
                value={teacherId} 
                onChange={(e) => setTeacherId(e.target.value)} 
                required 
              />
              <TextField 
                label="Description" 
                as="textarea" 
                placeholder="Enter course syllabus or outline..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
              <button className={styles.button} type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Course"}
              </button>
            </form>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Quick Stats</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.bulletList} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><strong>Total Courses in DB:</strong> {courses.length}</div>
              <div><strong>Branches Mapped:</strong> {branches.length}</div>
              <div><strong>Active Semesters:</strong> {semesters.length}</div>
              <div><strong>Teachers Available:</strong> {teachers.length}</div>
            </div>
          </div>
        </article>
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Active Courses</h2></div>
        <div className={styles.panelBody}>
          {courses.length === 0 ? (
            <p>No courses registered yet.</p>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </div>
      </article>
    </section>
  );
}
