import apiClient from "./apiClient";

export const semesterService = {
  async getSemesters() {
    const response = await apiClient.get("/semesters");
    return response.data;
  },

  async createSemester(payload) {
    const response = await apiClient.post("/semesters", payload);
    return response.data;
  },

  async updateSemester(semesterId, payload) {
    const response = await apiClient.put(`/semesters/${semesterId}`, payload);
    return response.data;
  },

  async deleteSemester(semesterId) {
    const response = await apiClient.delete(`/semesters/${semesterId}`);
    return response.data;
  },
};
