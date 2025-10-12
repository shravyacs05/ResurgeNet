const SOSAlert = require("../models/SOSAlert");
const Profile = require("../models/Profile");
const mlService = require("../services/mlServices");
const { 
  sendEmergencyAlertNotifications, 
  sendBulkWhatsAppMessages,
  isTwilioConfigured 
} = require('../notifications');

// Helper fallback department mapping function
function getFallbackDepartment(emergencyType) {
  const map = {
    medical: "medical_health",
    fire: "emergency_response",
    flood: "emergency_response",
    earthquake: "emergency_response",
    trapped: "emergency_response",
    "structural collapse": "infrastructure",
    stranded: "community_safety",
    other: "emergency_response",
  };
  return map[emergencyType] || "emergency_response";
}

exports.createSOSAlert = async (req, res) => {
  try {
    console.log("=== SOS Alert Creation Started ===");
    console.log("Request Body:", req.body);

    const { 
      emergencyType, 
      message, 
      peopleAffected, 
      description, 
      severity, 
      location, 
      userId 
    } = req.body;

    console.log("Extracted userId:", userId);

    // Validate required fields
    if (!message || !emergencyType || !location?.address || !userId) {
      console.log("Missing required fields:", {
        hasMessage: !!message,
        hasEmergencyType: !!emergencyType,
        hasLocation: !!location?.address,
        hasUserId: !!userId,
      });
      return res.status(400).json({ 
        success: false,
        error: "Message, emergency type, location, and userId are required" 
      });
    }

    // Validate location coordinates
    if (!location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        error: "Location coordinates (latitude and longitude) are required"
      });
    }

    // Fetch user profile with full details
    console.log("Fetching profile for userId:", userId);
    const userProfile = await Profile.findOne({ userId });
    console.log(
      "Profile found:",
      !!userProfile,
      userProfile ? { 
        name: userProfile.name, 
        id: userProfile._id,
        phone: userProfile.phone,
        emergencyContacts: userProfile.emergencyContacts?.length || 0
      } : null
    );

    if (!userProfile) {
      console.log("Profile not found for userId:", userId);
      return res.status(404).json({ 
        success: false,
        error: "User profile not found" 
      });
    }

    // Create the SOS alert with correct location format
    const sosAlert = new SOSAlert({
      userId: userProfile.userId,
      userName: userProfile.name,
      userPhone: userProfile.phone || "Not provided",
      emergencyType,
      message,
      peopleAffected: peopleAffected || 1,
      description,
      severity: severity || "high",
      location: {
        lat: location.latitude,
        lng: location.longitude,
        address: location.address
      }
    });

    console.log("SOS Alert object created with location:", sosAlert.location);

    // Get ML predictions
    let primaryDepartments = [];
    let urgencyLevel = severity || "medium";
    
    try {
      console.log("Sending to ML service:", message);
      const mlResponse = await mlService.predictSOS(message);
      console.log("ML Response received:", mlResponse);

      // Extract departments from ML response
      if (mlResponse.departments && typeof mlResponse.departments === "object") {
        primaryDepartments = Object.keys(mlResponse.departments);
        console.log("✅ Extracted primary departments from ML:", primaryDepartments);
      } else if (mlResponse.primary_departments && Array.isArray(mlResponse.primary_departments)) {
        primaryDepartments = mlResponse.primary_departments;
        console.log("✅ Using primary_departments from ML:", primaryDepartments);
      } else if (mlResponse.predictions) {
        const preds = mlResponse.predictions;
        const deptSet = new Set();
        
        if (preds.search_and_rescue || preds.security || preds.military || preds.aid_related) {
          deptSet.add("emergency_response");
        }
        if (preds.medical_help || preds.medical_products || preds.hospitals) {
          deptSet.add("medical_health");
        }
        if (preds.shelter || preds.food || preds.water || preds.clothing || preds.refugees) {
          deptSet.add("relief_shelter");
        }
        if (preds.weather_related || preds.floods || preds.storm || preds.earthquake || preds.fire) {
          deptSet.add("community_safety");
        }
        if (preds.infrastructure_related || preds.buildings || preds.electricity || preds.transport || preds.tools) {
          deptSet.add("infrastructure");
        }
        
        primaryDepartments = Array.from(deptSet);
        console.log("✅ Determined departments from predictions:", primaryDepartments);
      }

      // Calculate urgency level from predictions
      if (mlResponse.predictions) {
        const preds = mlResponse.predictions;
        if (preds.death || preds.missing_people || preds.medical_help || preds.search_and_rescue) {
          urgencyLevel = "critical";
        } else if (preds.floods || preds.fire || preds.earthquake || preds.storm || preds.shelter || preds.aid_related) {
          urgencyLevel = "high";
        }
      }
      console.log("📈 Calculated urgency level:", urgencyLevel);

      // Build active categories
      const activeCategories = [];
      if (mlResponse.predictions) {
        Object.entries(mlResponse.predictions).forEach(([category, value]) => {
          if (value === 1) {
            activeCategories.push({
              category: category,
              categoryDisplay: category.replace(/_/g, " ").toUpperCase(),
              confidence: 1,
            });
          }
        });
      }

      // Store ML classification results
      sosAlert.mlClassification = {
        predictions: mlResponse.predictions,
        primaryDepartments: primaryDepartments,
        activeCategories: activeCategories,
        confidenceScore: mlResponse.confidence_score || 0.8,
        urgencyLevel: urgencyLevel,
        processedAt: new Date(),
      };

    } catch (mlError) {
      console.error("ML prediction error:", mlError);
      // Fallback assignment
      primaryDepartments = [getFallbackDepartment(emergencyType)];
      urgencyLevel = severity || "high";
      
      sosAlert.mlClassification = {
        primaryDepartments: primaryDepartments,
        urgencyLevel: urgencyLevel,
        processedAt: new Date(),
        fallbackUsed: true
      };
    }

    // Assign to departments
    if (primaryDepartments.length > 0) {
      console.log("✅ Assigning to departments:", primaryDepartments);
      sosAlert.assignToDepartments(primaryDepartments, urgencyLevel);
    } else {
      const fallbackDept = getFallbackDepartment(emergencyType);
      sosAlert.assignToDepartments([fallbackDept], severity);
    }

    // If medical emergency and user has medical conditions, add to description
    if (emergencyType === "medical" && userProfile.medicalConditions) {
      sosAlert.description = `${description || ""}\n\nMedical History: ${userProfile.medicalConditions}\nBlood Group: ${userProfile.bloodGroup || "Unknown"}`;
    }

    // Save the alert
    console.log("Saving SOS alert to database...");
    await sosAlert.save();
    console.log("✅ SOS alert saved successfully with ID:", sosAlert._id);

    // Send WhatsApp notifications (non-blocking)
    if (isTwilioConfigured()) {
      console.log("📱 Sending WhatsApp notifications...");
      console.log(`👤 User: ${userProfile.name} (${userProfile.phone})`);
      console.log(`📞 Emergency Contacts: ${userProfile.emergencyContacts?.length || 0}`);
      
      // Log all emergency contacts
      if (userProfile.emergencyContacts && userProfile.emergencyContacts.length > 0) {
        userProfile.emergencyContacts.forEach((contact, index) => {
          console.log(`   ${index + 1}. ${contact.name} (${contact.relationship}) - ${contact.phone}`);
        });
      }
      
      // Format user phone to E.164
      console.log(`📱 Formatted user phone: ${userProfile.phone} → ${userProfile.phone}`);
      
      // Create a modified profile with formatted phone for notifications
      const notificationProfile = {
        ...userProfile.toObject(),
        phone: userProfile.phone
      };
      
      // Format emergency contact phones
      if (notificationProfile.emergencyContacts && notificationProfile.emergencyContacts.length > 0) {
        notificationProfile.emergencyContacts = notificationProfile.emergencyContacts.map(contact => {
          const formatted = contact.phone;
          console.log(`📱 Formatting contact ${contact.name}: ${contact.phone} → ${formatted}`);
          return {
            ...contact,
            phone: formatted
          };
        });
        
        console.log('📱 All emergency contacts formatted successfully');
      }
      
      // Send to user and emergency contacts
      sendEmergencyAlertNotifications(notificationProfile, {
        emergencyType,
        location: sosAlert.location,
        message,
        urgencyLevel
      }).then(results => {
        console.log("✅ Emergency notifications sent:");
        console.log(`   User notified: ${results.summary.userNotified ? '✅' : '❌'}`);
        console.log(`   Contacts notified: ${results.summary.contactsNotified}/${results.summary.totalContacts}`);
        
        if (results.emergencyContacts.length > 0) {
          console.log('   Detailed results:');
          results.emergencyContacts.forEach(contact => {
            const status = contact.result.success ? '✅' : '❌';
            console.log(`     ${status} ${contact.contact} (${contact.relationship})`);
          });
        }
      }).catch(error => {
        console.error("❌ Failed to send emergency notifications:", error);
      });

      // Send to nearby users within 5km
      Profile.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [location.longitude, location.latitude]
            },
            $maxDistance: 5000 // 5km radius
          }
        },
        phone: { $exists: true, $ne: null },
        userId: { $ne: userId } // Exclude the reporter
      }).limit(50).then(nearbyUsers => {
        if (nearbyUsers.length > 0) {
          console.log(`📍 Found ${nearbyUsers.length} nearby users to notify`);
          
          const nearbyMessage = `
⚠️ EMERGENCY ALERT NEARBY

Type: ${emergencyType.toUpperCase()}
Location: ${location.address}
Distance: Within 5km from you

${message}

Stay safe and be aware of your surroundings.
`.trim();

          // Format all phone numbers to E.164
          const phoneNumbers = nearbyUsers
            .map(u => formatPhoneToE164(u.phone))
            .filter(p => p && isValidE164(p));
          
          console.log(`📱 Sending to ${phoneNumbers.length} valid phone numbers`);
          
          sendBulkWhatsAppMessages(phoneNumbers, nearbyMessage).then(results => {
            const successCount = results.filter(r => r.value?.success).length;
            console.log(`✅ Notified ${successCount} nearby users via WhatsApp`);
          }).catch(error => {
            console.error("❌ Failed to notify nearby users:", error);
          });
        } else {
          console.log("ℹ️ No nearby users found within 5km");
        }
      }).catch(error => {
        console.error("❌ Error finding nearby users:", error);
      });
    } else {
      console.warn("⚠️ Twilio not configured - WhatsApp notifications disabled");
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: "SOS Alert created successfully",
      alertId: sosAlert._id,
      assignedDepartments: sosAlert.assignedDepartments.map(d => ({
        department: d.department,
        priority: d.priority,
        status: d.status
      })),
      urgencyLevel,
      notificationsEnabled: isTwilioConfigured()
    });

  } catch (error) {
    console.error("❌ SOS creation error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      success: false,
      error: "Failed to create SOS alert", 
      details: error.message 
    });
  }
};

