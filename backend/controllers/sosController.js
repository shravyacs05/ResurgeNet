const SOSAlert = require("../models/SOSAlert");
const Profile = require("../models/Profile");
const mlService = require("../services/mlServices");

// Helper function defined at the top
function getFallbackDepartment(emergencyType) {
  const typeMapping = {
    medical: "medical_health",
    fire: "emergency_response",
    flood: "emergency_response",
    earthquake: "emergency_response",
    trapped: "emergency_response",
    "structural collapse": "infrastructure",
    stranded: "community_safety",
    other: "emergency_response",
  };

  return typeMapping[emergencyType] || "emergency_response";
}

exports.createSOSAlert = async (req, res) => {
  try {
    console.log("=== SOS Alert Creation Started ===");
    console.log("Request Body:", req.body);
    console.log("User ID from body:", req.body.userId);

    const {
      emergencyType,
      message,
      peopleAffected,
      description,
      severity,
      location,
      userId, // Firebase UID from request body
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
        error: "Message, emergency type, location, and userId are required",
      });
    }

    // Fetch user profile
    console.log("Fetching profile for userId:", userId);
    const userProfile = await Profile.findOne({ userId });
    console.log(
      "Profile found:",
      !!userProfile,
      userProfile ? { name: userProfile.name, id: userProfile._id } : null
    );

    if (!userProfile) {
      console.log("Profile not found for userId:", userId);
      return res.status(404).json({ error: "User profile not found" });
    }

    // Create the SOS alert
    const sosAlert = new SOSAlert({
      userId: userProfile.userId,
      userName: userProfile.name,
      userPhone: userProfile.phone || "Not provided",
      emergencyType,
      message,
      peopleAffected: peopleAffected || 1,
      description,
      severity: severity || "high",
      location,
    });

    console.log("SOS Alert object created with userId:", sosAlert.userId);

    // Get ML predictions
    // Get ML predictions
    try {
      console.log("Sending to ML service:", message);
      const mlResponse = await mlService.predictSOS(message);
      console.log("ML Response received:", mlResponse);

      // Extract departments from ML response
      let primaryDepartments = [];

      // Check if departments exist in response
      if (
        mlResponse.departments &&
        typeof mlResponse.departments === "object"
      ) {
        // ML service returns departments as an object with keys
        primaryDepartments = Object.keys(mlResponse.departments);
        console.log(
          "✅ Extracted primary departments from ML:",
          primaryDepartments
        );
      } else if (
        mlResponse.primary_departments &&
        Array.isArray(mlResponse.primary_departments)
      ) {
        // Already in array format
        primaryDepartments = mlResponse.primary_departments;
        console.log(
          "✅ Using primary_departments from ML:",
          primaryDepartments
        );
      } else {
        console.log(
          "⚠️ No departments field in ML response, will analyze predictions"
        );
      }

      // If still no departments, analyze predictions to determine departments
      if (primaryDepartments.length === 0 && mlResponse.predictions) {
        console.log("📊 Analyzing predictions to determine departments...");
        const preds = mlResponse.predictions;
        const deptSet = new Set();

        // Emergency Response
        if (
          preds.search_and_rescue ||
          preds.security ||
          preds.military ||
          preds.aid_related
        ) {
          deptSet.add("emergency_response");
        }

        // Medical Health
        if (preds.medical_help || preds.medical_products || preds.hospitals) {
          deptSet.add("medical_health");
        }

        // Relief & Shelter
        if (
          preds.shelter ||
          preds.food ||
          preds.water ||
          preds.clothing ||
          preds.refugees
        ) {
          deptSet.add("relief_shelter");
        }

        // Community Safety (Weather/Disaster monitoring)
        if (
          preds.weather_related ||
          preds.floods ||
          preds.storm ||
          preds.earthquake ||
          preds.fire
        ) {
          deptSet.add("community_safety");
        }

        // Infrastructure
        if (
          preds.infrastructure_related ||
          preds.buildings ||
          preds.electricity ||
          preds.transport ||
          preds.tools
        ) {
          deptSet.add("infrastructure");
        }

        primaryDepartments = Array.from(deptSet);
        console.log(
          "✅ Determined departments from predictions:",
          primaryDepartments
        );
      }

      // Calculate urgency level from predictions
      let urgencyLevel = severity || "medium";
      if (mlResponse.predictions) {
        const preds = mlResponse.predictions;
        if (preds.death || preds.missing_people) {
          urgencyLevel = "critical";
        } else if (preds.medical_help || preds.search_and_rescue) {
          urgencyLevel = "critical";
        } else if (
          preds.floods ||
          preds.fire ||
          preds.earthquake ||
          preds.storm
        ) {
          urgencyLevel = "high";
        } else if (preds.shelter || preds.aid_related) {
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
      console.log("📋 Active categories:", activeCategories.length);

      // Build department details (which categories belong to which department)
      const departmentDetails = {};
      primaryDepartments.forEach((dept) => {
        departmentDetails[dept] = activeCategories
          .filter((cat) => {
            const category = cat.category;
            // Map categories to departments
            if (dept === "emergency_response") {
              return [
                "search_and_rescue",
                "security",
                "military",
                "aid_related",
                "request",
              ].includes(category);
            }
            if (dept === "medical_health") {
              return ["medical_help", "medical_products", "hospitals"].includes(
                category
              );
            }
            if (dept === "relief_shelter") {
              return [
                "shelter",
                "food",
                "water",
                "clothing",
                "refugees",
              ].includes(category);
            }
            if (dept === "community_safety") {
              return [
                "weather_related",
                "floods",
                "storm",
                "earthquake",
                "fire",
                "cold",
                "other_weather",
              ].includes(category);
            }
            if (dept === "infrastructure") {
              return [
                "infrastructure_related",
                "buildings",
                "electricity",
                "transport",
                "tools",
                "shops",
                "aid_centers",
              ].includes(category);
            }
            return false;
          })
          .map((cat) => cat.category);
      });

      // Store ML classification results
      sosAlert.mlClassification = {
        predictions: mlResponse.predictions,
        primaryDepartments: primaryDepartments,
        departmentDetails: departmentDetails,
        activeCategories: activeCategories,
        confidenceScore: mlResponse.confidence_score || 0.8,
        urgencyLevel: urgencyLevel,
        processedAt: new Date(),
      };

      console.log("💾 Stored ML classification:", {
        primaryDepartments,
        urgencyLevel,
        activeCategoriesCount: activeCategories.length,
      });

      // Assign to departments based on ML predictions
      if (primaryDepartments && primaryDepartments.length > 0) {
        console.log(
          "✅ Assigning to ML-predicted departments:",
          primaryDepartments
        );
        sosAlert.assignToDepartments(primaryDepartments, urgencyLevel);
      } else {
        console.log(
          "⚠️ No departments determined, using fallback based on emergency type"
        );
        const fallbackDept = getFallbackDepartment(emergencyType);
        sosAlert.assignToDepartments([fallbackDept], severity);
      }

      // If medical emergency and user has medical conditions, add to notes
      if (emergencyType === "medical" && userProfile.medicalConditions) {
        sosAlert.description = `${description || ""}\nMedical History: ${
          userProfile.medicalConditions
        }\nBlood Group: ${userProfile.bloodGroup || "Unknown"}`;
      }
    } catch (mlError) {
      console.error("ML prediction error:", mlError);
      console.error("ML error stack:", mlError.stack);
      // Fallback: assign to emergency response based on emergency type
      const fallbackDept = getFallbackDepartment(emergencyType);
      sosAlert.assignToDepartments([fallbackDept], severity);
    }

    // Save the alert
    console.log("Saving SOS alert to database...");
    await sosAlert.save();
    console.log("SOS alert saved successfully");

    // Notify emergency contacts if critical
    if (
      sosAlert.mlClassification.urgencyLevel === "critical" &&
      userProfile.emergencyContacts.length > 0
    ) {
      console.log(
        "Notifying emergency contacts:",
        userProfile.emergencyContacts
      );
    }

    res.status(201).json({
      success: true,
      message: "SOS Alert created successfully",
      alertId: sosAlert._id,
      assignedDepartments: sosAlert.assignedDepartments.map((d) => ({
        department: d.department,
        priority: d.priority,
      })),
      urgencyLevel: sosAlert.mlClassification.urgencyLevel,
    });
  } catch (error) {
    console.error("SOS creation error:", error);
    console.error("Error stack:", error.stack);
    res
      .status(500)
      .json({ error: "Failed to create SOS alert", details: error.message });
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
    res
      .status(500)
      .json({ error: "Failed to fetch alerts", details: error.message });
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
    res
      .status(500)
      .json({ error: "Failed to fetch statistics", details: error.message });
  }
};

