const Certificate = require('../models/certificate.model');

const CERT_PREFIX = 'KPTMGLR-SPORTS';

const toSafeString = (value) => String(value ?? '').trim();

const toYear = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
};

const formatCertificateId = (year, sequence) =>
  `${CERT_PREFIX}-${year}-${String(sequence).padStart(4, '0')}`;

const normalizePayload = (body = {}) => ({
  studentId: toSafeString(body.studentId || body.id || body.playerId),
  year: toYear(body.year),
  name: toSafeString(body.name),
  kpmNo: toSafeString(body.kpmNo),
  semester: toSafeString(body.semester),
  department: toSafeString(body.department),
  competition: toSafeString(body.competition),
  position: toSafeString(body.position),
  achievement: toSafeString(body.achievement),
});

const issueCertificate = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);

    if (!payload.studentId || !Number.isInteger(payload.year)) {
      return res.status(400).json({ message: 'studentId and year are required' });
    }

    const lookup = {
      studentId: payload.studentId,
      year: payload.year,
      competition: payload.competition,
      position: payload.position,
    };

    const existing = await Certificate.findOne(lookup).lean();
    if (existing) {
      return res.status(200).json({
        created: false,
        certificate: existing,
      });
    }

    const lastIssued = await Certificate.findOne({ year: payload.year })
      .sort({ sequence: -1 })
      .select('sequence')
      .lean();

    const nextSequence = (lastIssued?.sequence || 0) + 1;

    const created = await Certificate.create({
      ...payload,
      sequence: nextSequence,
      certificateId: formatCertificateId(payload.year, nextSequence),
      issuedBy: toSafeString(req.user?.id || req.user?._id),
    });

    return res.status(201).json({
      created: true,
      certificate: created,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await Certificate.findOne({
        studentId: toSafeString(req.body?.studentId || req.body?.id || req.body?.playerId),
        year: toYear(req.body?.year),
        competition: toSafeString(req.body?.competition),
        position: toSafeString(req.body?.position),
      }).lean();

      if (existing) {
        return res.status(200).json({
          created: false,
          certificate: existing,
        });
      }
    }

    return res.status(500).json({ message: 'Failed to issue certificate' });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const certificateId = toSafeString(req.params.certificateId || req.params.id).toUpperCase();
    if (!certificateId) {
      return res.status(400).json({ message: 'certificateId is required' });
    }

    const certificate = await Certificate.findOne({ certificateId }).lean();
    if (!certificate) {
      return res.status(404).json({ message: 'Invalid certificate' });
    }

    return res.status(200).json({
      certificateId: certificate.certificateId,
      studentId: certificate.studentId,
      name: certificate.name,
      kpmNo: certificate.kpmNo,
      semester: certificate.semester,
      department: certificate.department,
      competition: certificate.competition,
      position: certificate.position,
      achievement: certificate.achievement,
      year: certificate.year,
      issuedAt: certificate.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify certificate' });
  }
};

const listIssuedCertificates = async (req, res) => {
  try {
    const year = toYear(req.query?.year);
    const filter = Number.isInteger(year) ? { year } : {};

    const certificates = await Certificate.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(certificates.map((item) => ({
      _id: item._id,
      studentId: item.studentId,
      certificateId: item.certificateId,
      name: item.name,
      competition: item.competition,
      position: item.position,
      year: item.year,
      createdAt: item.createdAt,
    })));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch certificates' });
  }
};

module.exports = {
  issueCertificate,
  verifyCertificate,
  listIssuedCertificates,
};
