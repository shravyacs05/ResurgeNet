const mongoose = require('mongoose');

// Department enum
const DEPARTMENTS = ['emergency_response', 'medical_health', 'infrastructure', 'relief_shelter', 'community_safety'];

const sosAlertSchema = new mongoose.Schema({
    // User Information - Reference to Profile
    userId: {
        type: String,
        required: true,
        index: true,
        ref: 'Profile'
    },
    userName: {
        type: String,
        required: true
    },
    userPhone: {
        type: String,
        required: true
    },
    
    // Emergency Information
    emergencyType: {
        type: String,
        required: true,
        enum: ['medical', 'fire', 'flood', 'earthquake', 'trapped', 'structural collapse', 'stranded', 'other']
    },
    message: {
        type: String,
        required: true,
        maxlength: 5000
    },
    peopleAffected: {
        type: Number,
        default: 1,
        min: 1
    },
    description: {
        type: String,
        maxlength: 5000
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'high'
    },
    
    // Location Information
    location: {
        lat: {
            type: Number,
            required: false
        },
        lng: {
            type: Number,
            required: false
        },
        address: {
            type: String,
            required: true
        },
        landmark: String,
        area: String,
        city: String,
        state: String
    },
    
    // Alert Status
    status: {
        type: String,
        enum: ['pending', 'verified', 'assigned', 'in_progress', 'resolved', 'cancelled'],
        default: 'pending',
        index: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    
    // ML Classification Results
    mlClassification: {
        predictions: {
            type: Map,
            of: Number
        },
        primaryDepartments: [{
            type: String,
            enum: DEPARTMENTS
        }],
        departmentDetails: {
            type: Map,
            of: [String] // Map of department to array of categories
        },
        activeCategories: [{
            category: String,
            categoryDisplay: String,
            department: String,
            departmentName: String
        }],
        confidenceScore: {
            type: Number,
            min: 0,
            max: 1
        },
        urgencyLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'high'
        },
        processedAt: {
            type: Date,
            default: Date.now
        }
    },
    
    // Department Assignment and Tracking
    assignedDepartments: [{
        department: {
            type: String,
            enum: DEPARTMENTS,
            required: true
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        priority: {
            type: Number,
            default: 1
        },
        status: {
            type: String,
            enum: ['pending', 'acknowledged', 'responding', 'completed', 'transferred'],
            default: 'pending'
        },
        acknowledgedBy: {
            adminId: String,
            adminName: String,
            acknowledgedAt: Date
        },
        responseTeam: {
            teamId: String,
            teamName: String,
            dispatchedAt: Date,
            estimatedArrival: Date
        },
        notes: [{
            text: String,
            addedBy: String,
            addedAt: {
                type: Date,
                default: Date.now
            }
        }],
        completedBy: {
            adminId: String,
            adminName: String,
            completedAt: Date
        }
    }],
    
    // Response Tracking
    responseMetrics: {
        firstViewedAt: Date,
        firstViewedBy: String,
        acknowledgedAt: Date,
        acknowledgedBy: String,
        firstResponseAt: Date,
        resolvedAt: Date,
        resolvedBy: String,
        totalResponseTime: Number, // in minutes
        departmentResponseTimes: {
            type: Map,
            of: Number // department -> response time in minutes
        }
    },
    
    // Verification and Voting
    verifications: [{
        userId: String,
        userName: String,
        verified: Boolean,
        timestamp: {
            type: Date,
            default: Date.now
        },
        comment: String
    }],
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    voters: [{
        userId: String,
        voteType: {
            type: String,
            enum: ['up', 'down']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Additional Metadata
    tags: [String],
    attachments: [{
        type: String,
        url: String,
        uploadedAt: Date
    }],
    relatedAlerts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SOSAlert'
    }],
    resolutionDetails: {
        summary: String,
        actionsToken: [String],
        resourcesUsed: [String],
        lessonsLearned: String
    }
}, {
    timestamps: true
});

// Indexes for performance
sosAlertSchema.index({ status: 1, createdAt: -1 });
sosAlertSchema.index({ 'assignedDepartments.department': 1, status: 1 });
sosAlertSchema.index({ 'assignedDepartments.department': 1, 'assignedDepartments.status': 1 });
sosAlertSchema.index({ userId: 1, createdAt: -1 });
sosAlertSchema.index({ 'location.lat': 1, 'location.lng': 1 });
sosAlertSchema.index({ 'mlClassification.urgencyLevel': 1, status: 1 });
sosAlertSchema.index({ createdAt: -1 });

// Virtuals
sosAlertSchema.virtual('isUrgent').get(function() {
    return this.mlClassification?.urgencyLevel === 'critical' || 
           this.mlClassification?.urgencyLevel === 'high';
});

sosAlertSchema.virtual('responseTimeMinutes').get(function() {
    if (this.responseMetrics?.acknowledgedAt && this.createdAt) {
        return Math.round((this.responseMetrics.acknowledgedAt - this.createdAt) / 60000);
    }
    return null;
});

sosAlertSchema.virtual('isActive').get(function() {
    return ['pending', 'verified', 'assigned', 'in_progress'].includes(this.status);
});

// Methods
sosAlertSchema.methods.assignToDepartments = function(departments, urgencyLevel) {
    const departmentPriorities = {
        'emergency_response': 1,
        'medical_health': 2,
        'community_safety': 3,
        'infrastructure': 4,
        'relief_shelter': 5
    };
    
    departments.forEach(dept => {
        const existing = this.assignedDepartments.find(d => d.department === dept);
        if (!existing) {
            this.assignedDepartments.push({
                department: dept,
                priority: urgencyLevel === 'critical' ? 0 : departmentPriorities[dept] || 5,
                status: 'pending'
            });
        }
    });
    
    // Sort by priority
    this.assignedDepartments.sort((a, b) => a.priority - b.priority);
};

sosAlertSchema.methods.updateDepartmentStatus = function(department, status, adminInfo) {
    const deptAssignment = this.assignedDepartments.find(d => d.department === department);
    if (deptAssignment) {
        deptAssignment.status = status;
        
        if (status === 'acknowledged' && adminInfo) {
            deptAssignment.acknowledgedBy = {
                adminId: adminInfo.id,
                adminName: adminInfo.name,
                acknowledgedAt: new Date()
            };
            
            if (!this.responseMetrics.acknowledgedAt) {
                this.responseMetrics.acknowledgedAt = new Date();
                this.responseMetrics.acknowledgedBy = adminInfo.name;
            }
        }
        
        if (status === 'completed' && adminInfo) {
            deptAssignment.completedBy = {
                adminId: adminInfo.id,
                adminName: adminInfo.name,
                completedAt: new Date()
            };
        }
    }
};

sosAlertSchema.methods.addNote = function(department, noteText, adminName) {
    const deptAssignment = this.assignedDepartments.find(d => d.department === department);
    if (deptAssignment) {
        deptAssignment.notes.push({
            text: noteText,
            addedBy: adminName,
            addedAt: new Date()
        });
    }
};

sosAlertSchema.methods.calculateResponseMetrics = function() {
    if (this.responseMetrics.acknowledgedAt && this.createdAt) {
        this.responseMetrics.totalResponseTime = 
            Math.round((this.responseMetrics.acknowledgedAt - this.createdAt) / 60000);
    }
    
    // Calculate per-department response times
    this.assignedDepartments.forEach(dept => {
        if (dept.acknowledgedBy?.acknowledgedAt) {
            const responseTime = Math.round(
                (dept.acknowledgedBy.acknowledgedAt - this.createdAt) / 60000
            );
            this.responseMetrics.departmentResponseTimes.set(dept.department, responseTime);
        }
    });
};

// Static methods
sosAlertSchema.statics.findByDepartment = function(department, filters = {}) {
    const query = {
        'assignedDepartments.department': department,
        ...filters
    };
    
    return this.find(query)
        .sort({ 
            'mlClassification.urgencyLevel': 1,
            createdAt: -1 
        });
};

sosAlertSchema.statics.getDepartmentStats = async function(department, dateRange = {}) {
    const matchQuery = {
        'assignedDepartments.department': department
    };
    
    if (dateRange.start) {
        matchQuery.createdAt = { $gte: dateRange.start };
    }
    if (dateRange.end) {
        matchQuery.createdAt = { ...matchQuery.createdAt, $lte: dateRange.end };
    }
    
    return this.aggregate([
        { $match: matchQuery },
        {
            $facet: {
                byStatus: [
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ],
                byUrgency: [
                    { $group: { _id: '$mlClassification.urgencyLevel', count: { $sum: 1 } } }
                ],
                byEmergencyType: [
                    { $group: { _id: '$emergencyType', count: { $sum: 1 } } }
                ],
                avgResponseTime: [
                    {
                        $match: {
                            'responseMetrics.totalResponseTime': { $exists: true }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            avg: { $avg: '$responseMetrics.totalResponseTime' },
                            min: { $min: '$responseMetrics.totalResponseTime' },
                            max: { $max: '$responseMetrics.totalResponseTime' }
                        }
                    }
                ],
                totalAlerts: [
                    { $count: 'total' }
                ]
            }
        }
    ]);
};

// Middleware
sosAlertSchema.pre('save', function(next) {
    // Update status based on department statuses
    const allDeptStatuses = this.assignedDepartments.map(d => d.status);
    
    if (allDeptStatuses.every(s => s === 'completed')) {
        this.status = 'resolved';
        if (!this.responseMetrics.resolvedAt) {
            this.responseMetrics.resolvedAt = new Date();
        }
    } else if (allDeptStatuses.some(s => s === 'responding')) {
        this.status = 'in_progress';
    } else if (allDeptStatuses.some(s => s === 'acknowledged')) {
        this.status = 'assigned';
    } else if (this.verified && this.status === 'pending') {
        this.status = 'verified';
    }
    
    next();
});

const SOSAlert = mongoose.model('SOSAlert', sosAlertSchema);

module.exports = SOSAlert;