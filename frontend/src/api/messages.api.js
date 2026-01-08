import { http } from "./http";

export const messagesApi = {
  conversations() {
    // GET /api/messages/conversations
    return http.get("/messages/conversations").then((r) => r.data);
  },
  list({ withUser, page = 1, limit = 20 }) {
    // GET /api/messages?with=&page=&limit=
    return http
      .get("/messages", { params: { with: withUser, page, limit } })
      .then((r) => r.data);
  },
  send({ receiverId, content }) {
    // POST /api/messages
    return http.post("/messages", { receiverId, content }).then((r) => r.data);
  },
  read(id) {
    // POST /api/messages/:id/read
    return http.post(`/messages/${id}/read`).then((r) => r.data);
  },
};