const express = require('express');
const router = express.Router();

const {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  verifyReport,
  adminVerifyReport,
  adminToggleVerification,
  toggleCritical,
  resolveReport,
  deleteReport,
  getReportsNeedingApproval
} = require('../controllers/RoadReport');

// Public routes
router.get('/', getAllReports);
router.get('/needing-approval', getReportsNeedingApproval);
router.get('/:id', getReportById);
router.post('/', createReport);

// User verification
router.post('/:id/verify', verifyReport);

// Admin routes (you'll need to add auth middleware for these)
router.post('/:id/admin/verify', adminVerifyReport);
router.patch('/:id/admin/verification', adminToggleVerification);
router.patch('/:id/critical', toggleCritical);
router.patch('/:id/resolve', resolveReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

module.exports = router;