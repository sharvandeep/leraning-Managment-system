import apiClient from "./apiClient";

export const studyTrackingService = {
  async toggleBookmark(moduleId) {
    const response = await apiClient.post(`/study-tracking/bookmarks/toggle/${moduleId}`);
    return response.data; // { starred: boolean, message: string }
  },

  async getBookmarks() {
    const response = await apiClient.get("/study-tracking/bookmarks");
    return response.data;
  },

  async logRecentlyViewed(courseId) {
    const response = await apiClient.post(`/study-tracking/recently-viewed/${courseId}`);
    return response.data;
  },

  async getRecentlyViewed() {
    const response = await apiClient.get("/study-tracking/recently-viewed");
    return response.data;
  },

  async logDownload(materialId) {
    const response = await apiClient.post(`/study-tracking/downloads/${materialId}`);
    return response.data;
  },

  async getDownloads() {
    const response = await apiClient.get("/study-tracking/downloads");
    return response.data;
  }
};
