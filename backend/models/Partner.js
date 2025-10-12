// models/Partner.js
const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  // Basic Information
  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  organizationType: {
    type: String,
    required: [true, 'Organization type is required'],
    enum: ['NGO', 'Trust','Government Body', 'Society', 'Private Company', 'Foundation', 'Cooperative Society', 'Educational Institution', 'Healthcare Organization', 'Other']
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  
  // Contact Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  website: {
    type: String,
    trim: true
  },
  
  // Address Information
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    default: 'India'
  },
  
  // Support Details
  supportType: [{
    type: String,
    enum: ['money', 'food', 'medical', 'shelter', 'clothing', 'volunteers', 'transport', 'equipment', 'counseling', 'other']
  }],
  description: {
    type: String,
    trim: true
  },
  servicesOffered: [{
    type: String,
    trim: true
  }],
  operationalHours: {
    type: String,
    trim: true
  },
  
  // Capacity & Resources
  capacity: {
    type: Number,
    min: 0
  },
  availableResources: {
    type: String,
    trim: true
  },
  
  // Contact Person Details
  contactPerson: {
    type: String,
    trim: true
  },
  contactPersonName: {
    type: String,
    trim: true
  },
  contactPersonRole: {
    type: String,
    trim: true
  },
  contactPersonPhone: {
    type: String,
    trim: true
  },
  contactPersonEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  
  // Monetary Pledge
  monetaryPledge: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status and Approval Tracking - FIXED: Changed to String
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Approval fields - FIXED: String instead of ObjectId
  approvedBy: {
    type: String,
    default: null
  },
  approverName: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  
  // Rejection fields - FIXED: String instead of ObjectId
  rejectedBy: {
    type: String,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  
  // Active Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Additional Information
  verificationDocuments: [{
    type: String
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalContacts: {
    type: Number,
    default: 0,
    min: 0
  },
  lastContactedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
partnerSchema.index({ status: 1, isActive: 1 });
partnerSchema.index({ city: 1, state: 1 });
partnerSchema.index({ organizationType: 1 });
partnerSchema.index({ supportType: 1 });
partnerSchema.index({ email: 1 });

module.exports = mongoose.model('Partner', partnerSchema);