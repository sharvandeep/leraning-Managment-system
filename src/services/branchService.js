import apiClient from "./apiClient";

export const branchService = {
  async getBranches() {
    const response = await apiClient.get("/branches/");
    return response.data;
  },

  async createBranch(payload) {
    const response = await apiClient.post("/branches/", payload);
    return response.data;
  },

  async updateBranch(branchId, payload) {
    const response = await apiClient.put(`/branches/${branchId}/`, payload);
    return response.data;
  },

  async deleteBranch(branchId) {
    const response = await apiClient.delete(`/branches/${branchId}/`);
    return response.data;
  },
};
