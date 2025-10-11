const mongoose = require('mongoose');

    const roadReportSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['blocked', 'clear'],
        required: [true, 'Report type is required']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
        maxlength: [200, 'Location cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    critical: {
        type: Boolean,
        default: false
    },
    // Reporter Information - store Firebase UID string
    reportedBy: {
        type: String,
        required: true
    },
    reporterName: {
        type: String,
        required: true
    },
    // Verification System
    verified: {
        type: Boolean,
        default: false
    },
    verifications: {
        type: Number,
        default: 0,
        min: 0
    },
    verifiedBy: [{
        user: {
        type: String  // Firebase UID as string
        },
        verifiedAt: {
        type: Date,
        default: Date.now
        }
    }],
    // Auto-verify threshold
    autoVerifyThreshold: {
        type: Number,
        default: 3
    },
    // Location Coordinates (optional but recommended)
    coordinates: {
        lat: {
        type: Number,
        min: [-90, 'Invalid latitude'],
        max: [90, 'Invalid latitude']
        },
        lng: {
        type: Number,
        min: [-180, 'Invalid longitude'],
        max: [180, 'Invalid longitude']
        }
    },
    // Images (optional)
    images: [{
        url: String,
        uploadedAt: {
        type: Date,
        default: Date.now
        }
    }],
    // Status tracking
    status: {
        type: String,
        enum: ['active', 'resolved', 'archived'],
        default: 'active'
    },
    // Resolution details
    resolvedAt: Date,
    resolvedBy: {
        type: String // Firebase UID string
    },
    resolutionNotes: String,
    // Admin actions
    markedCriticalBy: {
        type: String // Firebase UID string
    },
    criticalMarkedAt: Date,
    // Engagement metrics
    views: {
        type: Number,
        default: 0
    },
    // Soft delete
    isActive: {
        type: Boolean,
        default: true
    }
    }, {
    timestamps: true
    });

    module.exports = mongoose.model('RoadReport', roadReportSchema);