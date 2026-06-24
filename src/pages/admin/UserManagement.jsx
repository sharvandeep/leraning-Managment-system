import Badge from "../../components/common/Badge";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/tables/DataTable";
import { users } from "../../mock/users";
import styles from "../../styles/ui.module.css";

export default function UserManagement() {
  const rows = users.map((user) => {
    const safeUser = { ...user };
    delete safeUser.password;
    return safeUser;
  });

  return (
    <section className={styles.page}>
      <PageHeader title="User Management" subtitle="Review students, teachers, and admin-created accounts. Frontend registration excludes admins by design." />
      <article className={styles.panel}>
        <div className={styles.panelBody}>
          <DataTable
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "role", label: "Role", render: (row) => <Badge>{row.role}</Badge> },
              { key: "branch", label: "Branch" },
              { key: "semester", label: "Semester", render: (row) => row.semester || "-" },
            ]}
            rows={rows}
          />
        </div>
      </article>
    </section>
  );
}
