import apiClient from "./apiClient";
import { users } from "../mock/users";

const mapUser = (backendUser) => {
  if (!backendUser) return null;
  const userId = backendUser.user_id || backendUser.id;
  return {
    ...backendUser,
    id: String(userId),
    name: backendUser.full_name || backendUser.name,
    email: backendUser.email,
    role: backendUser.role,
    branch: backendUser.branch,
    semester: backendUser.semester,
    avatar: (backendUser.full_name || backendUser.name || "")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
};

export const userService = {
  async getUsers(role) {
    try {
      const response = await apiClient.get("/users");
      const mapped = response.data.map(mapUser);
      return role ? mapped.filter((user) => user.role === role) : mapped;
    } catch (error) {
      console.warn("Backend getUsers failed. Falling back to mock users.", error);
      const filteredUsers = role ? users.filter((user) => user.role === role) : users;
      return filteredUsers.map((user) => {
        const safeUser = { ...user };
        delete safeUser.password;
        return safeUser;
      });
    }
  },

  async getUserById(userId) {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return mapUser(response.data);
    } catch (error) {
      console.warn(`Backend getUserById for ${userId} failed. Falling back to mock.`, error);
      const matched = users.find((user) => String(user.id) === String(userId));
      return matched ? { ...matched, id: String(matched.id) } : null;
    }
  },

  async createUser(payload) {
    try {
      const response = await apiClient.post("/users", {
        full_name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        branch: payload.branch,
        semester: payload.role === "student" ? Number(payload.semester) : undefined,
      });
      return mapUser(response.data);
    } catch (error) {
      console.warn("Backend createUser failed. Falling back to mock response.", error);
      return { id: `user-${Date.now()}`, ...payload };
    }
  },

  async updateUser(userId, payload) {
    try {
      const response = await apiClient.put(`/users/${userId}`, {
        full_name: payload.name,
        branch: payload.branch,
        role: payload.role,
        semester: payload.semester ? Number(payload.semester) : undefined,
      });
      return mapUser(response.data);
    } catch (error) {
      console.warn(`Backend updateUser ${userId} failed. Falling back to mock.`, error);
      return { id: userId, ...payload };
    }
  },

  async deleteUser(userId) {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.warn(`Backend deleteUser ${userId} failed. Falling back to mock.`, error);
      return { message: "deleted" };
    }
  },
};

