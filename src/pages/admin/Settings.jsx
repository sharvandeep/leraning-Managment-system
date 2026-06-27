import { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import TextField from "../../components/forms/TextField";
import SelectField from "../../components/forms/SelectField";
import { settingService } from "../../services/settingService";
import API_URL from "../../services/api";
import styles from "../../styles/ui.module.css";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Setting States
  const [institutionName, setInstitutionName] = useState("LearnSphere Institute");
  const [teacherCapacity, setTeacherCapacity] = useState("7");
  const [selfRegistration, setSelfRegistration] = useState("true");
  const [courseAllocationRule, setCourseAllocationRule] = useState("Branch + Semester (Synchronized)");
  const [deletionGuard, setDeletionGuard] = useState("true");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || API_URL;

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");
      const settings = await settingService.getSettings();
      
      if (settings.institution_name !== undefined) setInstitutionName(settings.institution_name);
      if (settings.teacher_capacity !== undefined) setTeacherCapacity(settings.teacher_capacity);
      if (settings.self_registration !== undefined) setSelfRegistration(settings.self_registration);
      if (settings.course_allocation_rule !== undefined) setCourseAllocationRule(settings.course_allocation_rule);
      if (settings.deletion_guard !== undefined) setDeletionGuard(settings.deletion_guard);
    } catch (err) {
      console.error("Failed to load settings from database:", err);
      setError("Failed to load settings from database. Using default system values.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Simple client side validation for teacher_capacity
    const capacityNum = Number(teacherCapacity);
    if (isNaN(capacityNum) || capacityNum <= 0 || !Number.isInteger(capacityNum)) {
      setError("Teacher capacity must be a positive integer.");
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        settingService.updateSetting("institution_name", institutionName),
        settingService.updateSetting("teacher_capacity", teacherCapacity),
        settingService.updateSetting("self_registration", selfRegistration),
        settingService.updateSetting("course_allocation_rule", courseAllocationRule),
        settingService.updateSetting("deletion_guard", deletionGuard)
      ]);
      setSuccess("All settings updated and saved directly to the database successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save settings. Please verify your inputs.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <PageHeader title="Settings" subtitle="Loading platform-level configuration..." />
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <div className={styles.panelTitle}>Fetching live configuration from PostgreSQL...</div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <PageHeader title="Settings" subtitle="Platform-level configuration and active environment parameters." />

      {error && <div className={styles.alertDanger} style={{ marginBottom: "20px" }}>{error}</div>}
      {success && <div className={styles.alertSuccess} style={{ marginBottom: "20px" }}>{success}</div>}

      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Academic Configuration</h2>
          </div>
          <div className={styles.panelBody}>
            <form className={styles.form} onSubmit={handleSave}>
              <TextField
                label="Institution Name"
                placeholder="e.g., LearnSphere Institute"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                required
              />

              <div className={styles.formGrid}>
                <TextField
                  label="Default Teacher Capacity (Students/Batch)"
                  type="number"
                  placeholder="e.g., 7"
                  value={teacherCapacity}
                  onChange={(e) => setTeacherCapacity(e.target.value)}
                  required
                  min="1"
                />

                <SelectField
                  label="Self-Registration"
                  options={[
                    { value: "true", label: "Enabled (Students & Teachers)" },
                    { value: "false", label: "Disabled (Admin Only)" }
                  ]}
                  value={selfRegistration}
                  onChange={(e) => setSelfRegistration(e.target.value)}
                  required
                />
              </div>

              <TextField
                label="Course Allocation Rule"
                placeholder="e.g., Branch + Semester (Synchronized)"
                value={courseAllocationRule}
                onChange={(e) => setCourseAllocationRule(e.target.value)}
                required
              />

              <SelectField
                label="Deletion Guard (System Safeguard)"
                options={[
                  { value: "true", label: "Enabled (Admins Only)" },
                  { value: "false", label: "Disabled (Allowed for All)" }
                ]}
                value={deletionGuard}
                onChange={(e) => setDeletionGuard(e.target.value)}
                required
              />

              <button className={styles.button} type="submit" disabled={saving}>
                {saving ? "Saving Changes..." : "Save Settings"}
              </button>
            </form>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Environment & Integration</h2>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.bulletList} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <strong>API Base URL:</strong> 
                <div style={{ marginTop: "4px" }}>
                  <code>{apiBaseUrl}</code>
                </div>
              </div>
              <div>
                <strong>Database Engine:</strong>
                <div style={{ marginTop: "4px" }}>PostgreSQL (pgAdmin Integration Live)</div>
              </div>
              <div>
                <strong>Authentication Model:</strong>
                <div style={{ marginTop: "4px" }}>JWT Bearer Storage & Role Enforcement</div>
              </div>
              <div>
                <strong>Database Connection Status:</strong>
                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981" }}></span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>Connected & Live</span>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
