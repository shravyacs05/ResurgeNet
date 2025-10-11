const express = require('express');
const Shelter = require('../models/Shelter');
const Profile = require('../models/Profile');

const router = express.Router();

// Auth Middleware
// Updated auth middleware in shelters.js
const auth = async (req, res, next) => {
  try {
    let userId = req.headers['user-id'];
    const authHeader = req.headers['authorization'];
    
    console.log('🔐 Auth middleware - Headers received:', {
      'user-id': userId,
      'authorization': authHeader ? 'Bearer ***' : 'None'
    });

    // If no user-id header, check for Firebase token in Authorization header
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      console.log('🔐 Firebase token received, but token verification not implemented');
      
      // For now, we'll use a simple approach
      userId = `firebase_user_${Date.now()}`;
      console.log('🔐 Using temporary user ID:', userId);
    }

    if (!userId) {
      console.log('❌ Auth failed - No user ID or token provided');
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide user ID or authentication token.'
      });
    }

    // Find user profile by userId
    let userProfile = await Profile.findOne({ userId: userId });
    
    if (!userProfile) {
      console.log('👤 Profile not found, creating new profile for userId:', userId);
      
      // Create a new profile automatically
      userProfile = new Profile({
        userId: userId,
        name: 'User',
        email: `${userId}@user.com`,
        phone: '',
        address: '',
        bloodGroup: '',
        medicalConditions: '',
        emergencyContacts: [],
        trustScore: 80
      });
      
      await userProfile.save();
      console.log('✅ New profile created:', userProfile._id);
    }

    // Add user information to request object
    req.user = {
      id: userProfile.userId,
      profileId: userProfile._id,
      name: userProfile.name,
      email: userProfile.email,
      role: userProfile.role || 'user' // Default to 'user' if no role specified
    };

    console.log('✅ Auth successful for user:', req.user.id, 'Role:', req.user.role);
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication'
    });
  }
};

// Admin middleware - checks if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'department_admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};


// Check if user is owner or admin
const isOwnerOrAdmin = (shelter, userId, userRole) => {
  const isOwner = shelter.createdBy.toString() === userId.toString();
  const isAdmin = userRole === 'admin' || userRole === 'department_admin';
  return isOwner || isAdmin;
};

// Get all shelters with filtering, sorting, and search
router.get('/', async (req, res) => {
  try {
    const {
      search,
      verified,
      facilities,
      sortBy = 'name',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object
    let filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Verification filter
    if (verified && verified !== 'all') {
      filter.verified = verified === 'verified';
    }

    // Facilities filter
    if (facilities) {
      const facilitiesArray = Array.isArray(facilities) ? facilities : [facilities];
      filter.facilities = { $all: facilitiesArray };
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'name':
        sortOptions.name = 1;
        break;
      case 'capacity':
        sortOptions.capacity = -1;
        break;
      case 'recent':
        sortOptions.lastUpdated = -1;
        break;
      default:
        sortOptions.name = 1;
    }

    // Execute query
    const shelters = await Shelter.find(filter)
      .sort(sortBy === 'availability' ? { capacity: -1 } : sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // For availability sorting
    let sortedShelters = shelters;
    if (sortBy === 'availability') {
      sortedShelters = shelters.sort((a, b) => {
        const availabilityA = a.capacity - a.occupied;
        const availabilityB = b.capacity - b.occupied;
        return availabilityB - availabilityA;
      });
    }

    const total = await Shelter.countDocuments(filter);

    res.json({
      success: true,
      data: sortedShelters,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalShelters: total
      }
    });
  } catch (error) {
    console.error('Get shelters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shelters'
    });
  }
});

