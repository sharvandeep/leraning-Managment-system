import apiClient from "./apiClient";
import { notifications } from "../mock/notifications";

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
    role: backendNotif.role || "student",
  };
};

export const notificationService = {
  async getNotifications(role) {
    try {
      const response = await apiClient.get("/notifications");
      const mapped = response.data.map(mapNotification);
      return role ? mapped.filter((n) => n.role === role) : mapped;
    } catch (error) {
      console.warn("Backend getNotifications failed. Falling back to mock notifications.", error);
      return notifications.filter((notification) => notification.role === role);
    }
  },

  async createNotification(payload) {
    try {
      const response = await apiClient.post("/notifications", {
        user_id: payload.userId ? Number(payload.userId) : undefined,
        title: payload.title,
        message: payload.message,
      });
      return mapNotification(response.data);
    } catch (error) {
      console.warn("Backend createNotification failed. Falling back to mock response.", error);
      return { id: `notif-${Date.now()}`, ...payload, isRead: false, createdAt: new Date().toISOString() };
    }
  },
};

