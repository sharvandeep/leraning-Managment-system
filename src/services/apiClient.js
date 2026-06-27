import axios from "axios";
import API_URL from "./api";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically inject JWT token from auth session storage
apiClient.interceptors.request.use(
  (config) => {
    const sessionStr = window.localStorage.getItem("lms-auth-session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session && session.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      } catch (err) {
        console.error("Error parsing auth session from localStorage", err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatically logout user on 401 Unauthorized response from backend (self-heals invalid sessions)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized session token detected. Clearing session and redirecting...");
      window.localStorage.removeItem("lms-auth-session");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;


