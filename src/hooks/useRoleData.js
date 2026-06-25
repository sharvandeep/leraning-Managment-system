import { useEffect, useState } from "react";
import { courseService } from "../services/courseService";
import { assignmentService } from "../services/assignmentService";
import { quizService } from "../services/quizService";
import { userService } from "../services/userService";

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
              ? allCourses.filter((c) => String(c.teacherId) === String(user.id))
              : allCourses;

        const courseIds = roleCourses.map((c) => c.id);

        // 2. Fetch assignments, quizzes, students, teachers in parallel
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

        // Dynamically compute the grades array for student roles
        let roleGrades = [];
        if (user.role === "student") {
          const assignmentGrades = fetchedAssignments
            .filter((asg) => asg.grade !== null && asg.grade !== undefined)
            .map((asg) => {
              const course = roleCourses.find((c) => String(c.id) === String(asg.courseId));
              return {
                id: `grade-asg-${asg.id}`,
                type: "Assignment",
                assessment: asg.title,
                courseTitle: course ? course.title : "Course Assignment",
                score: Number(asg.grade),
                maxScore: Number(asg.maxMarks),
                publishedAt: asg.submitted_at || new Date().toISOString(),
                publishedBy: course ? course.teacherName : "Faculty",
                feedback: asg.feedback || "Good effort!",
              };
            });

          const quizGrades = fetchedQuizzes
            .filter((q) => q.score !== null && q.score !== undefined)
            .map((q) => {
              const course = roleCourses.find((c) => String(c.id) === String(q.courseId));
              return {
                id: `grade-quiz-${q.id}`,
                type: "Quiz",
                assessment: q.title,
                courseTitle: course ? course.title : "Course Quiz",
                score: Number(q.score),
                maxScore: Number(q.maxScore),
                publishedAt: q.date || new Date().toISOString(),
                publishedBy: course ? course.teacherName : "Faculty",
                feedback: "Quiz completed.",
              };
            });

          roleGrades = [...assignmentGrades, ...quizGrades];
        }

        if (active) {
          setData({
            courses: roleCourses,
            assignments: fetchedAssignments,
            quizzes: fetchedQuizzes,
            grades: roleGrades,
            students: filteredStudents,
            teachers: fetchedTeachers,
            loading: false,
          });
        }
      } catch (err) {
        console.error("useRoleData fetch failed, returning empty dataset", err);
        if (active) {
          setData({
            courses: [],
            assignments: [],
            quizzes: [],
            grades: [],
            students: [],
            teachers: [],
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

