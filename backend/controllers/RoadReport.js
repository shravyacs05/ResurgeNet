const RoadReport = require('../models/RoadReport');

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

exports.getAllReports = async (req, res) => {
  try {
    const {
      type,
      verified,
      critical,
      status,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 50,
    } = req.query;

    let query = { isActive: true };
    if (type) query.type = type;
    if (verified !== undefined) query.verified = verified === 'true';
    if (critical !== undefined) query.critical = critical === 'true';
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reporterName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const reports = await RoadReport.find(query)
      .sort(sort)
      .limit(parseInt(limit, 10))
      .skip(skip)
      .lean();

    const total = await RoadReport.countDocuments(query);

    const reportsWithTime = reports.map(r => ({
      ...r,
      time: getTimeAgo(r.createdAt),
    }));

    res.json({
      success: true,
      count: reports.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      data: reportsWithTime,
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await RoadReport.findById(req.params.id).lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await RoadReport.updateOne({ _id: report._id }, { $inc: { views: 1 } });

    res.json({
      success: true,
      data: { ...report, time: getTimeAgo(report.createdAt) },
    });
  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({ success: false, message: 'Error fetching report', error: error.message });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { type, location, description, critical, coordinates, images, reportedBy, reporterName } = req.body;

    if (!type || !location || !description || !reportedBy || !reporterName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, location, description, reportedBy and reporterName',
      });
    }

    const report = await RoadReport.create({
      type,
      location,
      description,
      critical: critical || false,
      coordinates,
      images,
      reportedBy,
      reporterName,
    });

    res.status(201).json({ success: true, message: 'Report created', data: report });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(400).json({ success: false, message: 'Error creating report', error: error.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const report = await RoadReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const allowedUpdates = ['type', 'location', 'description', 'coordinates', 'images', 'critical', 'status', 'verified', 'needsAdminApproval'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        report[field] = req.body[field];
      }
    });

    await report.save();

    res.json({ success: true, message: 'Report updated', data: report });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(400).json({ success: false, message: 'Error updating report', error: error.message });
  }
};

// User verification (existing functionality)
exports.verifyReport = async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required for verification' });
    }

    const report = await RoadReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.reportedBy === userId) {
      return res.status(403).json({ success: false, message: 'You cannot verify your own report' });
    }

    const userIdStr = String(userId);
    const alreadyVerified = report.verifiedBy.some(v => String(v.user) === userIdStr);

    if (alreadyVerified) {
      return res.status(403).json({ success: false, message: 'You can verify this report only once' });
    }

    if (report.verifications >= 10) {
      return res.status(403).json({
        success: false,
        message: 'Verification limit reached. Report requires admin approval',
      });
    }

    report.verifiedBy.push({ user: userIdStr });
    report.verifications = report.verifiedBy.length;

    // Auto-verify if enough user verifications
    if (report.verifications >= report.autoVerifyThreshold) {
      report.verified = true;
      report.needsAdminApproval = false;
    }

    await report.save();

    return res.json({ success: true, message: 'Report verified', data: report });
  } catch (error) {
    console.error('Verify report error:', error);
    res.status(500).json({ success: false, message: 'Error verifying report', error: error.message });
  }
};

// ADMIN VERIFICATION - Direct verification by admin
exports.adminVerifyReport = async (req, res) => {
  try {
    const adminId = req.body.adminId || req.user?.id;
    if (!adminId) {
      return res.status(400).json({ success: false, message: 'Admin ID is required' });
    }

    const report = await RoadReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check if admin already verified
    const adminAlreadyVerified = report.verifiedBy.some(v => 
      v.user === 'department_admin' || v.user.includes('department_admin') || v.user === adminId
    );

    if (adminAlreadyVerified) {
      return res.status(400).json({ success: false, message: 'Admin has already verified this report' });
    }

    // Add admin verification
    report.verifiedBy.push({ 
      user: `admin_${adminId}`,
      verifiedAt: new Date()
    });
    
    // Direct verification by admin
    report.verified = true;
    report.needsAdminApproval = false;
    report.verifications = report.verifiedBy.length;

    await report.save();

    console.log(`✅ Admin ${adminId} verified report: ${report._id}`);

    return res.json({ 
      success: true, 
      message: 'Report verified by admin', 
      data: report 
    });
  } catch (error) {
    console.error('Admin verify report error:', error);
    res.status(500).json({ success: false, message: 'Error verifying report as admin', error: error.message });
  }
};

