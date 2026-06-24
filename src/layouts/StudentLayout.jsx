import {
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  PenLine,
  UserRound,
} from "lucide-react";
import DashboardLayout from "./DashboardLayout";

const navItems = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/courses", label: "My Courses", icon: BookOpen },
  { to: "/student/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/student/quizzes", label: "Quizzes", icon: PenLine },
  { to: "/student/grades", label: "Grades", icon: GraduationCap },
  { to: "/student/notifications", label: "Notifications", icon: Bell },
  { to: "/student/profile", label: "Profile", icon: UserRound },
];

export default function StudentLayout() {
  return <DashboardLayout role="student" navItems={navItems} />;
}
