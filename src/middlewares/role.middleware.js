const { hasRequiredRole, normalizeRole } = require('../utils/roles');

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userRole = normalizeRole(req.user.role);
    if (!hasRequiredRole(userRole, roles)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    req.user.role = userRole;
    next();
  };
};

module.exports = roleMiddleware;
