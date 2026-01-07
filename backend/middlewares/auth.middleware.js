const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return res.status(401).json({ message: 'Missing Bearer token' });

  try {
    req.user = jwt.verify(token, JWT_SECRET); // { sub, email, role }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}

module.exports = { requireAuth, requireAdmin };