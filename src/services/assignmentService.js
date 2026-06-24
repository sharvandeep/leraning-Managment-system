import apiClient from "./apiClient";
import { assignments } from "../mock/assignments";

const mapAssignment = (backendAsg) => {
  if (!backendAsg) return null;
  const assignmentId = backendAsg.assignment_id || backendAsg.id;
  return {
    ...backendAsg,
    id: String(assignmentId),
    courseId: String(backendAsg.course_id || backendAsg.courseId || ""),
    courseTitle: backendAsg.course_title || backendAsg.courseTitle || "Course Assignment",
    title: backendAsg.title,
    instructions: backendAsg.description || backendAsg.instructions || "",
    dueDate: backendAsg.due_date || backendAsg.dueDate || "",
    maxMarks: backendAsg.total_marks || backendAsg.maxMarks || 100,
    submissions: backendAsg.submissions || 0,
    graded: backendAsg.graded || 0,
    status: backendAsg.status || "Published",
  };
};

export const assignmentService = {
  async getAssignments(courseIds = []) {
    try {
      if (!courseIds.length) {
        // If no course filter is provided, fetch all course assignments (mock behavior or handle)
        return assignments;
      }
      
      // Query course assignments in parallel for each courseId
      const fetchPromises = courseIds.map((courseId) =>
        apiClient.get(`/courses/${courseId}/assignments`).then((res) => res.data)
      );
      
      const results = await Promise.all(fetchPromises);
      const allAssignments = results.flat().map(mapAssignment);
      return allAssignments;
    } catch (error) {
      console.warn("Backend getAssignments failed. Falling back to mock assignments.", error);
      if (!courseIds.length) return assignments;
      return assignments.filter((assignment) => courseIds.includes(assignment.courseId));
    }
  },

  async createAssignment(courseId, payload) {
    try {
      const response = await apiClient.post(`/courses/${courseId}/assignments`, {
        title: payload.title,
        description: payload.instructions || payload.description || "",
        due_date: payload.dueDate,
        total_marks: Number(payload.maxMarks) || 100,
      });
      return mapAssignment(response.data);
    } catch (error) {
      console.warn("Backend createAssignment failed. Falling back to mock response.", error);
      return { id: `asg-${Date.now()}`, ...payload, status: "Published" };
    }
  },

  async updateAssignment(assignmentId, payload) {
    try {
      const response = await apiClient.put(`/assignments/${assignmentId}`, {
        due_date: payload.dueDate,
        total_marks: Number(payload.maxMarks),
        title: payload.title,
        description: payload.instructions || payload.description,
      });
      return mapAssignment(response.data);
    } catch (error) {
      console.warn(`Backend updateAssignment ${assignmentId} failed. Falling back to mock.`, error);
      return { id: assignmentId, ...payload };
    }
  },

  async deleteAssignment(assignmentId) {
    try {
      const response = await apiClient.delete(`/assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend deleteAssignment ${assignmentId} failed. Falling back to mock.`, error);
      return { message: "deleted" };
    }
  },

  // Submissions and Grading
  async getSubmissions(assignmentId) {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}/submissions`);
      return response.data.map((sub) => ({
        ...sub,
        submissionId: String(sub.submission_id || sub.submissionId || sub.id),
        studentId: String(sub.student_id || sub.studentId),
        studentName: sub.student_name || "Student",
        submittedAt: sub.submitted_at || sub.submittedAt,
        status: sub.status || "Pending",
      }));
    } catch (error) {
      console.warn(`Backend getSubmissions for assignment ${assignmentId} failed. Falling back to empty queue.`, error);
      return [];
    }
  },

  async submitAssignment(assignmentId, file) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.warn(`Backend submitAssignment for assignment ${assignmentId} failed. Falling back to mock response.`, error);
      return { submission_id: `mock-sub-${Date.now()}`, status: "Submitted" };
    }
  },

  async gradeSubmission(submissionId, marks, feedback = "") {
    try {
      const response = await apiClient.put(`/submissions/${submissionId}`, {
        marks: Number(marks),
        feedback,
      });
      return response.data;
    } catch (error) {
      console.warn(`Backend gradeSubmission for ${submissionId} failed. Falling back to mock.`, error);
      return { submission_id: submissionId, marks, feedback, status: "Graded" };
    }
  },
};