// ADMIN TOGGLE VERIFICATION - Toggle verification status directly
exports.adminToggleVerification = async (req, res) => {
  try {
    const adminId = req.body.adminId || req.user?.id;
    if (!adminId) {
      return res.status(400).json({ success: false, message: 'Admin ID is required' });
    }

    const report = await RoadReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Toggle verification status
    report.verified = !report.verified;
    
    // Add admin action to verifiedBy if verifying
    if (report.verified) {
      const adminAlreadyVerified = report.verifiedBy.some(v => 
        v.user === 'admin' || v.user.includes('admin') || v.user === adminId
      );
      
      if (!adminAlreadyVerified) {
        report.verifiedBy.push({ 
          user: `admin_${adminId}`,
          verifiedAt: new Date()
        });
        report.verifications = report.verifiedBy.length;
      }
    }

    report.needsAdminApproval = false;

    await report.save();

    console.log(`✅ Admin ${adminId} ${report.verified ? 'verified' : 'unverified'} report: ${report._id}`);

    return res.json({ 
      success: true, 
      message: `Report ${report.verified ? 'verified' : 'unverified'} by admin`, 
      data: report 
    });
  } catch (error) {
    console.error('Admin toggle verification error:', error);
    res.status(500).json({ success: false, message: 'Error toggling verification', error: error.message });
  }
};

exports.toggleCritical = async (req, res) => {
  try {
    const { markedCriticalBy } = req.body;
    const report = await RoadReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.critical = !report.critical;
    report.criticalMarkedAt = new Date();
    
    if (markedCriticalBy) {
      report.markedCriticalBy = markedCriticalBy;
    }

    await report.save();

    res.json({ 
      success: true, 
      message: `Report marked as ${report.critical ? 'critical' : 'normal'}`, 
      data: report 
    });
  } catch (error) {
    console.error('Toggle critical error:', error);
    res.status(500).json({ success: false, message: 'Error toggling critical status', error: error.message });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { resolutionNotes, resolvedBy } = req.body;
    const report = await RoadReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'resolved';
    report.resolvedAt = new Date();
    report.resolutionNotes = resolutionNotes || '';
    
    if (resolvedBy) {
      report.resolvedBy = resolvedBy;
    }

    await report.save();

    res.json({ success: true, message: 'Report resolved', data: report });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ success: false, message: 'Error resolving report', error: error.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await RoadReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.isActive = false;

    await report.save();

    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ success: false, message: 'Error deleting report', error: error.message });
  }
};

// Get reports needing admin approval
exports.getReportsNeedingApproval = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const reports = await RoadReport.find({
      isActive: true,
      $or: [
        { needsAdminApproval: true },
        { verifications: { $gte: 10 } },
        { critical: true }
      ]
    })
    .sort('-createdAt')
    .limit(parseInt(limit, 10))
    .skip(skip)
    .lean();

    const total = await RoadReport.countDocuments({
      isActive: true,
      $or: [
        { needsAdminApproval: true },
        { verifications: { $gte: 10 } },
        { critical: true }
      ]
    });

    const reportsWithTime = reports.map(r => ({
      ...r,
      time: getTimeAgo(r.createdAt),
    }));

    res.json({
      success: true,
      count: reports.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      data: reportsWithTime,
    });
  } catch (error) {
    console.error('Get reports needing approval error:', error);
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
};