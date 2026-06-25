import apiClient from "./apiClient";

const mapNotification = (backendNotif) => {
  if (!backendNotif) return null;
  const notifId = backendNotif.notification_id || backendNotif.id;
  return {
    ...backendNotif,
    id: String(notifId),
    title: backendNotif.title,
    message: backendNotif.message,
    isRead: backendNotif.is_read || backendNotif.isRead || false,
    createdAt: backendNotif.created_at || backendNotif.createdAt || new Date().toISOString(),
  };
};

export const notificationService = {
  async getNotifications() {
    const response = await apiClient.get("/notifications");
    return response.data.map(mapNotification);
  },

  async createNotification(payload) {
    const response = await apiClient.post("/notifications", {
      user_id: payload.userId ? Number(payload.userId) : undefined,
      title: payload.title,
      message: payload.message,
    });
    return mapNotification(response.data);
  },
};
