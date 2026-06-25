import apiClient from "./apiClient";

// Helper to map backend course model to frontend course model
const mapCourse = (backendCourse) => {
  if (!backendCourse) return null;
  const courseId = backendCourse.course_id || backendCourse.id;
  const title = backendCourse.title;
  return {
    ...backendCourse,
    id: String(courseId),
    title: title,
    code: backendCourse.code || (title ? title.split(" ").map(w => w[0]).join("").toUpperCase() : `CSE-${courseId}`),
    branch: backendCourse.branch || (backendCourse.branch_id ? String(backendCourse.branch_id) : "CSE"),
    branchId: backendCourse.branch_id,
    semesterId: backendCourse.semester_id,
    semester: backendCourse.semester_name || String(backendCourse.semester_id || 1), // mapping to name (e.g. "Semester 1") for UI compatibility
    teacherId: String(backendCourse.teacher_id || backendCourse.teacherId || ""),
    teacherName: backendCourse.teacher_name || backendCourse.teacherName || "Assigned Faculty",
    progress: backendCourse.progress || 0,
    lessons: backendCourse.lessons || 12,
    materials: backendCourse.materials || 0,
    modules: (backendCourse.modules || []).map((m) => ({
      ...m,
      id: String(m.module_id || m.id),
      lessons: m.lessons || [],
    })),
    materialsList: backendCourse.materialsList || [],
  };
};

export const courseService = {
  async getCourses(filters = {}) {
    const params = {};
    if (filters.branchId) params.branch_id = Number(filters.branchId);
    if (filters.semesterId) params.semester_id = Number(filters.semesterId);
    if (filters.includeArchived) params.include_archived = true;

    const response = await apiClient.get("/courses", { params });
    const mapped = response.data.map(mapCourse);
    
    // Additional client-side filtering if teacherId filter is passed
    return mapped.filter((course) => {
      const teacherMatch = !filters.teacherId || String(course.teacherId) === String(filters.teacherId);
      return teacherMatch;
    });
  },

  async getCourseById(courseId) {
    const response = await apiClient.get(`/courses/${courseId}`);
    return mapCourse(response.data);
  },

  async createCourse(payload) {
    const response = await apiClient.post("/courses", {
      title: payload.title,
      description: payload.description,
      branch_id: Number(payload.branchId),
      semester_id: Number(payload.semesterId),
      teacher_id: Number(payload.teacherId),
    });
    return mapCourse(response.data);
  },

  async updateCourse(courseId, payload) {
    const response = await apiClient.put(`/courses/${courseId}`, {
      title: payload.title,
      description: payload.description,
      branch_id: Number(payload.branchId),
      semester_id: Number(payload.semesterId),
      teacher_id: Number(payload.teacherId),
    });
    return mapCourse(response.data);
  },

  async assignTeacher(courseId, teacherId) {
    const response = await apiClient.put(`/courses/${courseId}/assign`, {
      teacher_id: teacherId ? Number(teacherId) : null
    });
    return mapCourse(response.data);
  },

  async deleteCourse(courseId) {
    const response = await apiClient.delete(`/courses/${courseId}`);
    return response.data;
  },

  async archiveCourse(courseId) {
    const response = await apiClient.post(`/courses/${courseId}/archive`);
    return response.data;
  },

  async restoreCourse(courseId) {
    const response = await apiClient.post(`/courses/${courseId}/restore`);
    return response.data;
  },

  // Modules Sub-resource
  async getModules(courseId) {
    const response = await apiClient.get(`/courses/${courseId}/modules`);
    return response.data.map((m) => ({
      ...m,
      id: String(m.module_id || m.id),
    }));
  },

  async createModule(courseId, payload) {
    const response = await apiClient.post(`/courses/${courseId}/modules`, {
      title: payload.title,
      description: payload.description,
      order_num: Number(payload.orderNum) || 1,
    });
    return {
      ...response.data,
      id: String(response.data.module_id || response.data.id),
    };
  },

  async updateModule(moduleId, payload) {
    const response = await apiClient.put(`/modules/${moduleId}`, payload);
    return response.data;
  },

  async deleteModule(moduleId) {
    const response = await apiClient.delete(`/modules/${moduleId}`);
    return response.data;
  },
};
