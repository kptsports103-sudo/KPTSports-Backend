const ROLE_LEVEL = {
  viewer: 1,
  creator: 2,
  admin: 3,
  superadmin: 4
};

const ROLE_ALIASES = {
  super_admin: 'superadmin',
  superadmin: 'superadmin',
  admin: 'admin',
  creator: 'creator',
  viewer: 'viewer',
  // Legacy aliases for backward compatibility
  coach: 'creator',
  student: 'viewer',
  participant: 'viewer',
  user: 'viewer'
};

const normalizeRole = (role) => {
  if (!role) return 'viewer';
  const safeRole = String(role).trim().toLowerCase();
  return ROLE_ALIASES[safeRole] || safeRole;
};

const hasRequiredRole = (userRole, allowedRoles = []) => {
  const normalizedUserRole = normalizeRole(userRole);
  if (!allowedRoles.length) return true;

  const userLevel = ROLE_LEVEL[normalizedUserRole] || 0;
  return allowedRoles.some((allowedRole) => {
    const normalizedAllowedRole = normalizeRole(allowedRole);
    const allowedLevel = ROLE_LEVEL[normalizedAllowedRole] || 0;
    return userLevel >= allowedLevel;
  });
};

module.exports = {
  ROLE_LEVEL,
  normalizeRole,
  hasRequiredRole
};

