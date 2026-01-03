const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  try {
    // Access token expected in Authorization header as 'Bearer <token>'
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'Missing Authorization' });
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(payload.sub).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireRole = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};

module.exports = { requireAuth, requireRole };
