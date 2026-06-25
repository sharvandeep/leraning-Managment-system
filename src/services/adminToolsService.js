import apiClient from "./apiClient";

export const adminToolsService = {
  async getAnalytics() {
    const response = await apiClient.get("/admin-tools/analytics");
    return response.data;
  },

  async getActivityLogs() {
    const response = await apiClient.get("/admin-tools/activity-logs");
    return response.data;
  },

  async backupDatabase() {
    const response = await apiClient.post("/admin-tools/backup", {}, {
      responseType: "blob"
    });
    
    // Convert blob to download link in browser
    const blob = new Blob([response.data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const dateString = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "_");
    link.setAttribute("download", `learnsphear_backup_${dateString}.json`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    
    return { success: true };
  },

  async broadcastEmail({ subject, body, targetType, branchId = null, semesterId = null }) {
    const response = await apiClient.post("/admin-tools/broadcast-email", {
      subject,
      body,
      target_type: targetType, // 'all', 'students', 'teachers', 'branch_sem'
      branch_id: branchId ? Number(branchId) : null,
      semester_id: semesterId ? Number(semesterId) : null
    });
    return response.data;
  }
};
