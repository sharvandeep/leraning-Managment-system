import apiClient from "./apiClient";

const mapQuiz = (backendQuiz) => {
  if (!backendQuiz) return null;
  const quizId = backendQuiz.quiz_id || backendQuiz.id;
  return {
    ...backendQuiz,
    id: String(quizId),
    courseId: String(backendQuiz.course_id || backendQuiz.courseId || ""),
    courseTitle: backendQuiz.course_title || backendQuiz.courseTitle || "Course Quiz",
    title: backendQuiz.title,
    date: backendQuiz.date || new Date().toISOString(),
    questions: backendQuiz.total_marks ? Math.ceil(backendQuiz.total_marks / 5) : 10,
    duration: backendQuiz.time_limit ? `${backendQuiz.time_limit} min` : "30 min",
    status: backendQuiz.status || "Open",
    studentStatus: backendQuiz.student_status || backendQuiz.studentStatus || "Not Attempted",
    attempts: backendQuiz.attempts_allowed || backendQuiz.attempts || 1,
    averageScore: backendQuiz.averageScore || 0,
    maxScore: backendQuiz.total_marks || backendQuiz.maxScore || 10,
    score: backendQuiz.score !== undefined && backendQuiz.score !== null ? backendQuiz.score : null,
    topics: backendQuiz.topics || ["Core Concepts", "Assessment"],
  };
};

export const quizService = {
  async getQuizzes(courseIds) {
    if (courseIds && courseIds.length === 0) return [];
    let ids = courseIds;
    if (!ids || !ids.length) {
      // Fetch all courses first to determine which quizzes to load
      try {
        const coursesResponse = await apiClient.get("/courses");
        ids = coursesResponse.data.map(c => c.course_id || c.id);
      } catch (err) {
        console.error("Failed to fetch courses for quizzes", err);
        return [];
      }
    }

    if (!ids || !ids.length) return [];

    const fetchPromises = ids.map((courseId) =>
      apiClient.get(`/courses/${courseId}/quizzes`).then((res) => res.data)
    );

    const results = await Promise.all(fetchPromises);
    return results.flat().map(mapQuiz);
  },

  async getQuizById(quizId) {
    const response = await apiClient.get(`/quizzes/${quizId}`);
    return mapQuiz(response.data);
  },

  async createQuiz(courseId, payload) {
    const response = await apiClient.post(`/courses/${courseId}/quizzes`, {
      title: payload.title,
      total_marks: Number(payload.maxScore) || Number(payload.questions) * 5 || 10,
      time_limit: Number(payload.duration?.replace(/\D/g, "")) || 30,
      attempts_allowed: Number(payload.attempts) || 1,
    });
    return mapQuiz(response.data);
  },

  async deleteQuiz(quizId) {
    const response = await apiClient.delete(`/quizzes/${quizId}`);
    return response.data;
  },

  // Questions management
  async getQuestions(quizId) {
    const response = await apiClient.get(`/quizzes/${quizId}/questions`);
    return response.data.map((q) => ({
      ...q,
      id: String(q.question_id || q.id),
      questionText: q.question_text || q.questionText,
      questionType: q.question_type || q.questionType,
      correctOptionIndex: q.correct_option || q.correct_option_index || 0,
    }));
  },

  async createQuestion(quizId, payload) {
    const response = await apiClient.post(`/quizzes/${quizId}/questions`, {
      question_text: payload.questionText,
      question_type: payload.questionType || "mcq",
      options: payload.options,
      correct_option_index: Number(payload.correctOptionIndex) || 0,
      marks: Number(payload.marks) || 5,
    });
    return response.data;
  },

  async updateQuestion(quizId, questionId, payload) {
    const response = await apiClient.put(`/quizzes/${quizId}/questions/${questionId}`, payload);
    return response.data;
  },

  // Attempts and Results
  async submitQuizAttempt(quizId, answers) {
    const response = await apiClient.post(`/quizzes/${quizId}/attempts`, answers);
    return response.data;
  },

  async getQuizResults(quizId) {
    const response = await apiClient.get(`/quizzes/${quizId}/results`);
    return response.data.map((res) => ({
      ...res,
      studentId: String(res.student_id || res.studentId),
      studentName: res.student_name || "Student Name",
      attemptDate: res.attempt_date || res.attemptDate,
    }));
  },
};
