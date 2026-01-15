import { http } from "./http";

export const achievementsApi = {
  catalog() {
    // GET /api/achievements
    return http.get("/achievements").then((r) => r.data);
  },
  my() {
    // GET /api/achievements/me
    return http.get("/achievements/me").then((r) => r.data);
  },
  progress() {
    // GET /api/achievements/progress - with real progress calculation
    return http.get("/achievements/progress").then((r) => r.data);
  },
};
