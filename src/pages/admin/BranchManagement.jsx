import { Plus } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import TextField from "../../components/forms/TextField";
import DataTable from "../../components/tables/DataTable";
import { BRANCHES } from "../../utils/constants";
import styles from "../../styles/ui.module.css";

const rows = BRANCHES.map((branch, index) => ({
  id: branch,
  name: branch,
  code: branch.split(" ").map((part) => part[0]).join(""),
  courses: [3, 4, 2, 2, 1][index] || 1,
}));

export default function BranchManagement() {
  return (
    <section className={styles.page}>
      <PageHeader title="Branch Management" subtitle="Maintain academic branches used in registration, course mapping, and reporting." action={<button className={styles.button} type="button"><Plus size={18} /> Add Branch</button>} />
      <div className={styles.grid2}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><h2 className={styles.panelTitle}>Branch Form</h2></div>
          <div className={styles.panelBody}>
            <form className={styles.form}>
              <TextField label="Branch Name" />
              <TextField label="Branch Code" />
              <TextField label="Description" as="textarea" />
            </form>
          </div>
        </article>
        <article className={styles.panel}>
          <div className={styles.panelBody}>
            <DataTable
              columns={[
                { key: "name", label: "Branch" },
                { key: "code", label: "Code" },
                { key: "courses", label: "Mapped Courses" },
              ]}
              rows={rows}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
