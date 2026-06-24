import apiClient from "./apiClient";
import { quizzes } from "../mock/quizzes";

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
    questions: backendQuiz.total_marks ? Math.ceil(backendQuiz.total_marks / 5) : 10, // heuristic if questions count isn't returned
    duration: backendQuiz.time_limit ? `${backendQuiz.time_limit} min` : "30 min",
    status: backendQuiz.status || "Open",
    studentStatus: backendQuiz.studentStatus || "Not Attempted",
    attempts: backendQuiz.attempts_allowed || backendQuiz.attempts || 1,
    averageScore: backendQuiz.averageScore || 0,
    maxScore: backendQuiz.total_marks || backendQuiz.maxScore || 10,
    score: backendQuiz.score || null,
  };
};

export const quizService = {
  async getQuizzes(courseIds = []) {
    try {
      if (!courseIds.length) {
        return quizzes;
      }

      const fetchPromises = courseIds.map((courseId) =>
        apiClient.get(`/courses/${courseId}/quizzes`).then((res) => res.data)
      );

      const results = await Promise.all(fetchPromises);
      const allQuizzes = results.flat().map(mapQuiz);
      return allQuizzes;
    } catch (error) {
      console.warn("Backend getQuizzes failed. Falling back to mock quizzes.", error);
      if (!courseIds.length) return quizzes;
      return quizzes.filter((quiz) => courseIds.includes(quiz.courseId));
    }
  },

  async getQuizById(quizId) {
    try {
      const response = await apiClient.get(`/quizzes/${quizId}`);
      return mapQuiz(response.data);
    } catch (error) {
      console.warn(`Backend getQuizById for ${quizId} failed. Falling back to mock.`, error);
      return quizzes.find((q) => String(q.id) === String(quizId)) || null;
    }
  },

  async createQuiz(courseId, payload) {
    try {
      const response = await apiClient.post(`/courses/${courseId}/quizzes`, {
        title: payload.title,
        total_marks: Number(payload.maxScore) || Number(payload.questions) * 5 || 10,
        time_limit: Number(payload.duration?.replace(/\D/g, "")) || 30,
        attempts_allowed: Number(payload.attempts) || 1,
      });
      return mapQuiz(response.data);
    } catch (error) {
      console.warn("Backend createQuiz failed. Falling back to mock response.", error);
      return { id: `quiz-${Date.now()}`, ...payload, status: "Open" };
    }
  },

  async deleteQuiz(quizId) {
    try {
      const response = await apiClient.delete(`/quizzes/${quizId}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend deleteQuiz ${quizId} failed. Falling back to mock.`, error);
      return { message: "deleted" };
    }
  },

  // Questions management
  async getQuestions(quizId) {
    try {
      const response = await apiClient.get(`/quizzes/${quizId}/questions`);
      return response.data.map((q) => ({
        ...q,
        id: String(q.question_id || q.id),
        questionText: q.question_text || q.questionText,
        questionType: q.question_type || q.questionType,
        correctOptionIndex: q.correct_option || q.correct_option_index || 0,
      }));
    } catch (error) {
      console.warn(`Backend getQuestions for quiz ${quizId} failed. Falling back to mock.`, error);
      const mockQuiz = quizzes.find((q) => String(q.id) === String(quizId));
      return mockQuiz?.questionsList || [];
    }
  },

  async createQuestion(quizId, payload) {
    try {
      const response = await apiClient.post(`/quizzes/${quizId}/questions`, {
        question_text: payload.questionText,
        question_type: payload.questionType || "mcq",
        options: payload.options,
        correct_option_index: Number(payload.correctOptionIndex) || 0,
        marks: Number(payload.marks) || 5,
      });
      return response.data;
    } catch (error) {
      console.warn(`Backend createQuestion for quiz ${quizId} failed. Falling back to mock.`, error);
      return { id: `question-${Date.now()}`, ...payload };
    }
  },

  async updateQuestion(quizId, questionId, payload) {
    try {
      const response = await apiClient.put(`/quizzes/${quizId}/questions/${questionId}`, payload);
      return response.data;
    } catch (error) {
      console.warn(`Backend updateQuestion ${questionId} failed. Falling back to mock.`, error);
      return { id: questionId, ...payload };
    }
  },

  // Attempts and Results
  async submitQuizAttempt(quizId, answers) {
    try {
      const response = await apiClient.post(`/quizzes/${quizId}/attempts`, answers);
      return response.data; // Expected: { attempt_id, score, results: [...] }
    } catch (error) {
      console.warn(`Backend submitQuizAttempt for quiz ${quizId} failed. Falling back to mock.`, error);
      return { attempt_id: `attempt-${Date.now()}`, score: 8, results: [] };
    }
  },

  async getQuizResults(quizId) {
    try {
      const response = await apiClient.get(`/quizzes/${quizId}/results`);
      return response.data.map((res) => ({
        ...res,
        studentId: String(res.student_id || res.studentId),
        studentName: res.student_name || "Student Name",
        attemptDate: res.attempt_date || res.attemptDate,
      }));
    } catch (error) {
      console.warn(`Backend getQuizResults for quiz ${quizId} failed. Falling back to mock.`, error);
      return [];
    }
  },
};

