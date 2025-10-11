const Profile = require('../models/Profile');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

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
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// Create or update profile
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    // Find existing profile or create new one
    let profile = await Profile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { userId },
        { ...profileData, lastUpdated: new Date() },
        { new: true, runValidators: true }
      );
    } else {
      // Create new profile
      profile = new Profile({
        userId,
        ...profileData
      });
      await profile.save();
    }

    res.json({
      success: true,
      message: profile ? 'Profile updated successfully' : 'Profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
};

// Get profile by email (optional)
const getProfileByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const profile = await Profile.findOne({ email: email.toLowerCase() });
    
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
    console.error('Get profile by email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// Delete profile (optional - for account deletion)
const deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOneAndDelete({ userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting profile'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getProfileByEmail,
  deleteProfile
};