// Get alerts for a specific department
exports.getDepartmentAlerts = async (req, res) => {
  try {
    const { department } = req.params;
    const {
      status,
      urgency,
      emergencyType,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {
      "assignedDepartments.department": department,
    };

    if (status) {
      if (status === "active") {
        query.status = {
          $in: ["pending", "verified", "assigned", "in_progress"],
        };
      } else {
        query.status = status;
      }
    }

    if (urgency) {
      query["mlClassification.urgencyLevel"] = urgency;
    }

    if (emergencyType) {
      query.emergencyType = emergencyType;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch alerts
    const alerts = await SOSAlert.find(query)
      .sort({
        "mlClassification.urgencyLevel": 1,
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await SOSAlert.countDocuments(query);

    // Add department-specific information
    const enrichedAlerts = alerts.map((alert) => {
      const deptInfo = alert.assignedDepartments.find(
        (d) => d.department === department
      );
      return {
        ...alert,
        departmentStatus: deptInfo?.status || "pending",
        departmentPriority: deptInfo?.priority || 999,
        departmentNotes: deptInfo?.notes || [],
      };
    });

    res.json({
      success: true,
      alerts: enrichedAlerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
        hasMore: total > skip + alerts.length,
      },
    });
  } catch (error) {
    console.error("Error fetching department alerts:", error);
    res.status(500).json({ 
      error: "Failed to fetch alerts", 
      details: error.message 
    });
  }
};

// Get department statistics
exports.getDepartmentStats = async (req, res) => {
  try {
    const { department } = req.params;
    const { startDate, endDate } = req.query;

    const dateRange = {};
    if (startDate) dateRange.start = new Date(startDate);
    if (endDate) dateRange.end = new Date(endDate);

    const stats = await SOSAlert.getDepartmentStats(department, dateRange);

    // Process the aggregation results
    const processedStats = {
      department,
      dateRange,
      statistics: {
        byStatus: stats[0].byStatus || [],
        byUrgency: stats[0].byUrgency || [],
        byEmergencyType: stats[0].byEmergencyType || [],
        responseMetrics: stats[0].avgResponseTime[0] || {
          avg: null,
          min: null,
          max: null,
        },
        totalAlerts: stats[0].totalAlerts[0]?.total || 0,
      },
    };

    // Get recent alerts
    const recentAlerts = await SOSAlert.findByDepartment(department)
      .limit(5)
      .select("emergencyType message severity status createdAt location");

    processedStats.recentAlerts = recentAlerts;

    res.json({
      success: true,
      ...processedStats,
    });
  } catch (error) {
    console.error("Error fetching department stats:", error);
    res.status(500).json({ 
      error: "Failed to fetch statistics", 
      details: error.message 
    });
  }
};

// Update alert status - FIXED VERSION
exports.updateAlertStatus = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status, notes, department, adminId, adminName } = req.body;

    console.log('🔧 Updating alert status:', { alertId, status, department, adminId });

    const alert = await SOSAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ 
        success: false,
        error: "Alert not found" 
      });
    }

    // Validate status against enum values
    const validStatuses = ['pending', 'verified', 'assigned', 'in_progress', 'resolved', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Prepare admin info
    const adminInfo = adminId && adminName
      ? { id: adminId, name: adminName }
      : null;

    // Handle main alert status transitions
    const mainStatusTransitions = ['pending', 'verified', 'assigned', 'in_progress', 'resolved', 'cancelled'];
    
    if (mainStatusTransitions.includes(status)) {
      console.log('✅ Updating main alert status:', status);
      
      // Update the main alert status
      alert.status = status;
      
      // Update response metrics based on status
      if (status === 'verified' && !alert.responseMetrics.firstViewedAt) {
        alert.responseMetrics.firstViewedAt = new Date();
        alert.responseMetrics.firstViewedBy = adminName || 'Admin';
        alert.verified = true;
      }
      
      if (status === 'assigned' && !alert.responseMetrics.acknowledgedAt) {
        alert.responseMetrics.acknowledgedAt = new Date();
        alert.responseMetrics.acknowledgedBy = adminName || 'Admin';
      }
      
      if (status === 'in_progress' && !alert.responseMetrics.firstResponseAt) {
        alert.responseMetrics.firstResponseAt = new Date();
      }
      
      if (status === 'resolved' && !alert.responseMetrics.resolvedAt) {
        alert.responseMetrics.resolvedAt = new Date();
        alert.responseMetrics.resolvedBy = adminName || 'Admin';
        
        // Update user trust score
        await Profile.findOneAndUpdate(
          { userId: alert.userId },
          {
            $inc: { trustScore: 2 },
            $max: { trustScore: 100 }
          }
        );
      }
      
      // Update department-specific status to match main status
      if (department) {
        const deptStatusMapping = {
          'pending': 'pending',
          'verified': 'acknowledged',
          'assigned': 'acknowledged',
          'in_progress': 'responding',
          'resolved': 'completed',
          'cancelled': 'transferred'
        };
        
        const deptStatus = deptStatusMapping[status] || 'pending';
        alert.updateDepartmentStatus(department, deptStatus, adminInfo);
      }
    } else {
      // Handle department-specific status (acknowledged, responding, completed, etc.)
      console.log('✅ Updating department status:', status);
      if (department) {
        alert.updateDepartmentStatus(department, status, adminInfo);
      }
    }

    // Add note if provided
    if (notes && department) {
      alert.addNote(department, notes, adminName || 'System');
    }

    // Save the alert
    await alert.save();
    
    console.log('✅ Alert updated successfully');

    // Prepare response
    const deptAssignment = department 
      ? alert.assignedDepartments.find(d => d.department === department)
      : null;

    res.json({
      success: true,
      message: "Alert status updated successfully",
      data: {
        _id: alert._id,
        status: alert.status,
        verified: alert.verified,
        departmentStatus: deptAssignment?.status,
        updatedAt: alert.updatedAt,
        assignedDepartments: alert.assignedDepartments
      }
    });
  } catch (error) {
    console.error("❌ Error updating alert:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update alert", 
      message: error.message 
    });
  }
};