// Get user's shelters (My Shelters)
router.get('/my-shelters', auth, async (req, res) => {
  try {
    const {
      search,
      verified,
      facilities,
      sortBy = 'name',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter object - only get shelters created by this user
    let filter = { createdBy: req.user.id };

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Verification filter
    if (verified && verified !== 'all') {
      filter.verified = verified === 'verified';
    }

    // Facilities filter
    if (facilities) {
      const facilitiesArray = Array.isArray(facilities) ? facilities : [facilities];
      filter.facilities = { $all: facilitiesArray };
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'name':
        sortOptions.name = 1;
        break;
      case 'capacity':
        sortOptions.capacity = -1;
        break;
      case 'recent':
        sortOptions.lastUpdated = -1;
        break;
      default:
        sortOptions.name = 1;
    }

    // Execute query
    const shelters = await Shelter.find(filter)
      .sort(sortBy === 'availability' ? { capacity: -1 } : sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // For availability sorting
    let sortedShelters = shelters;
    if (sortBy === 'availability') {
      sortedShelters = shelters.sort((a, b) => {
        const availabilityA = a.capacity - a.occupied;
        const availabilityB = b.capacity - b.occupied;
        return availabilityB - availabilityA;
      });
    }

    const total = await Shelter.countDocuments(filter);

    res.json({
      success: true,
      data: sortedShelters,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalShelters: total
      }
    });
  } catch (error) {
    console.error('Get my shelters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your shelters'
    });
  }
});

// Get single shelter by ID
router.get('/:id', async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    
    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    res.json({
      success: true,
      data: shelter
    });
  } catch (error) {
    console.error('Get shelter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shelter'
    });
  }
});

// Create new shelter (with authentication)
router.post('/', auth, async (req, res) => {
  try {
    const shelterData = {
      ...req.body,
      createdBy: req.user.id,
      lastUpdated: new Date()
    };

    const shelter = new Shelter(shelterData);
    await shelter.save();

    res.status(201).json({
      success: true,
      data: shelter,
      message: 'Shelter created successfully'
    });
  } catch (error) {
    console.error('Create shelter error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating shelter'
    });
  }
});

// ========== OCCUPANCY MANAGEMENT ROUTES ==========

// Update shelter occupancy (Public - for anyone)
router.patch('/:id/occupancy', async (req, res) => {
  try {
    const { change } = req.body;
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    const newOccupied = shelter.occupied + parseInt(change);
    
    if (newOccupied < 0 || newOccupied > shelter.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Invalid occupancy change'
      });
    }

    shelter.occupied = newOccupied;
    shelter.lastUpdated = new Date();
    await shelter.save();

    res.json({
      success: true,
      data: shelter,
      message: 'Occupancy updated successfully'
    });
  } catch (error) {
    console.error('Update occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating occupancy'
    });
  }
});

// Update shelter occupancy (for shelter creators and admins)
router.patch('/:id/creator-occupancy', auth, async (req, res) => {
  try {
    const { change } = req.body;
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    // Check if user owns the shelter or is admin
    if (!isOwnerOrAdmin(shelter, req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update occupancy for shelters that you created or as admin'
      });
    }

    const newOccupied = shelter.occupied + parseInt(change);
    
    if (newOccupied < 0) {
      return res.status(400).json({
        success: false,
        message: 'Occupancy cannot be negative'
      });
    }

    if (newOccupied > shelter.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Occupancy cannot exceed capacity'
      });
    }

    shelter.occupied = newOccupied;
    shelter.lastUpdated = new Date();
    await shelter.save();

    console.log(`✅ Creator/Admin occupancy updated: ${shelter.name} - ${change} (${shelter.occupied}/${shelter.capacity}) by ${req.user.role}`);

    res.json({
      success: true,
      data: shelter,
      message: 'Occupancy updated successfully'
    });
  } catch (error) {
    console.error('Update creator occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating occupancy'
    });
  }
});

