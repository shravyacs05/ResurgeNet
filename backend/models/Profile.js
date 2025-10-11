const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  relationship: {
    type: String,
    required: true,
    enum: ['Parent', 'Sibling', 'Spouse', 'Child', 'Friend', 'Relative', 'Colleague', 'Other']
  },
  phone: {
    type: String,
    required: true
  }
});

const profileSchema = new mongoose.Schema({
  // Link to Firebase UID
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  
  // Medical Information
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
  },
  medicalConditions: {
    type: String,
    trim: true
  },
  
  // Emergency Contacts
  emergencyContacts: [emergencyContactSchema],
  
  // Account Information
  trustScore: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated timestamp before saving
profileSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Index for better query performance
profileSchema.index({ userId: 1 });
profileSchema.index({ email: 1 });

module.exports = mongoose.model('Profile', profileSchema);