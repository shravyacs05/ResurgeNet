const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getProfileByEmail,
  deleteProfile
} = require('../controllers/profileController');

// Get user profile by Firebase UID
router.get('/:userId', getProfile);

// Update user profile by Firebase UID
router.put('/:userId', updateProfile);

// Get profile by email (optional)
router.get('/email/:email', getProfileByEmail);

// Delete profile (optional)
router.delete('/:userId', deleteProfile);

module.exports = router;