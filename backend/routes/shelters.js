const express = require('express');
const Shelter = require('../models/Shelter');
const Profile = require('../models/Profile');

const router = express.Router();

// Auth Middleware
const auth = async (req, res, next) => {
  // TEMPORARY: Development bypass - remove in production
  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 Development mode - Using default admin user');
    
    req.user = {
      id: 'admin_superadmin_emergency_gov',
      profileId: 'dev_admin_profile',
      name: 'Super Administrator',
      email: 'superadmin@emergency.gov',
      role: 'super_admin',
      department: 'all'
    };
    
    return next();
  }

  try {
    let userId = req.headers['user-id'];
    const authHeader = req.headers['authorization'];
    
    console.log('🔐 Auth middleware - Headers received:', {
      'user-id': userId,
      'authorization': authHeader ? 'Bearer ***' : 'None'
    });

    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      console.log('🔐 Firebase token received, but token verification not implemented');
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
      
      userProfile = new Profile({
        userId: userId,
        name: 'User',
        email: `${userId}@user.com`,
        phone: '',
        address: '',
        bloodGroup: '',
        medicalConditions: '',
        emergencyContacts: [],
        trustScore: 80,
        role: 'user'
      });
      
      await userProfile.save();
      console.log('✅ New profile created:', userProfile._id);
    }

    req.user = {
      id: userProfile.userId,
      profileId: userProfile._id,
      name: userProfile.name,
      email: userProfile.email,
      role: userProfile.role || 'user'
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

// Admin middleware - Include super_admin
const requireAdmin = (req, res, next) => {
  const isAdmin = req.user.role === 'admin' || req.user.role === 'department_admin' || req.user.role === 'super_admin';
  
  console.log('🔐 Admin check:', {
    userId: req.user.id,
    userRole: req.user.role,
    isAdmin: isAdmin
  });

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required. Current role: ' + req.user.role
    });
  }
  next();
};

// Helper function to check if user is admin
const isAdmin = (userRole) => {
  return userRole === 'admin' || userRole === 'department_admin' || userRole === 'super_admin';
};

// Check if user is owner or admin
const isOwnerOrAdmin = (shelter, userId, userRole) => {
  const isOwner = shelter.createdBy && shelter.createdBy.toString() === userId.toString();
  const isAdminUser = isAdmin(userRole);
  
  console.log('🔐 Permission check:', {
    shelterId: shelter._id,
    shelterCreator: shelter.createdBy,
    currentUser: userId,
    userRole: userRole,
    isOwner: isOwner,
    isAdmin: isAdminUser
  });

  return isOwner || isAdminUser;
};

// ========== PUBLIC ROUTES ==========

