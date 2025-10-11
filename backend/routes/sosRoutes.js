const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');
const { authenticate } = require('../middleware/auth');

// Public routes (for users)
router.post('/create', sosController.createSOSAlert);
router.get('/user/:userId/history', sosController.getUserAlerts);
router.get('/alert/:alertId', sosController.getAlertDetails);

// Department admin routes - REMOVE checkDepartmentAccess for now
router.get('/department/:department', sosController.getDepartmentAlerts);
router.get('/department/:department/stats', sosController.getDepartmentStats);
router.get('/department/:department/active', sosController.getActiveDepartmentAlerts);
router.get('/department/:department/urgent', sosController.getUrgentDepartmentAlerts);

// Alert management (department admins only)
router.patch('/:alertId/status', sosController.updateAlertStatus);

module.exports = router;