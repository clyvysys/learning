// routes/certificate.routes.js
const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const authMiddleware = require('../middlewares/authMiddleware');
// RESTRICTED: Create a new certificate (Admin only)
router.post('/', authMiddleware, certificateController.createCertificate);

// PUBLIC: Get certificate by learningId
router.get('/:learningId', certificateController.getCertificateByLearningId);

// RESTRICTED: Get ALL certificates (Admin only)
router.get('/', authMiddleware, certificateController.getAllCertificates);

// RESTRICTED: Update certificate by MongoDB _id (Admin only)
router.put('/:id', authMiddleware, certificateController.updateCertificate);

// RESTRICTED: Delete certificate by MongoDB _id (Admin only)
router.delete('/:id', authMiddleware, certificateController.deleteCertificate);

// Optionally, you can require admin auth to generate PDFs,
// but if you want it public, leave out the authMiddleware
router.get('/:learningId/pdf', certificateController.downloadCertificatePDF);
module.exports = router;
