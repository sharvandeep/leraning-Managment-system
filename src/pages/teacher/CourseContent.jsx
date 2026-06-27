import { useEffect, useState } from "react";
import { CheckCircle2, Eye, FileText, Layers3, PlayCircle } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import ProgressBar from "../../components/common/ProgressBar";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import { formatDate } from "../../utils/formatters";
import { courseService } from "../../services/courseService";
import API_URL from "../../services/api";
import styles from "../../styles/ui.module.css";

export default function CourseContent() {
  const { user } = useAuth();
  const { courses } = useRoleData(user);
  const [selectedCourseId, setSelectedCourseId] = useSessionState(
    "lms-teacher-content-course",
    courses[0]?.id || "",
  );
  
  const [fullCourse, setFullCourse] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);

  // Sync selectedCourseId when courses are loaded
  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId, setSelectedCourseId]);

  // Fetch full course details including modules and materials
  useEffect(() => {
    if (!selectedCourseId) {
      setFullCourse(null);
      return;
    }
    let active = true;
    setLoadingContent(true);
    courseService.getCourseById(selectedCourseId)
      .then((data) => {
        if (active) {
          setFullCourse(data);
          setLoadingContent(false);
        }
      })
      .catch((err) => {
        console.error("Failed fetching full course details in teacher content", err);
        if (active) {
          setLoadingContent(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  
  // Extract database materials
  const dbMaterials = fullCourse
    ? fullCourse.modules.flatMap((m) => m.materials || [])
    : [];
    
  const courseMaterials = dbMaterials.map((m) => ({
    id: String(m.material_id || m.id),
    courseId: selectedCourseId,
    title: m.title,
    type: m.file_type || "PDF",
    uploadedBy: "Faculty",
    uploadedAt: m.uploaded_at || new Date().toISOString(),
    file_path: m.file_path,
    status: "Published",
  }));

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Course Content Management"
        subtitle="Review admin-created lessons and manage teacher-uploaded materials for assigned courses."
      />
      <div className={styles.teacherCourseTabs}>
        {courses.map((course) => (
          <button
            className={`${styles.teacherTab} ${selectedCourseId === course.id ? styles.teacherTabActive : ""}`}
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
                <div><strong>{fullCourse?.modules?.length || 0}</strong><span>Syllabus modules</span></div>
                <div><strong>{courseMaterials.length}</strong><span>Total materials</span></div>
              </div>
            </aside>
          </section>

          <div className={styles.grid2}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Syllabus Modules & Materials</h2></div>
              <div className={styles.panelBody}>
                {loadingContent ? (
                  <p className={styles.muted}>Loading module syllabus and materials...</p>
                ) : !fullCourse || !fullCourse.modules || fullCourse.modules.length === 0 ? (
                  <p className={styles.muted}>No modules or syllabus configured for this course yet.</p>
                ) : (
                  <div className={styles.moduleList}>
                    {fullCourse.modules.map((module) => (
                      <section className={styles.moduleCard} key={module.id} style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                        <div style={{ marginBottom: '12px' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>{module.title}</h3>
                          {module.description && <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0' }}>{module.description}</p>}
                        </div>
                        <div className={styles.lessonList} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(!module.materials || module.materials.length === 0) ? (
                            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0', paddingLeft: '4px' }}>No study materials uploaded for this module.</p>
                          ) : (
                            module.materials.map((material) => {
                              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || API_URL;
                              const rootBaseUrl = apiBaseUrl.replace(/\/api$/, "");
                              const fullFilePath = material.file_path.startsWith("http") 
                                ? material.file_path 
                                : `${rootBaseUrl}${material.file_path}`;
                              return (
                                <a 
                                  className={styles.lessonItem} 
                                  key={material.material_id || material.id} 
                                  href={fullFilePath} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ 
                                    textDecoration: 'none', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FileText size={18} style={{ color: 'var(--brand)' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <strong style={{ fontSize: '14px' }}>{material.title}</strong>
                                      <small style={{ fontSize: '11px', color: 'var(--muted)' }}>{material.file_type || "document"}</small>
                                    </div>
                                  </div>
                                  <Badge variant="success">View File</Badge>
                                </a>
                              );
                            })
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </article>
            <article className={styles.panel}>
              <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Teacher Uploads</h2></div>
              <div className={styles.panelBody}>
                <div className={styles.materialGrid} style={{ display: 'grid', gap: '16px' }}>
                  {courseMaterials.length === 0 ? (
                    <p className={styles.muted}>No materials uploaded for this course yet.</p>
                  ) : (
                    courseMaterials.map((material) => {
                       const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || API_URL;
                       const rootBaseUrl = apiBaseUrl.replace(/\/api$/, "");
                       const fullFilePath = material.file_path?.startsWith("http") 
                         ? material.file_path 
                         : `${rootBaseUrl}${material.file_path}`;
                      return (
                        <article className={styles.materialCard} key={material.id} style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span className={styles.iconBox} style={{ width: '2.5rem', height: '2.5rem', display: 'grid', placeItems: 'center', borderRadius: '8px', background: 'var(--brand-soft)', color: 'var(--brand)' }}><FileText size={19} /></span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ fontSize: '14px' }}>{material.title}</strong>
                              <small style={{ fontSize: '11px', color: 'var(--muted)' }}>{material.type} - {material.uploadedBy}</small>
                            </div>
                          </div>
                          <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>Uploaded: {formatDate(material.uploadedAt)}</small>
                          <div className={styles.heroActions} style={{ display: 'flex', gap: '8px' }}>
                            <a 
                              className={styles.buttonSecondary} 
                              href={fullFilePath || "#"} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                textDecoration: 'none',
                                padding: '6px 12px',
                                fontSize: '13px',
                                borderRadius: '6px',
                                background: 'var(--panel-soft)',
                                color: 'var(--text)',
                                border: '1px solid var(--line)'
                              }}
                            >
                              <Eye size={16} /> Preview
                            </a>
                          </div>
                        </article>
                      );
                    })
                  )}
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
