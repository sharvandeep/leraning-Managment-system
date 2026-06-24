import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import TopNavbar from "../components/navbar/TopNavbar";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({ role, navItems }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <Sidebar role={role} items={navItems} isOpen={isSidebarOpen} />
      {isSidebarOpen && (
        <button
          aria-label="Close navigation"
          className={styles.overlay}
          type="button"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <main className={styles.main}>
        <TopNavbar onMenuClick={() => setIsSidebarOpen(true)} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