// Get all shelters with filtering and search
router.get('/', async (req, res) => {
  try {
    const {
      search,
      verified,
      facilities,
      sortBy = 'name',
      page = 1,
      limit = 50
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
      case 'availability':
        sortOptions.occupied = 1;
        break;
      case 'recent':
        sortOptions.lastUpdated = -1;
        break;
      default:
        sortOptions.name = 1;
    }

    // Execute query
    const shelters = await Shelter.find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v')
      .lean();

    const total = await Shelter.countDocuments(filter);

    res.json({
      success: true,
      data: shelters,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalShelters: total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
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

// ========== AUTHENTICATED USER ROUTES ==========

// Get shelters created by the current user
router.get('/my-shelters', auth, async (req, res) => {
  try {
    console.log('🔍 Fetching shelters for user:', {
      userId: req.user.id,
      userProfileId: req.user.profileId,
      userName: req.user.name,
      userRole: req.user.role
    });

    const {
      search,
      verified,
      facilities,
      sortBy = 'name',
      page = 1,
      limit = 50
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
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v')
      .lean();

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

    console.log(`✅ Found ${sortedShelters.length} shelters for user ${req.user.id}`);

    res.json({
      success: true,
      data: sortedShelters,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalShelters: total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      },
      message: `Found ${sortedShelters.length} shelters`
    });
  } catch (error) {
    console.error('Get my shelters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your shelters'
    });
  }
});

// Create new shelter
router.post('/', auth, async (req, res) => {
  try {
    const shelterData = {
      ...req.body,
      createdBy: req.user.id,
      lastUpdated: new Date(),
      lastUpdatedBy: {
        userId: req.user.id,
        name: req.user.name,
        role: req.user.role
      }
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

// Update shelter (ALLOW ALL ADMINS TO EDIT ANY SHELTER)
router.put('/:id', auth, async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    // Check if user owns the shelter OR is any type of admin
    const isOwner = shelter.createdBy && shelter.createdBy.toString() === req.user.id.toString();
    const isAdminUser = isAdmin(req.user.role);
    
    console.log('🔐 Update shelter permission:', {
      shelter: shelter.name,
      user: req.user.id,
      role: req.user.role,
      isOwner: isOwner,
      isAdmin: isAdminUser
    });

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        success: false,
        message: 'You can only update shelters that you created, unless you are an admin'
      });
    }

    const updateData = {
      ...req.body,
      lastUpdated: new Date(),
      lastUpdatedBy: {
        userId: req.user.id,
        name: req.user.name,
        role: req.user.role
      }
    };

    const updatedShelter = await Shelter.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log(`✅ Shelter updated by ${isAdminUser ? 'admin' : 'owner'}: ${updatedShelter.name}`);

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

// Update shelter occupancy (ALLOW ALL ADMINS TO UPDATE ANY SHELTER OCCUPANCY)
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

    // Check if user owns the shelter OR is any type of admin
    const isOwner = shelter.createdBy && shelter.createdBy.toString() === req.user.id.toString();
    const isAdminUser = isAdmin(req.user.role);
    
    console.log('🔐 Occupancy update permission:', {
      shelter: shelter.name,
      user: req.user.id,
      role: req.user.role,
      isOwner: isOwner,
      isAdmin: isAdminUser
    });

    if (!isOwner && !isAdminUser) {
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
    shelter.lastUpdatedBy = {
      userId: req.user.id,
      name: req.user.name,
      role: req.user.role
    };
    
    await shelter.save();

    console.log(`✅ ${isAdminUser ? 'Admin' : 'Creator'} occupancy updated: ${shelter.name} - ${change} (${shelter.occupied}/${shelter.capacity})`);

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

// Set exact occupancy (ALLOW ALL ADMINS TO SET ANY SHELTER OCCUPANCY)
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

    // Check if user owns the shelter OR is any type of admin
    const isOwner = shelter.createdBy && shelter.createdBy.toString() === req.user.id.toString();
    const isAdminUser = isAdmin(req.user.role);
    
    console.log('🔐 Set occupancy permission:', {
      shelter: shelter.name,
      user: req.user.id,
      role: req.user.role,
      isOwner: isOwner,
      isAdmin: isAdminUser
    });

    if (!isOwner && !isAdminUser) {
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
    shelter.lastUpdatedBy = {
      userId: req.user.id,
      name: req.user.name,
      role: req.user.role
    };
    
    await shelter.save();

    console.log(`✅ ${isAdminUser ? 'Admin' : 'Creator'} set occupancy: ${shelter.name} - ${occupancy}/${shelter.capacity}`);

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

// Bulk occupancy operations for creators
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

    // Check if user owns the shelter
    const isOwner = shelter.createdBy && shelter.createdBy.toString() === req.user.id.toString();
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only update occupancy for shelters that you created'
      });
    }

    let newOccupied = shelter.occupied;

    // Handle different bulk operations
    switch (operation) {
      case 'set':
        newOccupied = parseInt(value);
        break;
      case 'add':
        newOccupied += parseInt(value);
        break;
      case 'subtract':
        newOccupied -= parseInt(value);
        break;
      case 'empty':
        newOccupied = 0;
        break;
      case 'half':
        newOccupied = Math.floor(shelter.capacity / 2);
        break;
      case 'full':
        newOccupied = shelter.capacity;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation'
        });
    }

    // Validate occupancy
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
    shelter.lastUpdatedBy = {
      userId: req.user.id,
      name: req.user.name,
      role: req.user.role
    };
    
    await shelter.save();

    console.log(`✅ Creator bulk occupancy: ${shelter.name} - ${operation} (${shelter.occupied}/${shelter.capacity})`);

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

// Delete shelter (ALLOW ALL ADMINS TO DELETE ANY SHELTER)
router.delete('/:id', auth, async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    // Check if user owns the shelter OR is any type of admin
    const isOwner = shelter.createdBy && shelter.createdBy.toString() === req.user.id.toString();
    const isAdminUser = isAdmin(req.user.role);
    
    console.log('🔐 Delete permission:', {
      shelter: shelter.name,
      user: req.user.id,
      role: req.user.role,
      isOwner: isOwner,
      isAdmin: isAdminUser
    });

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete shelters that you created, unless you are an admin'
      });
    }

    await Shelter.findByIdAndDelete(req.params.id);

    console.log(`✅ Shelter deleted by ${isAdminUser ? 'admin' : 'owner'}: ${shelter.name}`);

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

// ========== ADMIN-ONLY ROUTES ==========

// Admin occupancy update (bypasses ownership check)
router.patch('/admin/:id/creator-occupancy', auth, requireAdmin, async (req, res) => {
  try {
    const { change } = req.body;
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    console.log('🔐 Admin occupancy update:', {
      shelter: shelter.name,
      user: req.user.id,
      role: req.user.role
    });

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
    shelter.lastUpdatedBy = {
      userId: req.user.id,
      name: req.user.name,
      role: req.user.role
    };
    
    await shelter.save();

    console.log(`✅ Admin occupancy updated: ${shelter.name} - ${change} (${shelter.occupied}/${shelter.capacity})`);

    res.json({
      success: true,
      data: shelter,
      message: 'Occupancy updated successfully'
    });
  } catch (error) {
    console.error('Admin occupancy update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating occupancy'
    });
  }
});

