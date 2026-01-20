function requireApiKey(req, res, next) {
  // 🔥 QUAN TRỌNG: cho phép preflight CORS đi qua
  if (req.method === "OPTIONS") {
    return next();
  }

  const expected = process.env.API_KEY;

  // Fail fast nếu thiếu API_KEY
  if (!expected) {
    return res.status(500).json({ message: "Server missing API_KEY env" });
  }

  const provided = req.get("x-api-key");

  if (!provided) {
    return res.status(401).json({ message: "Missing x-api-key" });
  }

  if (provided !== expected) {
    return res.status(403).json({ message: "Invalid x-api-key" });
  }

  next();
}

module.exports = { requireApiKey };
