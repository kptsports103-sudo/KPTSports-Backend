const WebVital = require('../models/webVital.model');

const ALLOWED_METRICS = new Set(['CLS', 'INP', 'LCP', 'FCP', 'TTFB']);
const ALLOWED_RATINGS = new Set(['good', 'needs-improvement', 'poor', 'unknown']);

const normalizeString = (value) => String(value || '').trim();
const normalizeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getClientIp = (req) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  return normalizeString(req.ip || req.socket?.remoteAddress || '');
};

const logWebVital = async (req, res) => {
  try {
    const body = req.body || {};

    const metricName = normalizeString(body.metricName || body.name).toUpperCase();
    const value = normalizeNumber(body.value, NaN);
    const ratingRaw = normalizeString(body.rating).toLowerCase();

    if (!ALLOWED_METRICS.has(metricName)) {
      return res.status(400).json({ success: false, message: 'Invalid metricName' });
    }
    if (!Number.isFinite(value)) {
      return res.status(400).json({ success: false, message: 'Invalid value' });
    }

    const rating = ALLOWED_RATINGS.has(ratingRaw) ? ratingRaw : 'unknown';

    await WebVital.create({
      metricName,
      value,
      rating,
      metricId: normalizeString(body.metricId || body.id),
      path: normalizeString(body.path || '/'),
      navigationType: normalizeString(body.navigationType),
      userAgent: normalizeString(body.userAgent || req.headers['user-agent'] || ''),
      effectiveType: normalizeString(body.effectiveType),
      language: normalizeString(body.language),
      viewportWidth: normalizeNumber(body.viewportWidth, 0),
      viewportHeight: normalizeNumber(body.viewportHeight, 0),
      deviceMemory: normalizeNumber(body.deviceMemory, 0),
      hardwareConcurrency: normalizeNumber(body.hardwareConcurrency, 0),
      ipAddress: getClientIp(req),
      receivedAtClient: body.timestamp ? new Date(body.timestamp) : null,
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to log web vital',
      error: error.message,
    });
  }
};

const listWebVitals = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
    const metricName = normalizeString(req.query.metricName).toUpperCase();
    const path = normalizeString(req.query.path);

    const filter = {};
    if (ALLOWED_METRICS.has(metricName)) {
      filter.metricName = metricName;
    }
    if (path) {
      filter.path = path;
    }

    const rows = await WebVital.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch web vitals',
      error: error.message,
    });
  }
};

module.exports = {
  logWebVital,
  listWebVitals,
};
