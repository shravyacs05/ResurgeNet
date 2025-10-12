// controllers/partner.controller.js
const Partner = require('../models/Partner');

// @desc    Get all partners with filters
// @route   GET /api/partners
// @access  Public
exports.getAllPartners = async (req, res) => {
  try {
    const { 
      status,
      organizationType,
      supportType,
      city,
      state,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Status filter
    if (status) {
      query.status = status;
      console.log('🔍 Filtering by status:', status);
    }

    // Organization type filter
    if (organizationType) {
      query.organizationType = organizationType;
    }

    // Support type filter
    if (supportType) {
      query.supportType = supportType;
    }

    // Location filters
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    if (state) {
      query.state = { $regex: state, $options: 'i' };
    }

    // Search filter
    if (search) {
      query.$or = [
        { organizationName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('📋 Final Query:', JSON.stringify(query));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const partners = await Partner.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count
    const total = await Partner.countDocuments(query);

    console.log('✅ Found partners:', partners.length);
    console.log('📊 Status breakdown:', partners.map(p => p.status));

    res.json({
      success: true,
      count: partners.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: partners
    });
  } catch (error) {
    console.error('❌ Get partners error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching partners',
      error: error.message
    });
  }
};

// @desc    Get single partner by ID
// @route   GET /api/partners/:id
// @access  Public
exports.getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    res.json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('❌ Get partner by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching partner',
      error: error.message
    });
  }
};

// @desc    Create new partner
// @route   POST /api/partners
// @access  Public
exports.createPartner = async (req, res) => {
  try {
    console.log('📥 Creating new partner:', req.body);
    
    const partner = await Partner.create(req.body);

    console.log('✅ Partner created:', partner._id, 'Status:', partner.status);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Our team will review it within 24-48 hours.',
      data: partner
    });
  } catch (error) {
    console.error('❌ Create partner error:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating partner',
      error: error.message
    });
  }
};

// @desc    Approve partner
// @route   PATCH /api/partners/:id/approve
// @access  Private (Admin)
exports.approvePartner = async (req, res) => {
  try {
    console.log('✅ Approve request for partner:', req.params.id);
    console.log('📝 Request body:', req.body);

    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Update partner status
    partner.status = 'approved';
    partner.approvedBy = req.body.approvedBy || 'admin';
    partner.approverName = req.body.approverName || 'Administrator';
    partner.approvedAt = new Date();
    
    await partner.save();

    console.log('✅ Partner approved successfully:', partner.organizationName);

    res.json({
      success: true,
      message: 'Partner approved successfully',
      data: partner
    });
  } catch (error) {
    console.error('❌ Approve partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving partner',
      error: error.message
    });
  }
};

// @desc    Reject partner
// @route   PATCH /api/partners/:id/reject
// @access  Private (Admin)
exports.rejectPartner = async (req, res) => {
  try {
    console.log('❌ Reject request for partner:', req.params.id);
    console.log('📝 Request body:', req.body);

    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    // Update partner status
    partner.status = 'rejected';
    partner.rejectedBy = req.body.rejectedBy || 'admin';
    partner.rejectionReason = rejectionReason;
    partner.rejectedAt = new Date();
    
    await partner.save();

    console.log('❌ Partner rejected successfully:', partner.organizationName);

    res.json({
      success: true,
      message: 'Partner rejected successfully',
      data: partner
    });
  } catch (error) {
    console.error('❌ Reject partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting partner',
      error: error.message
    });
  }
};

// @desc    Update partner
// @route   PUT /api/partners/:id
// @access  Private (Admin)
exports.updatePartner = async (req, res) => {
  try {
    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    res.json({
      success: true,
      message: 'Partner updated successfully',
      data: partner
    });
  } catch (error) {
    console.error('❌ Update partner error:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating partner',
      error: error.message
    });
  }
};

// @desc    Delete partner (soft delete)
// @route   DELETE /api/partners/:id
// @access  Private (Admin)
exports.deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found'
      });
    }

    partner.isActive = false;
    await partner.save();

    res.json({
      success: true,
      message: 'Partner deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete partner error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting partner',
      error: error.message
    });
  }
};

// @desc    Get statistics
// @route   GET /api/partners/stats
// @access  Public
exports.getStats = async (req, res) => {
  try {
    const total = await Partner.countDocuments({ isActive: true });
    const pending = await Partner.countDocuments({ isActive: true, status: 'pending' });
    const approved = await Partner.countDocuments({ isActive: true, status: 'approved' });
    const rejected = await Partner.countDocuments({ isActive: true, status: 'rejected' });

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected
      }
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};