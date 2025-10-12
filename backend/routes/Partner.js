// routes/Partner.js
const express = require('express');
const router = express.Router();

// Import the partner controller
const partnerController = require('../controllers/Partner');

// Statistics route - MUST be before /:id routes
router.get('/stats', partnerController.getStats);

// Public routes
router.get('/', partnerController.getAllPartners);
router.get('/:id', partnerController.getPartnerById);
router.post('/', partnerController.createPartner);

// Approval routes - Use PATCH to match controller
router.patch('/:id/approve', partnerController.approvePartner);
router.patch('/:id/reject', partnerController.rejectPartner);

// Admin routes (uncomment when you have auth middleware)
// router.put('/:id', partnerController.updatePartner);
// router.delete('/:id', partnerController.deletePartner);

module.exports = router;