// Update alert status
exports.updateAlertStatus = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { status, notes, department, adminId } = req.body;

    const alert = await SOSAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    // Verify admin is from the department (if adminId provided)
    const adminInfo = adminId
      ? { id: adminId, name: req.body.adminName }
      : null;

    // Update department-specific status
    alert.updateDepartmentStatus(department, status, adminInfo);

    // Add note if provided
    if (notes) {
      alert.addNote(department, notes, adminInfo?.name || "System");
    }

    // Update user trust score based on alert resolution
    if (status === "resolved") {
      await Profile.findOneAndUpdate(
        { userId: alert.userId },
        {
          $inc: { trustScore: 2 }, // Increase trust score
          $min: { trustScore: 100 }, // Cap at 100
        }
      );
    }

    await alert.save();

    res.json({
      success: true,
      message: "Alert status updated",
      alert: {
        _id: alert._id,
        status: alert.status,
        departmentStatus: alert.assignedDepartments.find(
          (d) => d.department === department
        ),
      },
    });
  } catch (error) {
    console.error("Error updating alert:", error);
    res
      .status(500)
      .json({ error: "Failed to update alert", details: error.message });
  }
};

// Get user's alerts
exports.getUserAlerts = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const userProfile = await Profile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found" });
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
    res.status(500).json({ error: "Failed to fetch user alerts" });
  }
};

// Get alert details
exports.getAlertDetails = async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = await SOSAlert.findById(alertId);

    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
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
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch alert details" });
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
    res
      .status(500)
      .json({ error: "Failed to fetch active alerts", details: error.message });
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
    res
      .status(500)
      .json({ error: "Failed to fetch urgent alerts", details: error.message });
  }
};

// Add other controller methods as needed...
