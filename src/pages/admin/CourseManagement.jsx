import { Plus } from "lucide-react";
import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import TextField from "../../components/forms/TextField";
import SelectField from "../../components/forms/SelectField";
import DataTable from "../../components/tables/DataTable";
import { courses } from "../../mock/courses";
import { BRANCHES, SEMESTERS } from "../../utils/constants";
import styles from "../../styles/ui.module.css";

export default function CourseManagement() {
  return (
    <section className={styles.page}>
      <PageHeader title="Course Management" subtitle="Admins create and map courses to branch and semester. Students receive courses from this mapping." action={<button className={styles.button} type="button"><Plus size={18} /> Add Course</button>} />
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Create Course</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form}>
              <TextField label="Course Title" />
              <TextField label="Course Code" />
              <div className={styles.formGrid}>
                <SelectField label="Branch" options={BRANCHES} />
                <SelectField label="Semester" options={SEMESTERS} />
              </div>
              <TextField label="Description" as="textarea" />
            </form>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelBody}>
            <div className={styles.chartPlaceholder}>Branch and semester mapping placeholder</div>
          </div>
        </article>
      </div>
      <article className={styles.panel}>
        <div className={styles.panelBody}>
          <DataTable
            columns={[
              { key: "code", label: "Code" },
              { key: "title", label: "Title" },
              { key: "branch", label: "Branch" },
              { key: "semester", label: "Semester", render: (row) => <Badge>Semester {row.semester}</Badge> },
              { key: "teacherName", label: "Teacher" },
            ]}
            rows={courses}
          />
        </div>
      </article>
    </section>
  );
}
