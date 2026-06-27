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
    let ids = courseIds;
    if (courseIds && courseIds.length === 0) return [];
    if (!ids || !ids.length) {
      try {
        const coursesResponse = await apiClient.get("/courses");
        ids = coursesResponse.data.map(c => c.course_id || c.id);
      } catch (err) {
        console.error("Failed to fetch courses for quizzes", err);
        ids = [];
      }
    }

    let liveQuizzes = [];
    if (ids && ids.length > 0) {
      try {
        const fetchPromises = ids.map((courseId) =>
          apiClient.get(`/courses/${courseId}/quizzes`).then((res) => res.data)
        );
        const results = await Promise.all(fetchPromises);
        liveQuizzes = results.flat().map(mapQuiz);
      } catch (err) {
        console.error("Failed to fetch live quizzes from DB", err);
      }
    }

    // Merge student-generated local AI quizzes from localStorage
    const localStr = localStorage.getItem("lms-student-ai-quizzes");
    let localQuizzes = [];
    if (localStr) {
      try {
        localQuizzes = JSON.parse(localStr).map(q => ({
          ...q,
          id: String(q.id),
          isLocalAi: true,
          date: q.date || new Date().toISOString()
        }));
      } catch (err) {
        console.error("Failed to parse local student quizzes", err);
      }
    }

    return [...liveQuizzes, ...localQuizzes];
  },

  async getQuizById(quizId) {
    if (String(quizId).startsWith("local-ai-")) {
      const localStr = localStorage.getItem("lms-student-ai-quizzes");
      if (localStr) {
        const quizzes = JSON.parse(localStr);
        const quiz = quizzes.find(q => String(q.id) === String(quizId));
        if (quiz) {
          return {
            ...quiz,
            id: String(quiz.id),
            isLocalAi: true
          };
        }
      }
      throw new Error("Local AI quiz not found");
    }

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
    if (String(quizId).startsWith("local-ai-")) {
      const localStr = localStorage.getItem("lms-student-ai-quizzes");
      if (localStr) {
        const quizzes = JSON.parse(localStr).filter(q => String(q.id) !== String(quizId));
        localStorage.setItem("lms-student-ai-quizzes", JSON.stringify(quizzes));
      }
      return { message: "deleted" };
    }

    const response = await apiClient.delete(`/quizzes/${quizId}`);
    return response.data;
  },

  // Questions management
  async getQuestions(quizId) {
    if (String(quizId).startsWith("local-ai-")) {
      const localStr = localStorage.getItem("lms-student-ai-quizzes");
      if (localStr) {
        const quizzes = JSON.parse(localStr);
        const quiz = quizzes.find(q => String(q.id) === String(quizId));
        if (quiz && quiz.questions) {
          return quiz.questions.map((q, idx) => ({
            id: String(q.id || idx),
            questionText: q.question,
            questionType: "mcq",
            options: q.options || [],
            correctOptionIndex: q.options.indexOf(q.answer) !== -1 ? q.options.indexOf(q.answer) : 0
          }));
        }
      }
      return [];
    }

    const response = await apiClient.get(`/quizzes/${quizId}/questions`);
    return response.data.map((q) => {
      // Find correct option index from options array returned by FastAPI
      const correctIdx = q.options ? q.options.findIndex(opt => opt.is_correct) : 0;
      const optionTexts = q.options ? q.options.map(opt => opt.option_text) : [];
      return {
        ...q,
        id: String(q.question_id || q.id),
        questionText: q.question_text || q.questionText,
        questionType: q.question_type || q.questionType,
        correctOptionIndex: correctIdx !== -1 ? correctIdx : 0,
        options: optionTexts,
        rawOptions: q.options || [] // Keep original objects containing option_id
      };
    });
  },

  async createQuestion(quizId, payload) {
    // Map options to match FastAPI QuestionCreate schema containing options: List[OptionCreate]
    const mappedOptions = payload.options ? payload.options.map((opt, index) => {
      if (typeof opt === "string") {
        return {
          option_text: opt,
          is_correct: index === payload.correctOptionIndex
        };
      }
      return {
        option_text: opt.optionText || opt.option_text || "",
        is_correct: opt.isCorrect !== undefined ? opt.isCorrect : (opt.is_correct || false)
      };
    }) : [];

    const response = await apiClient.post(`/quizzes/${quizId}/questions`, {
      question_text: payload.questionText,
      question_type: payload.questionType || "mcq",
      options: mappedOptions,
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
    if (String(quizId).startsWith("local-ai-")) {
      const localStr = localStorage.getItem("lms-student-ai-quizzes");
      if (localStr) {
        const quizzes = JSON.parse(localStr);
        const quizIdx = quizzes.findIndex(q => String(q.id) === String(quizId));
        if (quizIdx !== -1) {
          // Grade attempt locally
          let score = 0;
          const quiz = quizzes[quizIdx];
          answers.answers.forEach(ans => {
            const question = quiz.questions.find(q => String(q.id) === String(ans.question_id));
            if (question && question.options[ans.selected_option_id] === question.answer) {
              score += 5; // 5 marks per question
            }
          });

          quizzes[quizIdx].studentStatus = "Completed";
          quizzes[quizIdx].score = score;
          localStorage.setItem("lms-student-ai-quizzes", JSON.stringify(quizzes));

          return {
            attempt_id: Date.now(),
            score: score,
            results: `Local AI quiz completed. Total score: ${score}/${quiz.maxScore}`
          };
        }
      }
      throw new Error("Local AI quiz not found");
    }

    const response = await apiClient.post(`/quizzes/${quizId}/attempts`, answers);
    return response.data;
  },

  async getQuizResults(quizId) {
    if (String(quizId).startsWith("local-ai-")) {
      const localStr = localStorage.getItem("lms-student-ai-quizzes");
      if (localStr) {
        const quizzes = JSON.parse(localStr);
        const quiz = quizzes.find(q => String(q.id) === String(quizId));
        if (quiz && quiz.studentStatus === "Completed") {
          return [{
            student_id: "current-student",
            studentName: "Current Student (AI Practice)",
            score: quiz.score,
            attempt_date: quiz.date || new Date().toISOString()
          }];
        }
      }
      return [];
    }

    const response = await apiClient.get(`/quizzes/${quizId}/results`);
    return response.data.map((res) => ({
      ...res,
      studentId: String(res.student_id || res.studentId),
      studentName: res.student_name || "Student Name",
      attemptDate: res.attempt_date || res.attemptDate,
    }));
  },

  // Student AI Quiz Creator helper
  createLocalAiQuiz(course, topic, quizData) {
    const localStr = localStorage.getItem("lms-student-ai-quizzes") || "[]";
    const quizzes = JSON.parse(localStr);
    
    const newQuiz = {
      id: `local-ai-${Date.now()}`,
      courseId: String(course.id),
      courseTitle: course.title,
      title: quizData.title || `AI Practice: ${topic}`,
      date: new Date().toISOString(),
      questions: quizData.questions.length,
      duration: quizData.duration || "15 min",
      status: "Open",
      studentStatus: "Not Attempted",
      attempts: 1,
      averageScore: 0,
      maxScore: quizData.questions.length * 5,
      score: null,
      topics: [topic],
      rawQuestions: quizData.questions // Store questions locally to take the quiz
    };

    // Keep locally created questions in same format
    newQuiz.questions = quizData.questions.map((q, idx) => ({
      id: idx + 1,
      question: q.question,
      options: q.options,
      answer: q.answer
    }));

    quizzes.unshift(newQuiz);
    localStorage.setItem("lms-student-ai-quizzes", JSON.stringify(quizzes));
    return newQuiz;
  }
};