// Admin update shelter (bypasses ownership check)
router.put('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    console.log('🔐 Admin update shelter:', {
      shelter: shelter.name,
      user: req.user.id,
      role: req.user.role
    });

    const updateData = {
      ...req.body,
      lastUpdated: new Date(),
      lastUpdatedBy: {
        userId: req.user.id,
        name: req.user.name,
        role: req.user.role
      }
    };

    const updatedShelter = await Shelter.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log(`✅ Admin updated shelter: ${updatedShelter.name}`);

    res.json({
      success: true,
      data: updatedShelter,
      message: 'Shelter updated successfully'
    });
  } catch (error) {
    console.error('Admin update shelter error:', error);
    
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

// Admin set exact occupancy (bypasses ownership check)
router.patch('/admin/:id/set-occupancy', auth, requireAdmin, async (req, res) => {
  try {
    const { occupancy } = req.body;
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    console.log('🔐 Admin set occupancy:', {
      shelter: shelter.name,
      user: req.user.id,
      role: req.user.role,
      newOccupancy: occupancy
    });

    if (occupancy < 0 || occupancy > shelter.capacity) {
      return res.status(400).json({
        success: false,
        message: `Occupancy must be between 0 and ${shelter.capacity}`
      });
    }

    shelter.occupied = parseInt(occupancy);
    shelter.lastUpdated = new Date();
    shelter.lastUpdatedBy = {
      userId: req.user.id,
      name: req.user.name,
      role: req.user.role
    };
    
    await shelter.save();

    console.log(`✅ Admin set occupancy: ${shelter.name} - ${occupancy}/${shelter.capacity}`);

    res.json({
      success: true,
      data: shelter,
      message: 'Occupancy set successfully'
    });
  } catch (error) {
    console.error('Admin set occupancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting occupancy'
    });
  }
});

// Admin toggle verification
router.patch('/admin/:id/verification', auth, requireAdmin, async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    console.log('🔐 Admin toggle verification:', {
      shelter: shelter.name,
      user: req.user.id,
      role: req.user.role,
      currentVerification: shelter.verified
    });

    shelter.verified = !shelter.verified;
    shelter.lastUpdated = new Date();
    shelter.lastUpdatedBy = {
      userId: req.user.id,
      name: req.user.name,
      role: req.user.role
    };
    
    await shelter.save();

    console.log(`✅ Admin verification toggled: ${shelter.name} - ${shelter.verified ? 'verified' : 'unverified'}`);

    res.json({
      success: true,
      data: shelter,
      message: `Shelter ${shelter.verified ? 'verified' : 'unverified'} successfully`
    });
  } catch (error) {
    console.error('Admin toggle verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating verification'
    });
  }
});

// Admin get all shelters with enhanced filtering and pagination
router.get('/admin/shelters', auth, requireAdmin, async (req, res) => {
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
      case 'occupancy':
        sortOptions.occupied = -1;
        break;
      case 'recent':
        sortOptions.lastUpdated = -1;
        break;
      case 'created':
        sortOptions.createdAt = -1;
        break;
      case 'verified':
        sortOptions.verified = -1;
        break;
      default:
        sortOptions.name = 1;
    }

    // Execute query with all fields
    const shelters = await Shelter.find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Populate creator information
    const sheltersWithCreatorInfo = await Promise.all(
      shelters.map(async (shelter) => {
        const creator = await Profile.findOne({ userId: shelter.createdBy });
        return {
          ...shelter,
          creatorName: creator ? creator.name : 'Unknown User',
          creatorEmail: creator ? creator.email : 'Unknown',
          creatorRole: creator ? creator.role : 'user'
        };
      })
    );

    const total = await Shelter.countDocuments(filter);

    res.json({
      success: true,
      data: sheltersWithCreatorInfo,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalShelters: total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
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

// Admin delete shelter (bypasses ownership check)
router.delete('/admin/:id', auth, requireAdmin, async (req, res) => {
  try {
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return res.status(404).json({
        success: false,
        message: 'Shelter not found'
      });
    }

    console.log('🔐 Admin delete:', {
      shelter: shelter.name,
      user: req.user.id,
      role: req.user.role
    });

    await Shelter.findByIdAndDelete(req.params.id);

    console.log(`✅ Admin deleted shelter: ${shelter.name}`);

    res.json({
      success: true,
      message: 'Shelter deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete shelter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting shelter'
    });
  }
});

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

    console.log('🔐 Toggle verification:', {
      shelter: shelter.name,
      user: req.user.id,
      role: req.user.role,
      currentVerification: shelter.verified
    });

    shelter.verified = !shelter.verified;
    shelter.lastUpdated = new Date();
    shelter.lastUpdatedBy = {
      userId: req.user.id,
      name: req.user.name,
      role: req.user.role
    };
    
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