// Get user's alerts
exports.getUserAlerts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const userProfile = await Profile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({ 
        success: false,
        error: "User profile not found" 
      });
    }

    const alerts = await SOSAlert.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-verifications -voters");

    res.json({
      success: true,
      alerts,
      userInfo: {
        name: userProfile.name,
        trustScore: userProfile.trustScore,
      },
    });
  } catch (error) {
    console.error("Error fetching user alerts:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch user alerts",
      details: error.message 
    });
  }
};

// Get alert details
exports.getAlertDetails = async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = await SOSAlert.findById(alertId);

    if (!alert) {
      return res.status(404).json({ 
        success: false,
        error: "Alert not found" 
      });
    }

    // Get user profile for additional info
    const userProfile = await Profile.findOne({ userId: alert.userId });

    res.json({
      success: true,
      alert,
      userProfile: userProfile
        ? {
            name: userProfile.name,
            trustScore: userProfile.trustScore,
            emergencyContacts: userProfile.emergencyContacts,
            medicalConditions: userProfile.medicalConditions,
            bloodGroup: userProfile.bloodGroup,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching alert details:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch alert details",
      details: error.message 
    });
  }
};

// Get active alerts for department
exports.getActiveDepartmentAlerts = async (req, res) => {
  try {
    const { department } = req.params;

    const alerts = await SOSAlert.find({
      "assignedDepartments.department": department,
      status: { $in: ["pending", "verified", "assigned", "in_progress"] },
    })
      .sort({
        "mlClassification.urgencyLevel": 1,
        createdAt: -1,
      })
      .limit(50)
      .lean();

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error("Error fetching active alerts:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch active alerts", 
      details: error.message 
    });
  }
};

// Get urgent alerts for department
exports.getUrgentDepartmentAlerts = async (req, res) => {
  try {
    const { department } = req.params;

    const alerts = await SOSAlert.find({
      "assignedDepartments.department": department,
      "mlClassification.urgencyLevel": { $in: ["critical", "high"] },
      status: { $nin: ["resolved", "cancelled"] },
    })
      .sort({
        "mlClassification.urgencyLevel": 1,
        createdAt: -1,
      })
      .lean();

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error("Error fetching urgent alerts:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch urgent alerts", 
      details: error.message 
    });
  }
};