// Set exact occupancy (for shelter creators and admins)
router.patch('/:id/set-occupancy', auth, async (req, res) => {
  try {
    const { occupancy } = req.body;
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    // Check if user owns the shelter or is admin
    if (!isOwnerOrAdmin(shelter, req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update occupancy for shelters that you created or as admin'
      });
    }

    if (occupancy < 0 || occupancy > shelter.capacity) {
      return res.status(400).json({
        success: false,
        message: `Occupancy must be between 0 and ${shelter.capacity}`
      });
    }

    shelter.occupied = parseInt(occupancy);
    shelter.lastUpdated = new Date();
    await shelter.save();

    console.log(`✅ Creator/Admin set occupancy: ${shelter.name} - ${occupancy}/${shelter.capacity} by ${req.user.role}`);

    res.json({
      success: true,
      data: shelter,
      message: 'Occupancy set successfully'
    });
  } catch (error) {
    console.error('Set occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting occupancy'
    });
  }
});

// Bulk occupancy operations (for shelter creators and admins)
router.patch('/:id/bulk-occupancy', auth, async (req, res) => {
  try {
    const { operation, value } = req.body;
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    // Check if user owns the shelter or is admin
    if (!isOwnerOrAdmin(shelter, req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update occupancy for shelters that you created or as admin'
      });
    }

    let newOccupied;

    switch (operation) {
      case 'set':
        newOccupied = parseInt(value);
        break;
      case 'add':
        newOccupied = shelter.occupied + parseInt(value);
        break;
      case 'subtract':
        newOccupied = shelter.occupied - parseInt(value);
        break;
      case 'fill':
        newOccupied = shelter.capacity;
        break;
      case 'empty':
        newOccupied = 0;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation'
        });
    }

    if (newOccupied < 0 || newOccupied > shelter.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Invalid occupancy value'
      });
    }

    shelter.occupied = newOccupied;
    shelter.lastUpdated = new Date();
    await shelter.save();

    console.log(`✅ Bulk occupancy by ${req.user.role}: ${shelter.name} - ${operation} ${value} (${shelter.occupied}/${shelter.capacity})`);

    res.json({
      success: true,
      data: shelter,
      message: 'Occupancy updated successfully'
    });
  } catch (error) {
    console.error('Bulk occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating occupancy'
    });
  }
});

// Get occupancy history (for shelter creators and admins)
router.get('/:id/occupancy-history', auth, async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    // Check if user owns the shelter or is admin
    if (!isOwnerOrAdmin(shelter, req.user.id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only view occupancy history for shelters that you created or as admin'
      });
    }

    // For now, return basic info. You can implement proper history tracking later
    res.json({
      success: true,
      data: {
        shelter: shelter.name,
        currentOccupancy: shelter.occupied,
        capacity: shelter.capacity,
        lastUpdated: shelter.lastUpdated,
        history: [] // Placeholder for future implementation
      },
      message: 'Occupancy history retrieved successfully'
    });
  } catch (error) {
    console.error('Get occupancy history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching occupancy history'
    });
  }
});

// Toggle shelter verification (Admin only)
router.patch('/:id/verification', auth, requireAdmin, async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    shelter.verified = !shelter.verified;
    shelter.lastUpdated = new Date();
    await shelter.save();

    console.log(`✅ Admin verification: ${shelter.name} - ${shelter.verified ? 'verified' : 'unverified'}`);

    res.json({
      success: true,
      data: shelter,
      message: `Shelter ${shelter.verified ? 'verified' : 'unverified'} successfully`
    });
  } catch (error) {
    console.error('Toggle verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating verification'
    });
  }
});

// Update shelter (with ownership or admin check)
// Update shelter (with ownership OR admin check)
router.put('/:id', auth, async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    // Check if user owns the shelter OR is admin
    const isOwner = shelter.createdBy.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'department_admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only update shelters that you created, unless you are an admin'
      });
    }

    const updatedShelter = await Shelter.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    );

    console.log(`✅ Shelter updated by ${isAdmin ? 'admin' : 'owner'}: ${updatedShelter.name}`);

    res.json({
      success: true,
      data: updatedShelter,
      message: 'Shelter updated successfully'
    });
  } catch (error) {
    console.error('Update shelter error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating shelter'
    });
  }
});

