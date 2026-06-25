import apiClient from "./apiClient";

const mapUser = (backendUser) => {
  if (!backendUser) return null;
  const userId = backendUser.user_id || backendUser.id;
  const avgGrade = backendUser.average_grade !== undefined ? backendUser.average_grade : 0.0;
  return {
    ...backendUser,
    id: String(userId),
    name: backendUser.full_name || backendUser.name,
    email: backendUser.email,
    role: backendUser.role,
    branch_id: backendUser.branch_id,
    semester_id: backendUser.semester_id,
    branch: backendUser.branch, // resolved branch name
    semester: backendUser.semester_name || (backendUser.semester_id ? String(backendUser.semester_id) : ""), // resolved semester name (e.g., "Semester 1")
    averageGrade: avgGrade,
    average_grade: avgGrade,
    avatar: (backendUser.full_name || backendUser.name || "")
      .split(" ")
      .map((part) => part[part.length - 1] === "." ? "" : part[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST",
  };
};

export const userService = {
  async getUsers(role) {
    const response = await apiClient.get("/users");
    const mapped = response.data.map(mapUser);
    return role ? mapped.filter((user) => user.role === role) : mapped;
  },

  async getUserById(userId) {
    const response = await apiClient.get(`/users/${userId}`);
    return mapUser(response.data);
  },

  async createUser(payload) {
    const response = await apiClient.post("/users", {
      full_name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role || "student",
      branch_id: Number(payload.branch_id || payload.branchId),
      semester_id: payload.role === "student" ? Number(payload.semester_id || payload.semesterId) : undefined,
    });
    return mapUser(response.data);
  },

  async updateUser(userId, payload) {
    const response = await apiClient.put(`/users/${userId}`, {
      full_name: payload.name,
      email: payload.email,
      password: payload.password || undefined,
      role: payload.role,
      branch_id: Number(payload.branch_id || payload.branchId),
      semester_id: payload.role === "student" ? Number(payload.semester_id || payload.semesterId) : undefined,
    });
    return mapUser(response.data);
  },

  async deleteUser(userId) {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },
};
