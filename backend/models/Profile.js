// models/Profile.js
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
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
  },
  medicalConditions: {
    type: String,
    trim: true
  },
  emergencyContacts: [emergencyContactSchema],
  // Update role enum to include super_admin
  role: {
    type: String,
    enum: ['user', 'department_admin', 'admin', 'super_admin'], // Added super_admin
    default: 'user'
  },
    // Volunteer-specific fields
  isVolunteer: {
    type: Boolean,
    default: false
  },
  volunteerSkills: {
    type: [String],
    default: []
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'busy', 'unavailable'],
      default: 'unavailable'
    },
    schedule: {
      type: Object,
      default: {}
    }
  },
  certifications: {
    type: [String],
    default: []
  },
  experience: {
    type: String,
    trim: true
  },
  preferredTasks: {
    type: [String],
    default: []
  },

  // Add department field
  department: {
    type: String,
    default: 'general',
    enum: [
      'general',
      'emergency_response', 
      'medical_health',
      'infrastructure_utilities',
      'relief_shelter',
      'environment_hazards',
      'community_support',
      'all'
    ]
  },
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

profileSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

profileSchema.index({ userId: 1 });
profileSchema.index({ email: 1 });
profileSchema.index({ isVolunteer: 1 });
profileSchema.index({ 'availability.status': 1 });


module.exports = mongoose.model('Profile', profileSchema);