// Update shelter occupancy (for shelter creators AND admins)
router.patch('/:id/creator-occupancy', auth, async (req, res) => {
  try {
    const { change } = req.body;
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    // Check if user owns the shelter OR is admin
    const isOwner = shelter.createdBy.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'department_admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only update occupancy for shelters that you created, unless you are an admin'
      });
    }

    const newOccupied = shelter.occupied + parseInt(change);
    
    if (newOccupied < 0) {
      return res.status(400).json({
        success: false,
        message: 'Occupancy cannot be negative'
      });
    }

    if (newOccupied > shelter.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Occupancy cannot exceed capacity'
      });
    }

    shelter.occupied = newOccupied;
    shelter.lastUpdated = new Date();
    await shelter.save();

    console.log(`✅ ${isAdmin ? 'Admin' : 'Creator'} occupancy updated: ${shelter.name} - ${change} (${shelter.occupied}/${shelter.capacity})`);

    res.json({
      success: true,
      data: shelter,
      message: 'Occupancy updated successfully'
    });
  } catch (error) {
    console.error('Update creator occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating occupancy'
    });
  }
});

// Set exact occupancy (for shelter creators AND admins)
router.patch('/:id/set-occupancy', auth, async (req, res) => {
  try {
    const { occupancy } = req.body;
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    // Check if user owns the shelter OR is admin
    const isOwner = shelter.createdBy.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'department_admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only update occupancy for shelters that you created, unless you are an admin'
      });
    }

    if (occupancy < 0 || occupancy > shelter.capacity) {
      return res.status(400).json({
        success: false,
        message: `Occupancy must be between 0 and ${shelter.capacity}`
      });
    }

    shelter.occupied = parseInt(occupancy);
    shelter.lastUpdated = new Date();
    await shelter.save();

    console.log(`✅ ${isAdmin ? 'Admin' : 'Creator'} set occupancy: ${shelter.name} - ${occupancy}/${shelter.capacity}`);

    res.json({
      success: true,
      data: shelter,
      message: 'Occupancy set successfully'
    });
  } catch (error) {
    console.error('Set occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting occupancy'
    });
  }
});

// Delete shelter (with ownership OR admin check)
router.delete('/:id', auth, async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    // Check if user owns the shelter OR is admin
    const isOwner = shelter.createdBy.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'department_admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete shelters that you created, unless you are an admin'
      });
    }

    await Shelter.findByIdAndDelete(req.params.id);

    console.log(`✅ Shelter deleted by ${isAdmin ? 'admin' : 'owner'}: ${shelter.name}`);

    res.json({
      success: true,
      message: 'Shelter deleted successfully'
    });
  } catch (error) {
    console.error('Delete shelter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting shelter'
    });
  }
});

// Admin-only routes for bulk operations
router.patch('/admin/bulk-verify', auth, requireAdmin, async (req, res) => {
  try {
    const { shelterIds } = req.body;
    
    const result = await Shelter.updateMany(
      { _id: { $in: shelterIds } },
      { 
        verified: true,
        lastUpdated: new Date()
      }
    );

    console.log(`✅ Admin bulk verified ${result.modifiedCount} shelters`);

    res.json({
      success: true,
      message: `${result.modifiedCount} shelters verified successfully`
    });
  } catch (error) {
    console.error('Bulk verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while bulk verifying shelters'
    });
  }
});

