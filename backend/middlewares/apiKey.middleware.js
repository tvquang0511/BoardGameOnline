function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY;

  // Nếu chưa cấu hình API_KEY thì fail fast để tránh chạy "không bảo vệ"
  if (!expected) {
    return res.status(500).json({ message: "Server missing API_KEY env" });
  }

  const provided = req.get("x-api-key");

  if (!provided) {
    return res.status(401).json({ message: "Missing x-api-key" });
  }

  // So sánh đơn giản. (Nếu muốn chống timing attack có thể đổi sang crypto.timingSafeEqual)
  if (provided !== expected) {
    return res.status(403).json({ message: "Invalid x-api-key" });
  }

  next();
}

module.exports = { requireApiKey };