import apiClient from "./apiClient";

export const gamificationService = {
  async getGamificationStatus() {
    const response = await apiClient.get("/gamification/status");
    return response.data;
  }
};
