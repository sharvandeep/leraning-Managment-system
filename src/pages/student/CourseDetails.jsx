import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, FileText, PenLine, Star, MessageSquare, Send, Award, CheckCircle, Sparkles, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Badge from "../../components/common/Badge";
import DataTable from "../../components/tables/DataTable";
import PageHeader from "../../components/common/PageHeader";
import ProgressBar from "../../components/common/ProgressBar";
import { courseService } from "../../services/courseService";
import { assignmentService } from "../../services/assignmentService";
import { quizService } from "../../services/quizService";
import { studyTrackingService } from "../../services/studyTrackingService";
import { discussionService } from "../../services/discussionService";
import { aiService } from "../../services/aiService";
import { formatDate } from "../../utils/formatters";
import styles from "../../styles/ui.module.css";

const formatShortDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch (e) {
    return String(value);
  }
};


export default function CourseDetails() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
   // Custom states for tracking, bookmarks, and forums
  const [starredModules, setStarredModules] = useState({});
  const [forumPosts, setForumPosts] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  // AI Summary States
  const [summaries, setSummaries] = useState({});
  const [summariesLoading, setSummariesLoading] = useState({});

  const handleSummarize = async (material, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const id = material.material_id || material.id;
    if (summaries[id]) {
      setSummaries(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      return;
    }
    
    setSummariesLoading(prev => ({ ...prev, [id]: true }));
    try {
      const summaryText = await aiService.summarizeMaterial(
        material.title,
        material.description || `This reading material is titled "${material.title}" in the ${course?.title || "selected"} course syllabus. It has a file format of ${material.file_type || "document"}.`
      );
      setSummaries(prev => ({ ...prev, [id]: summaryText }));
    } catch (err) {
      alert("Failed to summarize material: " + err.message);
    } finally {
      setSummariesLoading(prev => ({ ...prev, [id]: false }));
    }
  };


  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const [fetchedCourse, fetchedAssignments, fetchedQuizzes] = await Promise.all([
          courseService.getCourseById(courseId),
          assignmentService.getAssignments([courseId]),
          quizService.getQuizzes([courseId]),
        ]);

        if (active) {
          setCourse(fetchedCourse);
          setAssignments(fetchedAssignments);
          setQuizzes(fetchedQuizzes);
        }

        // Parallel fetch for workspace bookmarks and classroom discussion board
        const [bookmarksList, discussionsList] = await Promise.all([
          studyTrackingService.getBookmarks().catch(() => []),
          discussionService.getDiscussions(courseId).catch(() => [])
        ]);

        if (active) {
          // Map starred modules to quickly lookup by ID
          const starredMap = {};
          bookmarksList.forEach(b => {
            starredMap[b.module_id] = true;
          });
          setStarredModules(starredMap);
          setForumPosts(discussionsList);
          setLoading(false);
        }

        // Log that the course was recently viewed (workspace path)
        await studyTrackingService.logRecentlyViewed(courseId).catch(() => {});
      } catch (err) {
        console.error("Failed loading course details from database", err);
        if (active) {
          setError("Failed to load course details. Please try again later.");
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [courseId]);

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Fetching course details..." />;
  }

  if (error || !course) {
    return <PageHeader title="Course not found" subtitle={error || "The selected course could not be loaded."} />;
  }

  const totalMaterials = course.modules?.reduce((sum, m) => sum + (m.materials?.length || 0), 0) || 0;

  // Toggle starring a module
  const handleToggleStar = async (moduleId) => {
    try {
      const res = await studyTrackingService.toggleBookmark(moduleId);
      setStarredModules(prev => ({
        ...prev,
        [moduleId]: res.starred
      }));
    } catch (err) {
      console.error("Failed to toggle module bookmark", err);
    }
  };

  // Intercept file clicks to log downloads
  const handleMaterialDownload = async (materialId) => {
    try {
      await studyTrackingService.logDownload(materialId);
    } catch (err) {
      console.error("Failed to record material download log", err);
    }
  };

  // Submit classroom discussion reply
  const handleReplySubmit = async (postId, event) => {
    if (event) event.preventDefault();
    const content = replyText[postId];
    if (!content || !content.trim()) return;

    setSubmitLoading(true);
    try {
      const newReply = await discussionService.createReply(postId, { content });
      setForumPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            replies: [...(post.replies || []), newReply]
          };
        }
        return post;
      }));
      setReplyText(prev => ({ ...prev, [postId]: "" }));
      setSubmitLoading(false);
    } catch (err) {
      console.error("Failed to submit classroom reply", err);
      setSubmitLoading(false);
    }
  };

  const handleReplyChange = (postId, value) => {
    setReplyText(prev => ({ ...prev, [postId]: value }));
  };

  return (
    <section className={styles.page}>
      <PageHeader title={course.title} subtitle={course.description} />
      
      <section className={styles.courseDetailHero} style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", border: "1px solid #cbd5e1" }}>
        <div>
          <div className={styles.courseMeta}>
            <Badge>{course.code}</Badge>
            <Badge>{course.branch}</Badge>
            <Badge>{course.semester}</Badge>
            {course.is_archived && <Badge variant="warning">Archived</Badge>}
          </div>
          <h2>{course.title}</h2>
          <p>{course.description}</p>
          <div className={styles.heroActions}>
            <Link className={styles.button} style={{ backgroundColor: "#0284c7" }} to="/student/assignments">
              Assignments <ClipboardList size={17} />
            </Link>
            <Link className={styles.buttonSecondary} to="/student/quizzes">
              Quizzes <PenLine size={17} />
            </Link>
          </div>
        </div>
        <aside style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          {/* Detailed Course Tracker breakdown in the hero panel! */}
          <ProgressBar label="Overall course progress" value={course.progress} />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "16px", textAlign: "center" }}>
            <div style={{ padding: "6px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>{course.modules_completed} / {course.modules_total}</strong>
              <span style={{ fontSize: "10px", color: "#64748b" }}>Modules Done</span>
            </div>
            <div style={{ padding: "6px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <strong style={{ display: "block", fontSize: "14px", color: "#0f172a" }}>{course.attendance_percentage || 100}%</strong>
              <span style={{ fontSize: "10px", color: "#64748b" }}>Attendance</span>
            </div>
          </div>
        </aside>
      </section>

      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Course Overview</h2></div>
          <div className={styles.panelBody}>
            <p style={{ margin: "8px 0" }}><strong>Assigned Faculty:</strong> {course.teacherName}</p>
            <p style={{ margin: "8px 0" }}><strong>Course Code:</strong> {course.code}</p>
            <p style={{ margin: "8px 0" }}><strong>Branch:</strong> {course.branch}</p>
            <p style={{ margin: "8px 0" }}><strong>Semester Mapping:</strong> {course.semester}</p>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Content Summary</h2></div>
          <div className={styles.panelBody}>
            <p style={{ margin: "8px 0" }}><strong>Modules Mapped:</strong> {course.modules?.length || 0}</p>
            <p style={{ margin: "8px 0" }}><strong>Total Materials:</strong> {totalMaterials} files uploaded</p>
            <p style={{ margin: "8px 0" }}><strong>Active Quizzes:</strong> {quizzes.length}</p>
            <p style={{ margin: "8px 0" }}><strong>Assignments:</strong> {assignments.length}</p>
          </div>
        </article>
      </div>

      {/* Syllabus, Bookmarks & Downloads */}
      <article className={styles.panel}>
        <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Course Syllabus & Materials</h2></div>
        <div className={styles.panelBody}>
          {(!course.modules || course.modules.length === 0) ? (
            <p className={styles.muted}>No modules or learning content have been configured for this course yet.</p>
          ) : (
            <div className={styles.moduleList} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {course.modules.map((module) => {
                const isStarred = starredModules[module.module_id || module.id];
                return (
                  <section className={styles.moduleCard} key={module.id || module.module_id} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', backgroundColor: 'white' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>{module.title}</h3>
                        {module.description && <p style={{ fontSize: '14px', color: '#475569', margin: '0' }}>{module.description}</p>}
                      </div>
                      
                      {/* Star Bookmark Icon Toggle */}
                      <button 
                        onClick={() => handleToggleStar(module.module_id || module.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: isStarred ? "#eab308" : "#94a3b8", display: "flex", alignItems: "center" }}
                        title={isStarred ? "Starred module" : "Star module"}
                      >
                        <Star size={20} fill={isStarred ? "#eab308" : "none"} />
                      </button>
                    </div>
                    
                    <div className={styles.lessonList} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(!module.materials || module.materials.length === 0) ? (
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0', paddingLeft: '4px' }}>No study materials uploaded for this module.</p>
                      ) : (
                        module.materials.map((material) => {
                          const materialId = material.material_id || material.id;
                          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
                          const rootBaseUrl = apiBaseUrl.replace(/\/api$/, "");
                          const fullFilePath = material.file_path.startsWith("http") 
                            ? material.file_path 
                            : `${rootBaseUrl}${material.file_path}`;
                          
                          const hasSummary = !!summaries[materialId];
                          const isSummaryLoading = !!summariesLoading[materialId];
                          
                          return (
                            <div key={materialId} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              <a 
                                className={styles.lessonItem} 
                                href={fullFilePath} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={() => handleMaterialDownload(materialId)}
                                style={{ 
                                  textDecoration: 'none', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  padding: '12px 16px',
                                  background: '#f8fafc',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  transition: "all 0.2s"
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <FileText size={18} style={{ color: '#0284c7' }} />
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ fontSize: '14px', color: '#1e293b' }}>{material.title}</strong>
                                    <small style={{ fontSize: '11px', color: '#64748b' }}>{material.file_type || "document"}</small>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  <button
                                    onClick={(e) => handleSummarize(material, e)}
                                    disabled={isSummaryLoading}
                                    style={{ 
                                      padding: "4px 10px", 
                                      borderRadius: "6px", 
                                      fontSize: "11px", 
                                      background: hasSummary ? "#f3e8ff" : "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
                                      color: hasSummary ? "#6b21a8" : "white",
                                      border: "none",
                                      cursor: "pointer",
                                      fontWeight: "600",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px"
                                    }}
                                  >
                                    <Sparkles size={11} /> {isSummaryLoading ? "Summarizing..." : hasSummary ? "Hide Summary" : "AI Summarize"}
                                  </button>
                                  <Badge variant="success">Open File</Badge>
                                </div>
                              </a>
                              
                              {/* Expanded AI Summary Panel */}
                              {isSummaryLoading && (
                                <div style={{ padding: "12px 16px", borderRadius: "8px", border: "1px dashed #c084fc", backgroundColor: "#faf5ff", fontSize: "13px", color: "#6b21a8", display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#c084fc", animation: "ping 1s infinite" }}></span>
                                  Generating study guide and summary with Gemini...
                                </div>
                              )}
                              
                              {hasSummary && !isSummaryLoading && (
                                <div style={{ 
                                  padding: "16px", 
                                  borderRadius: "8px", 
                                  border: "1px solid #e9d5ff", 
                                  backgroundColor: "#fdfaff",
                                  fontSize: "13.5px",
                                  color: "#3b0764",
                                  lineHeight: "1.6",
                                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
                                  position: "relative"
                                }}>
                                  <button 
                                    onClick={() => setSummaries(prev => {
                                      const copy = { ...prev };
                                      delete copy[materialId];
                                      return copy;
                                    })}
                                    style={{ position: "absolute", top: "8px", right: "8px", background: "none", border: "none", cursor: "pointer", color: "#a855f7" }}
                                  >
                                    <X size={14} />
                                  </button>
                                  <div style={{ whiteSpace: "pre-line" }}>
                                    {summaries[materialId]}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </article>

      {/* Classroom Discussion Forum Segment */}
      <article className={styles.panel} style={{ border: "1px solid #bae6fd", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <div className={styles.panelHeader} style={{ backgroundColor: "#f0f9ff", borderBottom: "1px solid #bae6fd" }}>
          <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0369a1" }}>
            <MessageSquare size={18} /> Classroom Discussion Forum
          </h2>
        </div>
        <div className={styles.panelBody} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {forumPosts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
              <MessageSquare size={36} style={{ color: "#cbd5e1", marginBottom: "8px" }} />
              <p style={{ margin: "0", fontSize: "14px" }}>No discussions started yet. Announcements posted by your teacher will appear here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {forumPosts.map((post) => (
                <div key={post.id} style={{ 
                  backgroundColor: "white", 
                  border: "1px solid", 
                  borderColor: post.is_announcement ? "#bae6fd" : "#e2e8f0", 
                  borderRadius: "12px", 
                  padding: "20px",
                  boxShadow: post.is_announcement ? "0 4px 12px rgba(2, 132, 199, 0.05)" : "none"
                }}>
                  {/* Post Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "50%", 
                        backgroundColor: post.is_announcement ? "#e0f2fe" : "#f1f5f9", 
                        color: post.is_announcement ? "#0369a1" : "#475569", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontWeight: "700",
                        fontSize: "14px"
                      }}>
                        {post.user_name[0]}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <strong style={{ fontSize: "14px", color: "#0f172a" }}>{post.user_name}</strong>
                          <span style={{ 
                            backgroundColor: post.is_announcement ? "#bae6fd" : "#e2e8f0", 
                            color: post.is_announcement ? "#0369a1" : "#475569", 
                            padding: "2px 6px", 
                            borderRadius: "4px", 
                            fontSize: "10px", 
                            fontWeight: "700" 
                          }}>{post.user_role.toUpperCase()}</span>
                        </div>
                        <small style={{ color: "#94a3b8", fontSize: "11px" }}>{formatDate(post.created_at)}</small>
                      </div>
                    </div>
                    {post.is_announcement && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#e0f2fe", color: "#0369a1", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>
                        <Award size={12} /> Official Announcement
                      </span>
                    )}
                  </div>

                  {/* Post Body */}
                  <strong style={{ display: "block", fontSize: "15px", color: "#0f172a", marginBottom: "6px" }}>{post.title}</strong>
                  <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", margin: "0 0 16px 0" }}>{post.content}</p>

                  {/* Replies Section */}
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {post.replies && post.replies.map((reply) => (
                      <div key={reply.id} style={{ display: "flex", gap: "10px", paddingLeft: "12px" }}>
                        <div style={{ 
                          width: "28px", 
                          height: "28px", 
                          borderRadius: "50%", 
                          backgroundColor: reply.user_role === "teacher" ? "#e0f2fe" : "#f8fafc", 
                          color: reply.user_role === "teacher" ? "#0369a1" : "#475569", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          fontWeight: "700",
                          fontSize: "12px",
                          border: "1px solid #e2e8f0"
                        }}>
                          {reply.user_name[0]}
                        </div>
                        <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "8px 12px", flex: "1", border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "12px", color: "#1e293b" }}>{reply.user_name} <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "500" }}>({reply.user_role})</span></strong>
                            <small style={{ color: "#94a3b8", fontSize: "10px" }}>{formatShortDate(reply.created_at)}</small>
                          </div>
                          <p style={{ fontSize: "13px", color: "#334155", margin: "0" }}>{reply.content}</p>
                        </div>
                      </div>
                    ))}

                    {/* Reply Input Box */}
                    <form onSubmit={(e) => handleReplySubmit(post.id, e)} style={{ display: "flex", gap: "8px", marginTop: "8px", paddingLeft: "12px" }}>
                      <input 
                        type="text" 
                        placeholder="Write a reply..."
                        value={replyText[post.id] || ""}
                        onChange={(e) => handleReplyChange(post.id, e.target.value)}
                        required
                        style={{ 
                          flex: "1", 
                          padding: "8px 12px", 
                          border: "1px solid #cbd5e1", 
                          borderRadius: "6px", 
                          fontSize: "13px", 
                          outline: "none" 
                        }}
                      />
                      <button 
                        type="submit" 
                        disabled={submitLoading}
                        style={{ 
                          backgroundColor: "#0284c7", 
                          color: "white", 
                          border: "none", 
                          borderRadius: "6px", 
                          width: "36px", 
                          height: "36px", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          cursor: "pointer",
                          opacity: submitLoading ? 0.5 : 1
                        }}
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Assignments</h2></div>
        <div className={styles.panelBody}>
          {assignments.length === 0 ? (
            <p className={styles.muted}>No assignments assigned for this course.</p>
          ) : (
            <DataTable
              columns={[
                { key: "title", label: "Assignment" },
                { key: "instructions", label: "Instructions" },
                { key: "dueDate", label: "Due Date", render: (row) => formatDate(row.dueDate) },
                { key: "status", label: "Status", render: (row) => <Badge>{row.status}</Badge> },
                { key: "maxMarks", label: "Marks", render: (row) => row.grade ? `${row.grade}/${row.maxMarks}` : row.maxMarks },
              ]}
              rows={assignments}
            />
          )}
        </div>
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Course Quizzes</h2></div>
        <div className={styles.panelBody}>
          {quizzes.length === 0 ? (
            <p className={styles.muted}>No quizzes configured for this course.</p>
          ) : (
            <DataTable
              columns={[
                { key: "title", label: "Quiz" },
                { key: "duration", label: "Duration" },
                { key: "attempts", label: "Attempts Allowed" },
                { key: "studentStatus", label: "Status", render: (row) => <Badge>{row.studentStatus}</Badge> },
                { key: "score", label: "Score", render: (row) => row.score !== null ? `${row.score}/${row.maxScore}` : "-" },
              ]}
              rows={quizzes}
            />
          )}
        </div>
      </article>
    </section>
  );
}
