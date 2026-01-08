import { http } from "./http";

export const authApi = {
  login(payload) {
    // POST /api/auth/login
    return http.post("/auth/login", payload).then((r) => r.data);
  },
  register(payload) {
    // POST /api/auth/register
    return http.post("/auth/register", payload).then((r) => r.data);
  },
  logout() {
    // POST /api/auth/logout
    return http.post("/auth/logout").then((r) => r.data);
  },
  me() {
    // GET /api/auth/me
    return http.get("/auth/me").then((r) => r.data);
  },
};