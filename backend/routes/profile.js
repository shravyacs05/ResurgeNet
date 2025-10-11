const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getProfileByEmail,
  getAllVolunteers,
  getVolunteersBySkill,
  getAvailableVolunteers,
  deleteProfile
} = require('../controllers/profileController');

// Health check endpoint
router.get('/check', (req, res) => {
  res.json({
    success: true,
    message: 'Profile service is running'
  });
});

// Profile endpoints
// Get user profile by Firebase UID
router.get('/:userId', getProfile);

// Update user profile by Firebase UID
router.put('/:userId', updateProfile);

// Get profile by email
router.get('/email/:email', getProfileByEmail);

// Delete profile
router.delete('/:userId', deleteProfile);

// Volunteer endpoints
// Get all registered volunteers
router.get('/volunteers/all', getAllVolunteers);

// Get currently available volunteers
router.get('/volunteers/available', getAvailableVolunteers);

// Get volunteers by skill
router.get('/volunteers/skill/:skill', getVolunteersBySkill);

module.exports = router;