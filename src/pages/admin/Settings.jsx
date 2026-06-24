import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import styles from "../../styles/ui.module.css";

export default function Settings() {
  return (
    <section className={styles.page}>
      <PageHeader title="Settings" subtitle="Platform-level settings prepared for backend configuration later." />
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Academic Settings</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form}>
              <TextField label="Institution Name" defaultValue="LearnSphere Institute" />
              <SelectField label="Current Academic Year" options={["2026-2027", "2027-2028"]} defaultValue="2026-2027" />
              <SelectField label="Course Assignment Rule" options={["Branch + Semester"]} defaultValue="Branch + Semester" />
            </form>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Integration Readiness</h2></div>
          <div className={styles.panelBody}>
            <p><strong>API Base URL:</strong> VITE_API_BASE_URL</p>
            <p><strong>Auth:</strong> Context API with token storage</p>
            <p><strong>Services:</strong> Axios client and placeholder domain services</p>
            <p><strong>Backend Target:</strong> FastAPI-compatible REST structure</p>
          </div>
        </article>
      </div>
    </section>
  );
}
