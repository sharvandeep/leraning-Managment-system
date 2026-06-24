import { Plus } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import SelectField from "../../components/forms/SelectField";
import TextField from "../../components/forms/TextField";
import DataTable from "../../components/tables/DataTable";
import { SEMESTERS } from "../../utils/constants";
import styles from "../../styles/ui.module.css";

const rows = SEMESTERS.map((semester) => ({
  id: semester,
  semester: `Semester ${semester}`,
  status: Number(semester) <= 6 ? "Active" : "Planned",
  courseSlots: Number(semester) % 2 === 0 ? 5 : 6,
}));

export default function SemesterManagement() {
  return (
    <section className={styles.page}>
      <PageHeader title="Semester Management" subtitle="Configure semester labels, active status, and course slot planning." action={<button className={styles.button} type="button"><Plus size={18} /> Add Semester</button>} />
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Semester Setup</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form}>
              <SelectField label="Semester" options={SEMESTERS} />
              <SelectField label="Status" options={["Active", "Planned", "Archived"]} />
              <TextField label="Course Slots" type="number" />
            </form>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelBody}>
            <DataTable
              columns={[
                { key: "semester", label: "Semester" },
                { key: "status", label: "Status" },
                { key: "courseSlots", label: "Course Slots" },
              ]}
              rows={rows}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
