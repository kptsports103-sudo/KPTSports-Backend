const { USER_ROLES } = require('../utils/constants');

const validateRole = (role) => {
  const validRoles = Object.values(USER_ROLES);
  if (!role || !validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }
  return role;
};

module.exports = { validateRole };