import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileUp,
  LayoutDashboard,
  LibraryBig,
  PenTool,
  UserRound,
} from "lucide-react";
import DashboardLayout from "./DashboardLayout";

const navItems = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/courses", label: "Assigned Courses", icon: BookOpen },
  { to: "/teacher/content", label: "Course Content", icon: LibraryBig },
  { to: "/teacher/materials", label: "Material Upload", icon: FileUp },
  { to: "/teacher/assignments", label: "Assignments", icon: ClipboardCheck },
  { to: "/teacher/quizzes", label: "Quizzes", icon: PenTool },
  { to: "/teacher/performance", label: "Performance", icon: BarChart3 },
  { to: "/teacher/profile", label: "Profile", icon: UserRound },
];

export default function TeacherLayout() {
  return <DashboardLayout role="teacher" navItems={navItems} />;
}
