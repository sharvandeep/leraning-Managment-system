import apiClient from "./apiClient";

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
  async getAssignments(courseIds) {
    if (courseIds && courseIds.length === 0) return [];
    
    // If no courseIds are specified, fetch all assignments from the new single backend endpoint
    if (!courseIds || !courseIds.length) {
      try {
        const response = await apiClient.get("/assignments");
        return response.data.map(mapAssignment);
      } catch (err) {
        console.error("Failed to fetch all assignments", err);
        return [];
      }
    }
    
    // Otherwise, fetch assignments for the specified course IDs
    const fetchPromises = courseIds.map((courseId) =>
      apiClient.get(`/courses/${courseId}/assignments`)
        .then((res) => res.data)
        .catch((err) => {
          console.error(`Failed to fetch assignments for course ${courseId}:`, err);
          return []; // Fail gracefully by returning an empty list for this course
        })
    );
    
    const results = await Promise.all(fetchPromises);
    return results.flat().map(mapAssignment);
  },

  async createAssignment(courseId, payload) {
    const response = await apiClient.post(`/courses/${courseId}/assignments`, {
      title: payload.title,
      description: payload.instructions || payload.description || "",
      due_date: payload.dueDate,
      total_marks: Number(payload.maxMarks) || 100,
    });
    return mapAssignment(response.data);
  },

  async updateAssignment(assignmentId, payload) {
    const response = await apiClient.put(`/assignments/${assignmentId}`, {
      due_date: payload.dueDate,
      total_marks: Number(payload.maxMarks),
      title: payload.title,
      description: payload.instructions || payload.description,
    });
    return mapAssignment(response.data);
  },

  async deleteAssignment(assignmentId) {
    const response = await apiClient.delete(`/assignments/${assignmentId}`);
    return response.data;
  },

  // Submissions and Grading
  async getSubmissions(assignmentId) {
    const response = await apiClient.get(`/assignments/${assignmentId}/submissions`);
    return response.data.map((sub) => ({
      ...sub,
      submissionId: String(sub.submission_id || sub.submissionId || sub.id),
      studentId: String(sub.student_id || sub.studentId),
      studentName: sub.student_name || "Student",
      submittedAt: sub.submitted_at || sub.submittedAt,
      status: sub.status || "Pending",
    }));
  },

  async submitAssignment(assignmentId, file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async gradeSubmission(submissionId, marks, feedback = "") {
    const response = await apiClient.put(`/submissions/${submissionId}`, {
      marks: Number(marks),
      feedback,
    });
    return response.data;
  },
};
