const express = require('express');
const router = express.Router();

const {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  verifyReport,
  toggleCritical,
  resolveReport,
  deleteReport
} = require('../controllers/RoadReport');

// All routes are public (no auth middleware)
router.get('/', getAllReports);
router.get('/:id', getReportById);
router.post('/', createReport);
router.put('/:id', updateReport);
router.post('/:id/verify', verifyReport);
router.patch('/:id/critical', toggleCritical);
router.patch('/:id/resolve', resolveReport);
router.delete('/:id', deleteReport);

module.exports = router;