// Get all shelters with admin privileges (includes all data)
router.get('/admin/all-shelters', auth, requireAdmin, async (req, res) => {
  try {
    const {
      search,
      verified,
      facilities,
      sortBy = 'name',
      page = 1,
      limit = 100
    } = req.query;

    // Build filter object
    let filter = {};

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ];
    }

    // Verification filter
    if (verified && verified !== 'all') {
      filter.verified = verified === 'verified';
    }

    // Facilities filter
    if (facilities) {
      const facilitiesArray = Array.isArray(facilities) ? facilities : [facilities];
      filter.facilities = { $all: facilitiesArray };
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'name':
        sortOptions.name = 1;
        break;
      case 'capacity':
        sortOptions.capacity = -1;
        break;
      case 'recent':
        sortOptions.lastUpdated = -1;
        break;
      case 'created':
        sortOptions.createdAt = -1;
        break;
      default:
        sortOptions.name = 1;
    }

    // Execute query with all fields
    const shelters = await Shelter.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Use lean for better performance

    // Populate creator information if needed
    const sheltersWithCreatorInfo = await Promise.all(
      shelters.map(async (shelter) => {
        const creator = await Profile.findOne({ userId: shelter.createdBy });
        return {
          ...shelter,
          creatorName: creator ? creator.name : 'Unknown',
          creatorEmail: creator ? creator.email : 'Unknown'
        };
      })
    );

    const total = await Shelter.countDocuments(filter);

    res.json({
      success: true,
      data: sheltersWithCreatorInfo,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalShelters: total
      }
    });
  } catch (error) {
    console.error('Admin get shelters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching shelters'
    });
  }
});

// ========== ADMIN-ONLY ROUTES ==========


// Admin bulk operations
router.patch('/admin/bulk-actions', auth, requireAdmin, async (req, res) => {
  try {
    const { action, shelterIds, data } = req.body;

    if (!shelterIds || !Array.isArray(shelterIds)) {
      return res.status(400).json({
        success: false,
        message: 'shelterIds must be an array'
      });
    }

    let updateData = {};
    let message = '';

    switch (action) {
      case 'verify':
        updateData = { verified: true };
        message = 'Shelters verified successfully';
        break;
      case 'unverify':
        updateData = { verified: false };
        message = 'Shelters unverified successfully';
        break;
      case 'update':
        updateData = { ...data };
        message = 'Shelters updated successfully';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    updateData.lastUpdated = new Date();

    const result = await Shelter.updateMany(
      { _id: { $in: shelterIds } },
      updateData
    );

    console.log(`✅ Admin bulk action: ${action} on ${shelterIds.length} shelters`);

    res.json({
      success: true,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      },
      message
    });
  } catch (error) {
    console.error('Admin bulk actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing bulk actions'
    });
  }
});

// ========== DEBUG ROUTES ==========

// Debug route to check all shelters
router.get('/debug/all-shelters', async (req, res) => {
  try {
    const shelters = await Shelter.find({});
    
    console.log('🔍 All shelters in database:', shelters.length);
    const sheltersWithOwners = shelters.map(shelter => ({
      name: shelter.name,
      createdBy: shelter.createdBy,
      occupancy: `${shelter.occupied}/${shelter.capacity}`,
      id: shelter._id
    }));
    
    console.log('🔍 Shelters with owners:', sheltersWithOwners);

    res.json({
      success: true,
      data: sheltersWithOwners,
      total: shelters.length
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug error'
    });
  }
});

// Debug route to check user's shelters
router.get('/debug/user-shelters/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log('🔍 Checking shelters for user:', userId);
    
    const userShelters = await Shelter.find({ createdBy: userId });
    
    console.log('🔍 Shelters found for user:', userShelters.length);
    userShelters.forEach(shelter => {
      console.log(`🔍 User Shelter: ${shelter.name}, Occupancy: ${shelter.occupied}/${shelter.capacity}, ID: ${shelter._id}`);
    });

    res.json({
      success: true,
      data: userShelters,
      total: userShelters.length,
      userId: userId
    });
  } catch (error) {
    console.error('User shelters debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug error'
    });
  }
});

// Debug route to create test shelter
router.post('/debug/create-test', auth, async (req, res) => {
  try {
    const testShelter = new Shelter({
      name: 'Test Shelter for ' + req.user.id,
      location: 'Test Location',
      capacity: 50,
      occupied: 0,
      facilities: ['Food', 'Water'],
      contact: 'test@example.com',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      verified: false,
      createdBy: req.user.id
    });

    await testShelter.save();

    res.json({
      success: true,
      data: testShelter,
      message: 'Test shelter created'
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test shelter'
    });
  }
});

module.exports = router;