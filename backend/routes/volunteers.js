// routes/volunteers.js
const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const Task = require('../models/Task');

// Get all volunteers with filters
router.get('/', async (req, res) => {
  try {
    const {
      skills,
      availability,
      department,
      location,
      page = 1,
      limit = 20,
      search
    } = req.query;

    const filter = { isVolunteer: true };

    // Apply filters
    if (skills) {
      const skillsArray = skills.split(',');
      filter.volunteerSkills = { $in: skillsArray };
    }

    if (availability) {
      filter['availability.status'] = availability;
    }

    if (department && department !== 'all') {
      filter.department = department;
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'volunteerSkills': { $regex: search, $options: 'i' } }
      ];
    }

    const volunteers = await Profile.find(filter)
      .select('name email phone volunteerSkills availability department trustScore rating tasksCompleted joinDate location userId')
      .sort({ trustScore: -1, rating: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get task counts for each volunteer
    const volunteersWithStats = await Promise.all(
      volunteers.map(async (volunteer) => {
        const taskStats = await Task.aggregate([
          {
            $match: { assignedTo: volunteer.userId }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const currentTasks = taskStats.find(stat => stat._id === 'assigned' || stat._id === 'in_progress')?.count || 0;
        const completedTasks = taskStats.find(stat => stat._id === 'completed')?.count || 0;

        return {
          ...volunteer.toObject(),
          currentTasks,
          completedTasks
        };
      })
    );

    const total = await Profile.countDocuments(filter);

    res.json({
      success: true,
      data: volunteersWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get volunteers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volunteers'
    });
  }
});

// Get volunteer by ID
router.get('/:id', async (req, res) => {
  try {
    const volunteer = await Profile.findOne({ 
      userId: req.params.id, 
      isVolunteer: true 
    }).select('-emergencyContacts -medicalConditions');

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    // Get volunteer's task history
    const tasks = await Task.find({ assignedTo: req.params.id })
      .select('title category status priority assignedAt completedAt')
      .sort({ assignedAt: -1 })
      .limit(10);

    // Calculate statistics
    const taskStats = await Task.aggregate([
      {
        $match: { assignedTo: req.params.id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$estimatedHours' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        volunteer,
        tasks,
        statistics: taskStats
      }
    });
  } catch (error) {
    console.error('Get volunteer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volunteer details'
    });
  }
});

// Update volunteer availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const { status, schedule } = req.body;

    const volunteer = await Profile.findOne({ userId: req.params.id });

    if (!volunteer || !volunteer.isVolunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    volunteer.availability = volunteer.availability || {};
    volunteer.availability.status = status;
    if (schedule) {
      volunteer.availability.schedule = schedule;
    }

    await volunteer.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: volunteer.availability
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability'
    });
  }
});

// Get volunteers for task matching
// Get all volunteers (no matching) - SIMPLIFIED FRONTEND VERSION
// Get all volunteers (simplest version)
router.get('/match/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log('🔍 Getting all volunteers for task:', taskId);

    // Get all volunteers
    const volunteers = await Profile.find({
      isVolunteer: true
    })
    .select('userId name email phone volunteerSkills availability department trustScore rating tasksCompleted location')
    .sort({ trustScore: -1, rating: -1 })
    .lean();

    console.log(`✅ Found ${volunteers.length} volunteers`);

    res.json({
      success: true,
      data: volunteers
    });

  } catch (error) {
    console.error('❌ Get volunteers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volunteers'
    });
  }
});

// Get volunteer statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Profile.aggregate([
      {
        $match: { isVolunteer: true }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$availability.status', 'available'] }, 1, 0] }
          },
          busy: {
            $sum: { $cond: [{ $eq: ['$availability.status', 'busy'] }, 1, 0] }
          },
          unavailable: {
            $sum: { $cond: [{ $eq: ['$availability.status', 'unavailable'] }, 1, 0] }
          }
        }
      }
    ]);

    const departmentStats = await Profile.aggregate([
      {
        $match: { isVolunteer: true }
      },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$availability.status', 'available'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get top skills
    const topSkills = await Profile.aggregate([
      {
        $match: { isVolunteer: true }
      },
      {
        $unwind: '$volunteerSkills'
      },
      {
        $group: {
          _id: '$volunteerSkills',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          available: 0,
          busy: 0,
          unavailable: 0
        },
        byDepartment: departmentStats,
        topSkills
      }
    });
  } catch (error) {
    console.error('Get volunteer stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volunteer statistics'
    });
  }
});

module.exports = router;