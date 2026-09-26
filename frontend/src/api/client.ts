import axios from "axios";

// In local dev, "/api" is proxied to the backend (see vite.config.ts). In a
// static deployment (e.g. GitHub Pages) there's no proxy, so VITE_API_URL
// must point at the deployed backend's own /api path.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("csd_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
