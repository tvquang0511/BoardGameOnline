import { http } from "./http";

export const profilesApi = {
  me() {
    // GET /api/profiles/me
    return http.get("/profiles/me").then((r) => r.data);
  },
  updateMe(payload) {
    // PATCH /api/profiles/me
    return http.patch("/profiles/me", payload).then((r) => r.data);
  },
  myStats() {
    // GET /api/profiles/me/stats
    return http.get("/profiles/me/stats").then((r) => r.data);
  },
};