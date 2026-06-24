import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
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

export default apiClient;

