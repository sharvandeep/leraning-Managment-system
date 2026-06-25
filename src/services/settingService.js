import apiClient from "./apiClient";

export const settingService = {
  async getSettings() {
    const response = await apiClient.get("/settings");
    return response.data; // returns { [setting_key]: setting_value }
  },

  async updateSetting(key, value) {
    const response = await apiClient.put(`/settings/${key}`, { value });
    return response.data;
  }
};
