import {
  BookOpen,
  Building2,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import DashboardLayout from "./DashboardLayout";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "User Management", icon: UsersRound },
  { to: "/admin/courses", label: "Course Management", icon: BookOpen },
  { to: "/admin/branches", label: "Branch Management", icon: Building2 },
  { to: "/admin/semesters", label: "Semester Management", icon: SlidersHorizontal },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  return <DashboardLayout role="admin" navItems={navItems} />;
}
