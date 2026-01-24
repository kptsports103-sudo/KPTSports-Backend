const ROLE_MAP = {
  participant: 'student',
  user: 'student',
  Student: 'student',
  STUDENT: 'student',

  creator: 'creator',
  Creator: 'creator',

  admin: 'admin',
  Admin: 'admin',

  coach: 'coach',
  Coach: 'coach',
};

const normalizeRole = (role) => {
  if (!role) return 'student';
  return ROLE_MAP[role] || role.toLowerCase();
};

module.exports = { normalizeRole };
