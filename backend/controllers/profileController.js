const Profile = require('../models/Profile');

// Get user profile with all data including volunteer info
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

// Create or update profile including volunteer information
const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    let profile = await Profile.findOne({ userId });

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { userId },
        { ...profileData, lastUpdated: new Date() },
        { new: true, runValidators: true }
      );
    } else {
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

// Get profile by email
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

// Get all registered volunteers
const getAllVolunteers = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    const volunteers = await Profile.find({ isVolunteer: true })
      .select('userId name email phone volunteerSkills availability certifications experience')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .exec();

    const total = await Profile.countDocuments({ isVolunteer: true });

    res.json({
      success: true,
      data: volunteers,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Get all volunteers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching volunteers'
    });
  }
};

// Get volunteers filtered by skill
const getVolunteersBySkill = async (req, res) => {
  try {
    const { skill } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    if (!skill) {
      return res.status(400).json({
        success: false,
        message: 'Skill parameter is required'
      });
    }

    const volunteers = await Profile.find({
      isVolunteer: true,
      volunteerSkills: { $in: [skill] }
    })
      .select('userId name email phone volunteerSkills availability certifications experience')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .exec();

    const total = await Profile.countDocuments({
      isVolunteer: true,
      volunteerSkills: { $in: [skill] }
    });

    res.json({
      success: true,
      data: volunteers,
      skill: skill,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Get volunteers by skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching volunteers by skill'
    });
  }
};

// Get currently available volunteers
const getAvailableVolunteers = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    const volunteers = await Profile.find({
      isVolunteer: true,
      'availability.status': 'available'
    })
      .select('userId name email phone volunteerSkills availability certifications experience preferredTasks')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .exec();

    const total = await Profile.countDocuments({
      isVolunteer: true,
      'availability.status': 'available'
    });

    res.json({
      success: true,
      data: volunteers,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Get available volunteers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available volunteers'
    });
  }
};

// Delete profile (for account deletion)
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
  getAllVolunteers,
  getVolunteersBySkill,
  getAvailableVolunteers,
  deleteProfile
};