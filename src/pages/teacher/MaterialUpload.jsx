import { createElement, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, FileVideo, NotebookTabs, Upload, X } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import useSessionState from "../../hooks/useSessionState";
import { formatDate } from "../../utils/formatters";
import { courseService } from "../../services/courseService";
import { materialService } from "../../services/materialService";
import API_URL from "../../services/api";
import styles from "../../styles/ui.module.css";

const materialTypes = [
  { type: "PDF", icon: FileText, title: "PDF", accept: ".pdf" },
  { type: "Video", icon: FileVideo, title: "Video", accept: "video/*" },
  { type: "Notes", icon: NotebookTabs, title: "Notes", accept: ".txt,.md,.doc,.docx" },
];

function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function MaterialUpload() {
  const { user } = useAuth();
  const { courses, loading } = useRoleData(user);
  
  const [dbMaterials, setDbMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  
  const [selectedType, setSelectedType] = useState("PDF");
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);
  const [modules, setModules] = useState([]);
  
  const [form, setForm] = useSessionState("lms-teacher-upload-form", {
    courseId: "",
    moduleId: "",
    title: "",
    description: "",
  });

  // Sync courseId when data loads
  useEffect(() => {
    if (!form.courseId && courses.length > 0) {
      setForm((current) => ({ ...current, courseId: courses[0].id }));
    }
  }, [courses, form.courseId, setForm]);

  // Load modules and backend materials when selected course changes
  useEffect(() => {
    if (!form.courseId) return;
    let active = true;
    
    async function loadCourseDetails() {
      setLoadingMaterials(true);
      try {
        const fetchedModules = await courseService.getModules(form.courseId);
        if (active) {
          setModules(fetchedModules);
          setForm((current) => ({
            ...current,
            moduleId: fetchedModules[0]?.id || "",
          }));
        }
        
        const courseData = await courseService.getCourseById(form.courseId);
        if (active) {
          const allMats = courseData.modules.flatMap(m => 
            (m.materials || []).map(mat => ({
              id: String(mat.material_id || mat.id),
              title: mat.title,
              type: mat.file_type || "PDF",
              uploadedAt: mat.uploaded_at,
              file_path: mat.file_path,
              moduleTitle: m.title
            }))
          );
          setDbMaterials(allMats);
          setLoadingMaterials(false);
        }
      } catch (err) {
        console.error("Failed loading course details in uploader", err);
        if (active) setLoadingMaterials(false);
      }
    }
    
    loadCourseDetails();
    return () => {
      active = false;
    };
  }, [form.courseId, setForm]);

  const currentTypeConfig = materialTypes.find((item) => item.type === selectedType);

  const updateForm = (event) => {
    setError("");
    setSuccess("");
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = currentTypeConfig?.accept || "*/*";
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile({ name: file.name, size: file.size });
      setError("");
      if (!form.title.trim()) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setForm((current) => ({ ...current, title: nameWithoutExt }));
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveMaterial = async () => {
    setError("");
    setSuccess("");

    const course = courses.find((item) => item.id === form.courseId);
    if (!course) {
      setError("Please select a course.");
      return;
    }
    if (!form.title.trim()) {
      setError("Please enter a material title.");
      return;
    }
    if (!selectedFile) {
      setError("Please choose a file to upload.");
      return;
    }

    let targetModuleId = form.moduleId;
    // If no module is selected, create a default "General Materials" module
    if (!targetModuleId) {
      try {
        const defaultMod = await courseService.createModule(course.id, {
          title: "General Materials",
          description: "Default module for course materials",
          orderNum: 1,
        });
        targetModuleId = defaultMod.id;
      } catch (err) {
        console.error("Failed to create default module", err);
        setError("Failed to initialize course module for upload.");
        return;
      }
    }

    const rawFile = fileInputRef.current?.files?.[0];
    if (!rawFile) {
      setError("Please choose a file to upload.");
      return;
    }

    try {
      // Upload the file directly to the backend
      await materialService.uploadMaterial(targetModuleId, rawFile, form.title.trim());
      
      // Re-fetch course materials to update the list dynamically
      const courseData = await courseService.getCourseById(form.courseId);
      const allMats = courseData.modules.flatMap(m => 
        (m.materials || []).map(mat => ({
          id: String(mat.material_id || mat.id),
          title: mat.title,
          type: mat.file_type || "PDF",
          uploadedAt: mat.uploaded_at,
          file_path: mat.file_path,
          moduleTitle: m.title
        }))
      );
      setDbMaterials(allMats);
      
      setForm({ courseId: course.id, moduleId: targetModuleId, title: "", description: "" });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccess(`Material "${form.title.trim()}" uploaded successfully to the backend!`);
    } catch (err) {
      console.error("Failed to upload material", err);
      setError("Failed to upload material to the backend. Please try again.");
    }
  };

  if (loading) {
    return <PageHeader title="Loading..." subtitle="Loading material uploader..." />;
  }

  return (
    <section className={`${styles.page} ${styles.teacherPage}`}>
      <PageHeader
        title="Material Upload"
        subtitle="Upload PDFs, videos, and notes for assigned courses. Choose a file, fill in the details, and publish."
      />
      <div className={styles.uploadGrid}>
        {materialTypes.map((item) => (
          <UploadTile
            active={selectedType === item.type}
            icon={item.icon}
            key={item.type}
            title={`Upload ${item.title}`}
            text={`Prepare ${item.title.toLowerCase()} material for students.`}
            onClick={() => { setSelectedType(item.type); setError(""); }}
          />
        ))}
      </div>
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Material Details</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
              {error && (
                <div className={styles.alert}>
                  <AlertCircle size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.4rem" }} />
                  {error}
                </div>
              )}
              {success && <div className={styles.successMessage}>{success}</div>}
              <div className={styles.formGrid}>
                <SelectField
                  label="Course"
                  name="courseId"
                  options={courses.map((course) => ({ label: course.title, value: course.id }))}
                  value={form.courseId}
                  onChange={updateForm}
                />
                <SelectField
                  label="Module"
                  name="moduleId"
                  options={modules.length > 0 ? modules.map((m) => ({ label: m.title, value: m.id })) : [{ label: "General Materials (Auto-created)", value: "" }]}
                  value={form.moduleId}
                  onChange={updateForm}
                />
              </div>
              <div className={styles.formGrid}>
                <SelectField
                  label="Material Type"
                  options={materialTypes.map((item) => item.type)}
                  value={selectedType}
                  onChange={(event) => { setSelectedType(event.target.value); setError(""); }}
                />
                <TextField label="Title" name="title" placeholder="Material title" value={form.title} onChange={updateForm} />
              </div>
              <TextField label="Description" name="description" as="textarea" placeholder="Short material description" value={form.description} onChange={updateForm} />
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div className={styles.submissionBox}>
                <Upload size={22} />
                <div>
                  {selectedFile ? (
                    <>
                      <strong>{selectedFile.name}</strong>
                      <p>{formatFileSize(selectedFile.size)} · {selectedType}</p>
                    </>
                  ) : (
                    <>
                      <strong>No file selected</strong>
                      <p>Click "Choose file" to browse your computer.</p>
                    </>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  {selectedFile && (
                    <button className={styles.iconButton} type="button" onClick={clearFile} title="Remove file">
                      <X size={16} />
                    </button>
                  )}
                  <button className={styles.buttonSecondary} type="button" onClick={handleFileSelect}>
                    Choose file
                  </button>
                </div>
              </div>
              <div className={styles.heroActions}>
                <button className={styles.button} type="button" onClick={saveMaterial}>
                  <CheckCircle2 size={18} /> Upload to Backend
                </button>
              </div>
            </form>
          </div>
        </article>
        
        {/* Right Panel: Uploaded Materials (Backend) */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Uploaded Materials (Backend)</h2>
          </div>
          <div className={styles.panelBody}>
            {loadingMaterials ? (
              <p className={styles.muted}>Loading course materials...</p>
            ) : dbMaterials.length === 0 ? (
              <p className={styles.muted}>No materials uploaded for this course yet.</p>
            ) : (
              <div className={styles.materialGrid} style={{ display: "grid", gap: "12px" }}>
                {dbMaterials.map((material) => {
                  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || API_URL;
                  const rootBaseUrl = apiBaseUrl.replace(/\/api$/, "");
                  const fullFilePath = material.file_path?.startsWith("http") 
                    ? material.file_path 
                    : `${rootBaseUrl}${material.file_path}`;
                  return (
                    <article className={styles.materialCard} key={material.id} style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong style={{ fontSize: '14px' }}>{material.title}</strong>
                          <small style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            {material.type} · {material.moduleTitle}
                          </small>
                        </div>
                      </div>
                      <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
                        Uploaded: {formatDate(material.uploadedAt)}
                      </small>
                      <div>
                        <a 
                          className={styles.buttonSecondary} 
                          href={fullFilePath} 
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
                          Preview File
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

function UploadTile({ active, icon, title, text, onClick }) {
  return (
    <button
      className={`${styles.uploadTile} ${active ? styles.assignmentCardActive : ""}`}
      type="button"
      onClick={onClick}
    >
      <span className={styles.iconBox}>{createElement(icon, { size: 22 })}</span>
      <strong>{title}</strong>
      <p className={styles.muted}>{text}</p>
    </button>
  );
}
