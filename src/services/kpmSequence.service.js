const KpmPool = require('../models/kpmPool.model');

const GLOBAL_POOL_ID = 'GLOBAL';
const MIN_SEQUENCE = 1;
const MAX_SEQUENCE = 99;

const toSafeString = (value) => String(value || '').trim();

const toTwoDigits = (value) => String(value).padStart(2, '0');

const buildPrefix = (year, diplomaYear, semester) =>
  `${String(year).slice(-2)}${String(diplomaYear)}${String(semester)}`;

const parseSequence = (kpmNo) => {
  const safeKpm = toSafeString(kpmNo);
  if (!safeKpm || safeKpm.length < 6) return null;

  const seq = Number.parseInt(safeKpm.slice(-2), 10);
  if (Number.isNaN(seq) || seq < MIN_SEQUENCE || seq > MAX_SEQUENCE) return null;
  return seq;
};

const isActive = (status) => toSafeString(status).toUpperCase() === 'ACTIVE';

const isValidActiveKpmForDoc = (doc, usedSequences) => {
  const safeKpm = toSafeString(doc.kpmNo);
  const seq = parseSequence(safeKpm);
  if (!seq) return false;

  const expectedPrefix = buildPrefix(doc.year, doc.currentDiplomaYear, doc.semester);
  if (!safeKpm.startsWith(expectedPrefix)) return false;
  if (usedSequences.has(seq)) return false;

  return true;
};

const assignGlobalKpms = (docs) => {
  const working = (docs || []).map((doc) => ({ ...doc, kpmNo: toSafeString(doc.kpmNo) }));
  const usedSequences = new Set();

  working.forEach((doc) => {
    if (!isActive(doc.status)) return;

    if (isValidActiveKpmForDoc(doc, usedSequences)) {
      usedSequences.add(parseSequence(doc.kpmNo));
      return;
    }

    doc.kpmNo = '';
  });

  const available = [];
  for (let i = MIN_SEQUENCE; i <= MAX_SEQUENCE; i++) {
    if (!usedSequences.has(i)) {
      available.push(i);
    }
  }

  working.forEach((doc) => {
    if (!isActive(doc.status)) return;
    if (toSafeString(doc.kpmNo)) return;

    const nextSequence = available.shift();
    if (!nextSequence) {
      throw new Error('Global KPM limit reached: all 99 active sequences are already assigned.');
    }

    const prefix = buildPrefix(doc.year, doc.currentDiplomaYear, doc.semester);
    doc.kpmNo = `${prefix}${toTwoDigits(nextSequence)}`;
    usedSequences.add(nextSequence);
  });

  return working;
};

const derivePoolStateFromDocs = (docs) => {
  const allocatedSet = new Set();

  (docs || []).forEach((doc) => {
    if (!isActive(doc.status)) return;

    const seq = parseSequence(doc.kpmNo);
    if (seq) {
      allocatedSet.add(seq);
    }
  });

  const allocated = Array.from(allocatedSet).sort((a, b) => a - b);
  const available = [];
  for (let i = MIN_SEQUENCE; i <= MAX_SEQUENCE; i++) {
    if (!allocatedSet.has(i)) {
      available.push(i);
    }
  }

  return { allocated, available };
};

const syncKpmPoolFromDocs = async (docs) => {
  const { allocated, available } = derivePoolStateFromDocs(docs);
  return KpmPool.findOneAndUpdate(
    { _id: GLOBAL_POOL_ID },
    { allocated, available },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

module.exports = {
  assignGlobalKpms,
  syncKpmPoolFromDocs
};
