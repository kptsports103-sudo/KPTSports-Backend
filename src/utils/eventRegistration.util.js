const normalizeDateInput = (value) => {
  const safeValue = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(safeValue) ? safeValue : '';
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const deriveRegistrationStatus = (startDate, endDate, today = getTodayDateString()) => {
  const safeStartDate = normalizeDateInput(startDate);
  const safeEndDate = normalizeDateInput(endDate);

  if (!safeStartDate || !safeEndDate) return 'Closed';
  if (safeStartDate > safeEndDate) return 'Closed';

  return today >= safeStartDate && today <= safeEndDate ? 'Open' : 'Closed';
};

module.exports = {
  deriveRegistrationStatus,
  normalizeDateInput,
};
