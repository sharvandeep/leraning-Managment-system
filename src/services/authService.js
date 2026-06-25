import apiClient from "./apiClient";

export const authService = {
  async login({ email, password }) {
    // POST to `/api/auth/login`
    const response = await apiClient.post("/auth/login", { email, password });
    const { token } = response.data;

    // GET user profile from `/api/users/me` using the new token
    const profileResponse = await apiClient.get("/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const profile = profileResponse.data;
    return {
      user: {
        id: profile.user_id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        branch_id: profile.branch_id,
        branch: profile.branch, // resolved branch name from backend
        semester_id: profile.semester_id,
        semester: profile.semester_name, // resolved semester name (e.g. "Semester 1") or null
        avatar: (profile.full_name || "")
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      },
      token,
    };
  },

  async register(payload) {
    // POST to `/api/auth/register`
    const response = await apiClient.post("/auth/register", {
      full_name: payload.name,
      email: payload.email,
      password: payload.password,
      branch_id: Number(payload.branch_id),
      semester_id: payload.role === "student" ? Number(payload.semester_id) : undefined,
      role: payload.role || "student",
    });
    const { token } = response.data;

    if (!token) {
      return {
        user: null,
        token: "",
        needsVerification: true,
        message: "Registration successful. Please verify your email before logging in.",
      };
    }

    // GET user profile from `/api/users/me` using the new token
    const profileResponse = await apiClient.get("/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const profile = profileResponse.data;
    return {
      user: {
        id: profile.user_id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        branch_id: profile.branch_id,
        branch: profile.branch, // resolved branch name from backend
        semester_id: profile.semester_id,
        semester: profile.semester_name, // resolved semester name (e.g. "Semester 1") or null
        avatar: (profile.full_name || "")
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      },
      token,
    };
  },

  async forgotPassword(email) {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(token, newPassword) {
    const response = await apiClient.post("/auth/reset-password", {
      token: token,
      new_password: newPassword
    });
    return response.data;
  },

  async verifyEmail(token) {
    const response = await apiClient.get("/auth/verify-email", {
      params: { token }
    });
    return response.data;
  },

  async getDeviceHistory() {
    const response = await apiClient.get("/auth/device-history");
    return response.data;
  }
};
