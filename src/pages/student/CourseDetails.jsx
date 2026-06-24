import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, ClipboardList, FileText, PenLine, PlayCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Badge from "../../components/common/Badge";
import DataTable from "../../components/tables/DataTable";
import PageHeader from "../../components/common/PageHeader";
import ProgressBar from "../../components/common/ProgressBar";
import { courseService } from "../../services/courseService";
import { assignmentService } from "../../services/assignmentService";
import { quizService } from "../../services/quizService";
import { courses as mockCourses } from "../../mock/courses";
import { assignments as mockAssignments } from "../../mock/assignments";
import { quizzes as mockQuizzes } from "../../mock/quizzes";
import { grades as mockGrades } from "../../mock/grades";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function CourseDetails() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [rows, setRows] = useState([]);
  const [quizRows, setQuizRows] = useState([]);
  const [gradeRows, setGradeRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const fetchedCourse = await courseService.getCourseById(courseId);
        const fetchedAssignments = await assignmentService.getAssignments([courseId]);
        const fetchedQuizzes = await quizService.getQuizzes([courseId]);
        const fetchedGrades = mockGrades.filter((item) => String(item.courseId) === String(courseId));

        if (active) {
          setCourse(fetchedCourse);
          setRows(fetchedAssignments);
          setQuizRows(fetchedQuizzes);
          setGradeRows(fetchedGrades);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed loading course details, falling back to mock data", err);
        const matchedCourse = mockCourses.find((item) => String(item.id) === String(courseId));
        if (active) {
          setCourse(matchedCourse || null);
          setRows(mockAssignments.filter((item) => String(item.courseId) === String(courseId)));
          setQuizRows(mockQuizzes.filter((item) => String(item.courseId) === String(courseId)));
          setGradeRows(mockGrades.filter((item) => String(item.courseId) === String(courseId)));
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [courseId]);

  const completedLessons =
    course?.modules?.flatMap((module) => module.lessons || []).filter((lesson) => lesson.completed)
      .length || 0;
  const totalLessons = course?.modules?.flatMap((module) => module.lessons || []).length || 0;

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Fetching course details..." />;
  }

  if (!course) {
    return <PageHeader title="Course not found" subtitle="The selected course could not be loaded." />;
  }

  return (
    <section className={styles.page}>
      <PageHeader title={course.title} subtitle={course.description} />
      <section className={styles.courseDetailHero}>
        <div>
          <div className={styles.courseMeta}>
            <Badge>{course.code}</Badge>
            <Badge>{course.branch}</Badge>
            <Badge>Semester {course.semester}</Badge>
          </div>
          <h2>{course.title}</h2>
          <p>{course.description}</p>
          <div className={styles.heroActions}>
            <Link className={styles.button} to="/student/assignments">
              Assignments <ClipboardList size={17} />
            </Link>
            <Link className={styles.buttonSecondary} to="/student/quizzes">
              Quizzes <PenLine size={17} />
            </Link>
          </div>
        </div>
        <aside>
          <ProgressBar label="Course progress" value={course.progress} />
          <div className={styles.heroMetricGrid}>
            <div>
              <strong>{completedLessons}/{totalLessons}</strong>
              <span>Admin lessons</span>
            </div>
            <div>
              <strong>{course.materialsList.length}</strong>
              <span>Teacher files</span>
            </div>
          </div>
        </aside>
      </section>
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Course Overview</h2></div>
          <div className={styles.panelBody}>
            <p><strong>Teacher:</strong> {course.teacherName}</p>
            <p><strong>Code:</strong> {course.code}</p>
            <p><strong>Last updated:</strong> {formatDate(course.updatedAt)}</p>
            <p><strong>Total learning time:</strong> {course.totalHours} hours</p>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Content Summary</h2></div>
          <div className={styles.panelBody}>
            <p>{course.lessons} lessons</p>
            <p>{course.materials} uploaded materials</p>
            <p>{quizRows.length} quizzes configured</p>
          </div>
        </article>
      </div>
      <article className={styles.panel}>
        <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Admin-Created Lessons</h2></div>
        <div className={styles.panelBody}>
          <div className={styles.moduleList}>
            {course.modules.map((module) => (
              <section className={styles.moduleCard} key={module.id}>
                <div>
                  <Badge>{module.createdBy}</Badge>
                  <h3>{module.title}</h3>
                </div>
                <div className={styles.lessonList}>
                  {module.lessons.map((lesson) => (
                    <button className={styles.lessonItem} key={lesson.id} type="button">
                      {lesson.completed ? <CheckCircle2 size={18} /> : <PlayCircle size={18} />}
                      <span>
                        <strong>{lesson.title}</strong>
                        <small>{lesson.duration}</small>
                      </span>
                      <Badge variant={lesson.completed ? "success" : "warning"}>
                        {lesson.completed ? "Completed" : "Start"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </article>
      <article className={styles.panel}>
        <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Teacher Materials</h2></div>
        <div className={styles.panelBody}>
          <div className={styles.materialGrid}>
            {course.materialsList.map((material) => (
              <button className={styles.materialCard} key={material.id} type="button">
                <span className={styles.iconBox}><FileText size={19} /></span>
                <strong>{material.title}</strong>
                <small>{material.type} by {material.uploadedBy}</small>
                <small>{formatDate(material.uploadedAt)}</small>
              </button>
            ))}
          </div>
        </div>
      </article>
      <article className={styles.panel}>
        <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Assignments</h2></div>
        <div className={styles.panelBody}>
          <DataTable
            columns={[
              { key: "title", label: "Assignment" },
              { key: "createdBy", label: "Teacher" },
              { key: "dueDate", label: "Due Date", render: (row) => formatDate(row.dueDate) },
              { key: "studentStatus", label: "Your Status" },
              { key: "maxMarks", label: "Marks", render: (row) => row.grade ? `${row.grade}/${row.maxMarks}` : row.maxMarks },
            ]}
            rows={rows}
          />
        </div>
      </article>
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Quizzes</h2></div>
          <div className={styles.panelBody}>
            <DataTable
              columns={[
                { key: "title", label: "Quiz" },
                { key: "date", label: "Date", render: (row) => formatDate(row.date) },
                { key: "studentStatus", label: "Status" },
                { key: "score", label: "Score", render: (row) => row.score ? `${row.score}/${row.maxScore}` : "-" },
              ]}
              rows={quizRows}
            />
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Published Grades</h2></div>
          <div className={styles.panelBody}>
            <DataTable
              columns={[
                { key: "assessment", label: "Assessment" },
                { key: "type", label: "Type" },
                { key: "score", label: "Score", render: (row) => `${row.score}/${row.maxScore}` },
              ]}
              rows={gradeRows}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
