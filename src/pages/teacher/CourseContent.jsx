import { CheckCircle2, Eye, FileText, Layers3, PlayCircle } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import ProgressBar from "../../components/common/ProgressBar";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

export default function CourseContent() {
  const { user } = useAuth();
  const { courses } = useRoleData(user);
  const [sessionMaterials, setSessionMaterials] = useSessionState(
    "lms-teacher-materials",
    [],
  );
  const [selectedCourseId, setSelectedCourseId] = useSessionState(
    "lms-teacher-content-course",
    courses[0]?.id || "",
  );
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const courseMaterials = selectedCourse
    ? [
        ...selectedCourse.materialsList,
        ...sessionMaterials.filter((material) => material.courseId === selectedCourse.id),
      ]
    : [];

  const publishMaterial = (materialId) => {
    setSessionMaterials((current) =>
      current.map((material) =>
        material.id === materialId ? { ...material, status: "Published" } : material,
      ),
    );
  };

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Course Content Management"
        subtitle="Review admin-created lessons and manage teacher-uploaded materials for assigned courses."
      />
      <div className={styles.teacherCourseTabs}>
        {courses.map((course) => (
          <button
            className={selectedCourse?.id === course.id ? styles.assignmentCardActive : ""}
            key={course.id}
            type="button"
            onClick={() => setSelectedCourseId(course.id)}
          >
            <strong>{course.code}</strong>
            <span>{course.title}</span>
          </button>
        ))}
      </div>
      {selectedCourse && (
        <>
          <section className={styles.courseDetailHero}>
            <div>
              <div className={styles.courseMeta}>
                <Badge>{selectedCourse.code}</Badge>
                <Badge>{selectedCourse.branch}</Badge>
                <Badge>Semester {selectedCourse.semester}</Badge>
              </div>
              <h2>{selectedCourse.title}</h2>
              <p>{selectedCourse.description}</p>
            </div>
            <aside>
              <ProgressBar label="Student progress" value={selectedCourse.progress} />
              <div className={styles.heroMetricGrid}>
                <div><strong>{selectedCourse.lessons}</strong><span>Admin lessons</span></div>
                <div><strong>{courseMaterials.length}</strong><span>Teacher materials</span></div>
              </div>
            </aside>
          </section>

          <div className={styles.grid2}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Admin Lesson Map</h2></div>
              <div className={styles.panelBody}>
                <div className={styles.moduleList}>
                  {selectedCourse.modules.map((module) => (
                    <section className={styles.moduleCard} key={module.id}>
                      <div>
                        <Badge>{module.createdBy}</Badge>
                        <h3>{module.title}</h3>
                      </div>
                      <div className={styles.lessonList}>
                        {module.lessons.map((lesson) => (
                          <button className={styles.lessonItem} key={lesson.id} type="button">
                            {lesson.completed ? <CheckCircle2 size={18} /> : <PlayCircle size={18} />}
                            <span><strong>{lesson.title}</strong><small>{lesson.duration}</small></span>
                            <Badge variant={lesson.completed ? "success" : "warning"}>
                              {lesson.completed ? "Completed by student" : "Available"}
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
                  {courseMaterials.map((material) => (
                    <article className={styles.materialCard} key={material.id}>
                      <span className={styles.iconBox}><FileText size={19} /></span>
                      <strong>{material.title}</strong>
                      <small>{material.type} - {material.uploadedBy}</small>
                      <small>{formatDate(material.uploadedAt)}</small>
                      <div className={styles.heroActions}>
                        <button className={styles.buttonSecondary} type="button"><Eye size={16} /> Preview</button>
                        {material.status === "Draft" && (
                          <button className={styles.button} type="button" onClick={() => publishMaterial(material.id)}>
                            Publish
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </>
      )}
      {!selectedCourse && (
        <article className={styles.panel}>
          <div className={styles.panelBody}>
            <Layers3 size={22} />
            <p>No assigned courses found for {user.branch}.</p>
          </div>
        </article>
      )}
    </section>
  );
}
