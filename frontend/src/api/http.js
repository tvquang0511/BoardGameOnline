import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://boardgameonline.onrender.com/api";

// NEW: x-api-key from .env (Vite requires VITE_ prefix)
const API_KEY = "your_super_secret_api_key_value";

export const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
  withCredentials: true,

});

// Attach token + x-api-key
http.interceptors.request.use((config) => {
  // 1) API key header
  // Nếu bạn muốn hard fail ở FE khi quên cấu hình env thì có thể throw Error ở đây.
  if (API_KEY) {
    config.headers["x-api-key"] = API_KEY;
  }

  // 2) JWT token header
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

// Optional: global 401 handler
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);

// Optional helper if you want manual set token (not required)
export function setAuthToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}