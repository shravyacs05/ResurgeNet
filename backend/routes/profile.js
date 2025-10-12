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
// Get current user's profile (for logged-in user)
router.get('/me', async (req, res) => {
   try {
    // This is a simplified version - you'll need to adapt it to your auth system
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    // In a real app, you would verify the JWT token here
    // For now, we'll try to get user ID from query params or body
    const userId = req.query.userId || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get current profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});
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