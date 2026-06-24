import apiClient from "./apiClient";
import { users } from "../mock/users";

const delay = (value) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(value), 250);
  });

const withoutPassword = (user) => {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
};

export const authService = {
  async login({ email, password }) {
    try {
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
          branch: profile.branch,
          semester: profile.semester,
          avatar: (profile.full_name || "")
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        },
        token,
      };
    } catch (error) {
      console.warn("Backend auth login failed. Falling back to mock auth.", error);
      const user = users.find(
        (item) => item.email.toLowerCase() === email.toLowerCase(),
      );

      if (!user || user.password !== password) {
        throw new Error("Invalid email or password.");
      }

      return delay({
        user: withoutPassword(user),
        token: `mock-token-${user.role}-${user.id}`,
      });
    }
  },

  async register(payload) {
    try {
      // POST to `/api/auth/register`
      const response = await apiClient.post("/auth/register", {
        full_name: payload.name,
        email: payload.email,
        password: payload.password,
        branch: payload.branch,
        semester: payload.role === "student" ? Number(payload.semester) : undefined,
      });
      const { token } = response.data;

      // GET user profile from `/api/users/me`
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
          branch: profile.branch,
          semester: profile.semester,
          avatar: (profile.full_name || "")
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        },
        token,
      };
    } catch (error) {
      console.warn("Backend auth registration failed. Falling back to mock registration.", error);
      const newUser = {
        id: `${payload.role}-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        branch: payload.branch,
        semester: payload.role === "student" ? payload.semester : undefined,
        avatar: payload.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      };

      return delay({
        user: newUser,
        token: `mock-token-${newUser.role}-${newUser.id}`,
      });
    }
  },

  async forgotPassword(email) {
    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      console.warn("Backend forgot password failed. Falling back to mock.", error);
      return delay({ message: `Password reset instructions sent to ${email}.` });
    }
  },
};

