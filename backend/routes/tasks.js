// routes/tasks.js - Fixed version
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Profile = require('../models/Profile');

// Task categories
const TASK_CATEGORIES = [
  'Emergency Department',
  'Medical & Health', 
  'Infrastructure',
  'Relief & Shelter',
  'Environment',
  'Community Support'
];

// Task priorities
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Create new task
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      location,
      requiredSkills,
      estimatedHours,
      deadline,
      resources,
      coordinates
    } = req.body;

    console.log('📝 Creating task with data:', { title, category, priority, location, coordinates });

    // Validate required fields
    if (!title || !description || !category || !priority || !location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, category, priority, location'
      });
    }

    // Validate category
    if (!TASK_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid task category. Must be one of: ${TASK_CATEGORIES.join(', ')}`
      });
    }

    // Validate priority
    if (!TASK_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: `Invalid task priority. Must be one of: ${TASK_PRIORITIES.join(', ')}`
      });
    }

    // Prepare task data
    const taskData = {
      title,
      description,
      category,
      priority,
      location,
      requiredSkills: requiredSkills || [],
      estimatedHours: estimatedHours || 4,
      deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
      resources: resources || '',
      createdBy: 'admin', // Default since auth is removed
      status: 'pending'
    };

    // Only add coordinates if they exist and are valid
    if (coordinates && coordinates.lat && coordinates.lng) {
      taskData.coordinates = {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat] // MongoDB uses [longitude, latitude]
      };
    }

    console.log('✅ Final task data:', taskData);

    const task = new Task(taskData);
    await task.save();

    console.log('✅ Task created successfully:', task._id);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      message: error.message
    });
  }
});

// Get all tasks with filters
// Get all tasks with filters - UPDATED VERSION
router.get('/', async (req, res) => {
  try {
    const {
      category,
      priority,
      status,
      assignedTo,
      createdBy,
      page = 1,
      limit = 10,
      search
    } = req.query;

    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (priority && priority !== 'all') filter.priority = priority;
    if (status && status !== 'all') filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (createdBy) filter.createdBy = createdBy;

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('📋 Task filter criteria:', filter);

    const tasks = await Task.find(filter)
      .sort({ 
        priority: -1, // urgent/high priority first
        createdAt: -1 // newest first
      })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(filter);

    console.log(`✅ Found ${tasks.length} tasks`);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks'
    });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task'
    });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.assignedTo;
    delete updates.assignedBy;
    delete updates.assignedAt;

    // Handle coordinates update
    if (updates.coordinates && updates.coordinates.lat && updates.coordinates.lng) {
      updates.coordinates = {
        type: 'Point',
        coordinates: [updates.coordinates.lng, updates.coordinates.lat]
      };
    } else if (updates.coordinates === null) {
      updates.coordinates = undefined;
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    });
  }
});

// Assign task to volunteer
// Assign task to volunteer - UPDATED WITH assignedBy
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { volunteerId, assignedBy } = req.body;

    console.log('🔄 Assigning task:', id, 'to volunteer:', volunteerId, 'by admin:', assignedBy);

    // Validate request body
    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer ID is required in request body'
      });
    }

    if (!assignedBy) {
      return res.status(400).json({
        success: false,
        message: 'assignedBy (admin ID) is required in request body'
      });
    }

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if task is already assigned
    if (task.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Task is already assigned to another volunteer'
      });
    }

    // Find the volunteer
    const volunteer = await Profile.findOne({ 
      userId: volunteerId, 
      isVolunteer: true 
    });
    
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    // Update the task
    task.assignedTo = volunteerId;
    task.assignedBy = assignedBy; // Add this line
    task.status = 'assigned';
    task.assignedAt = new Date();

    await task.save();

    console.log('✅ Task assigned successfully');

    res.json({
      success: true,
      message: 'Task assigned successfully',
      data: task
    });

  } catch (error) {
    console.error('❌ Assign task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning task',
      error: error.message
    });
  }
});

// Unassign task
router.patch('/:id/unassign', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const volunteerId = task.assignedTo;

    // Update task
    task.assignedTo = null;
    task.assignedBy = null;
    task.assignedAt = null;
    task.status = 'pending';

    await task.save();

    // Update volunteer availability if needed
    if (volunteerId) {
      const assignedTasksCount = await Task.countDocuments({
        assignedTo: volunteerId,
        status: { $in: ['assigned', 'in_progress'] }
      });

      if (assignedTasksCount < 3) {
        await Profile.findOneAndUpdate(
          { userId: volunteerId },
          { 'availability.status': 'available' }
        );
      }
    }

    res.json({
      success: true,
      message: 'Task unassigned successfully',
      data: task
    });
  } catch (error) {
    console.error('Unassign task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unassign task'
    });
  }
});

// Update task status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'completed' && { completedAt: new Date() })
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task status'
    });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    });
  }
});
// Assign task to volunteer
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { volunteerId } = req.body;

    console.log('🔄 Assigning task:', id, 'to volunteer:', volunteerId);

    // Validate request body
    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer ID is required in request body'
      });
    }

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if task is already assigned
    if (task.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Task is already assigned to another volunteer'
      });
    }

    // Find the volunteer
    const volunteer = await Profile.findOne({ 
      userId: volunteerId, 
      isVolunteer: true 
    });
    
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    // Update the task
    task.assignedTo = volunteerId;
    task.status = 'assigned';
    task.assignedAt = new Date();

    await task.save();

    console.log('✅ Task assigned successfully');

    res.json({
      success: true,
      message: 'Task assigned successfully',
      data: task
    });

  } catch (error) {
    console.error('❌ Assign task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning task',
      error: error.message
    });
  }
});
// Unassign task from volunteer
router.patch('/:id/unassign', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🔄 Unassigning task:', id);

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if task is actually assigned
    if (!task.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Task is not currently assigned'
      });
    }

    // Update the task
    task.assignedTo = null;
    task.status = 'pending';
    task.assignedAt = null;

    await task.save();

    console.log('✅ Task unassigned successfully');

    res.json({
      success: true,
      message: 'Task unassigned successfully',
      data: task
    });

  } catch (error) {
    console.error('❌ Unassign task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unassigning task',
      error: error.message
    });
  }
});
// Get tasks assigned to a specific volunteer by userId
router.get('/volunteer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      status,
      category,
      priority,
      page = 1,
      limit = 20
    } = req.query;

    console.log('🔍 Fetching tasks for volunteer:', userId);

    // Build filter
    const filter = { assignedTo: userId };

    // Add optional filters
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    console.log('📋 Filter criteria:', filter);

    const tasks = await Task.find(filter)
      .sort({ 
        priority: -1, // urgent/high priority first
        createdAt: -1 // newest first
      })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Task.countDocuments(filter);

    console.log(`✅ Found ${tasks.length} tasks for volunteer ${userId}`);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get volunteer tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volunteer tasks',
      message: error.message
    });
  }
});

// Get task statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          assigned: {
            $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] }
          },
          in_progress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Task.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          pending: 0,
          assigned: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0
        },
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task statistics'
    });
  }
});

module.exports = router;