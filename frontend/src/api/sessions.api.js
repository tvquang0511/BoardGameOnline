import { http } from "./http";

export const sessionsApi = {
  start(payload) {
    // POST /api/sessions/start
    return http.post("/sessions/start", payload).then((r) => r.data);
  },
  getById(id) {
    // GET /api/sessions/:id
    return http.get(`/sessions/${id}`).then((r) => r.data);
  },
  updateState(id, payload) {
    // PATCH /api/sessions/:id/state
    return http.patch(`/sessions/${id}/state`, payload).then((r) => r.data);
  },
  finish(id, payload) {
    // POST /api/sessions/:id/finish
    return http.post(`/sessions/${id}/finish`, payload).then((r) => r.data);
  },
};