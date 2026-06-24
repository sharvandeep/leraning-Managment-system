import apiClient from "./apiClient";
import { courses } from "../mock/courses";

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
    semester: String(backendCourse.semester || 1),
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
    try {
      const response = await apiClient.get("/courses");
      const mapped = response.data.map(mapCourse);
      // Client-side filtering if needed or if backend returns all
      return mapped.filter((course) => {
        const branchMatch = !filters.branch || course.branch === filters.branch;
        const semesterMatch =
          !filters.semester || course.semester === String(filters.semester);
        const teacherMatch = !filters.teacherId || course.teacherId === filters.teacherId;
        return branchMatch && semesterMatch && teacherMatch;
      });
    } catch (error) {
      console.warn("Backend getCourses failed. Falling back to mock courses.", error);
      return courses.filter((course) => {
        const branchMatch = !filters.branch || course.branch === filters.branch;
        const semesterMatch =
          !filters.semester || course.semester === String(filters.semester);
        const teacherMatch = !filters.teacherId || course.teacherId === filters.teacherId;
        return branchMatch && semesterMatch && teacherMatch;
      });
    }
  },

  async getCourseById(courseId) {
    try {
      const response = await apiClient.get(`/courses/${courseId}`);
      return mapCourse(response.data);
    } catch (error) {
      console.warn(`Backend getCourseById for ${courseId} failed. Falling back to mock.`, error);
      const matched = courses.find((course) => String(course.id) === String(courseId));
      return matched || null;
    }
  },

  async createCourse(payload) {
    try {
      const response = await apiClient.post("/courses", {
        title: payload.title,
        description: payload.description,
        branch_id: Number(payload.branchId),
        semester: Number(payload.semester),
        teacher_id: Number(payload.teacherId),
      });
      return mapCourse(response.data);
    } catch (error) {
      console.warn("Backend createCourse failed. Falling back to mock response.", error);
      return { id: `course-${Date.now()}`, ...payload };
    }
  },

  async updateCourse(courseId, payload) {
    try {
      const response = await apiClient.put(`/courses/${courseId}`, payload);
      return mapCourse(response.data);
    } catch (error) {
      console.warn(`Backend updateCourse ${courseId} failed. Falling back to mock.`, error);
      return { id: courseId, ...payload };
    }
  },

  async deleteCourse(courseId) {
    try {
      const response = await apiClient.delete(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend deleteCourse ${courseId} failed. Falling back to mock.`, error);
      return { message: "deleted" };
    }
  },

  // Modules Sub-resource
  async getModules(courseId) {
    try {
      const response = await apiClient.get(`/courses/${courseId}/modules`);
      return response.data.map((m) => ({
        ...m,
        id: String(m.module_id || m.id),
      }));
    } catch (error) {
      console.warn(`Backend getModules for course ${courseId} failed. Falling back to mock.`, error);
      const matchedCourse = courses.find((c) => String(c.id) === String(courseId));
      return matchedCourse?.modules || [];
    }
  },

  async createModule(courseId, payload) {
    try {
      const response = await apiClient.post(`/courses/${courseId}/modules`, {
        title: payload.title,
        description: payload.description,
        order_num: Number(payload.orderNum) || 1,
      });
      return {
        ...response.data,
        id: String(response.data.module_id || response.data.id),
      };
    } catch (error) {
      console.warn(`Backend createModule for course ${courseId} failed. Falling back to mock.`, error);
      return { id: `mod-${Date.now()}`, ...payload };
    }
  },

  async updateModule(moduleId, payload) {
    try {
      const response = await apiClient.put(`/modules/${moduleId}`, payload);
      return response.data;
    } catch (error) {
      console.warn(`Backend updateModule ${moduleId} failed. Falling back to mock.`, error);
      return { id: moduleId, ...payload };
    }
  },

  async deleteModule(moduleId) {
    try {
      const response = await apiClient.delete(`/modules/${moduleId}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend deleteModule ${moduleId} failed. Falling back to mock.`, error);
      return { message: "deleted" };
    }
  },
};

