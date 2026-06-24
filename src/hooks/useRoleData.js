import { useEffect, useState } from "react";
import { courseService } from "../services/courseService";
import { assignmentService } from "../services/assignmentService";
import { quizService } from "../services/quizService";
import { userService } from "../services/userService";

import { assignments as mockAssignments } from "../mock/assignments";
import { courses as mockCourses } from "../mock/courses";
import { grades as mockGrades } from "../mock/grades";
import { quizzes as mockQuizzes } from "../mock/quizzes";
import { users as mockUsers } from "../mock/users";

export function useRoleData(user) {
  const [data, setData] = useState({
    courses: [],
    assignments: [],
    quizzes: [],
    grades: [],
    students: [],
    teachers: [],
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    let active = true;

    async function loadData() {
      try {
        // 1. Fetch courses based on role
        const allCourses = await courseService.getCourses();
        const roleCourses =
          user.role === "student"
            ? allCourses.filter(
                (c) => c.branch === user.branch && String(c.semester) === String(user.semester),
              )
            : user.role === "teacher"
              ? allCourses.filter((c) => String(c.teacherId) === String(user.id) || c.branch === user.branch)
              : allCourses;

        const courseIds = roleCourses.map((c) => c.id);

        // 2. Fetch assignments, quizzes, students, teachers, grades
        const [fetchedAssignments, fetchedQuizzes, fetchedStudents, fetchedTeachers] = await Promise.all([
          assignmentService.getAssignments(courseIds),
          quizService.getQuizzes(courseIds),
          userService.getUsers("student"),
          userService.getUsers("teacher"),
        ]);

        // Filter students according to role/branch
        const filteredStudents = fetchedStudents.filter(
          (item) => user.role !== "teacher" || item.branch === user.branch
        );

        // Fetch grades (fallback to mock grades filtered by courseId for student/teacher)
        const filteredGrades = mockGrades.filter((g) => courseIds.includes(String(g.courseId)));

        if (active) {
          setData({
            courses: roleCourses,
            assignments: fetchedAssignments,
            quizzes: fetchedQuizzes,
            grades: filteredGrades,
            students: filteredStudents,
            teachers: fetchedTeachers,
            loading: false,
          });
        }
      } catch (err) {
        console.error("useRoleData fetch failed, loading fallback mock data", err);
        // Graceful fallback to mock data
        const fallbackCourses =
          user.role === "student"
            ? mockCourses.filter(
                (c) => c.branch === user.branch && String(c.semester) === String(user.semester),
              )
            : user.role === "teacher"
              ? mockCourses.filter((c) => String(c.teacherId) === String(user.id) || c.branch === user.branch)
              : mockCourses;

        const fallbackCourseIds = fallbackCourses.map((c) => c.id);

        if (active) {
          setData({
            courses: fallbackCourses,
            assignments: mockAssignments.filter((a) => fallbackCourseIds.includes(a.courseId)),
            quizzes: mockQuizzes.filter((q) => fallbackCourseIds.includes(q.courseId)),
            grades: mockGrades.filter((g) => fallbackCourseIds.includes(g.courseId)),
            students: mockUsers.filter(
              (item) => item.role === "student" && (user.role !== "teacher" || item.branch === user.branch)
            ),
            teachers: mockUsers.filter((item) => item.role === "teacher"),
            loading: false,
          });
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user]);

  return data;
}

