const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const {
  issueCertificate,
  verifyCertificate,
  listIssuedCertificates,
} = require('../controllers/certificate.controller');

router.get('/verify/:id', verifyCertificate);
router.get('/', authMiddleware, roleMiddleware(['admin', 'superadmin']), listIssuedCertificates);
router.post('/issue', authMiddleware, roleMiddleware(['admin', 'superadmin']), issueCertificate);
router.post('/save', authMiddleware, roleMiddleware(['admin', 'superadmin']), issueCertificate);

module.exports = router;
