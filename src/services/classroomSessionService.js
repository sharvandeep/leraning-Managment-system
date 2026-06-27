import apiClient from "./apiClient";

export const classroomSessionService = {
  async getSessions(courseId) {
    const response = await apiClient.get(`/courses/${courseId}/sessions`);
    return response.data;
  },

  async getUpcomingSessions() {
    const response = await apiClient.get("/sessions/upcoming");
    return response.data;
  },

  async createSession(courseId, sessionData) {
    const response = await apiClient.post(`/courses/${courseId}/sessions`, {
      title: sessionData.title,
      description: sessionData.description || "",
      session_date: sessionData.sessionDate,
      start_time: sessionData.startTime,
      end_time: sessionData.endTime,
      room: sessionData.room || "",
      meeting_link: sessionData.meetingLink || ""
    });
    return response.data;
  },

  async deleteSession(sessionId) {
    const response = await apiClient.delete(`/sessions/${sessionId}`);
    return response.data;
  }
};
