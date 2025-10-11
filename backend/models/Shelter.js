// models/Shelter.js
const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shelter name is required'],
    trim: true,
    maxlength: [100, 'Shelter name cannot exceed 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  occupied: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function(value) {
        return value <= this.capacity;
      },
      message: 'Occupied count cannot exceed capacity'
    }
  },
  createdBy: {
    type: String,
    required: true
  },
  facilities: [{
    type: String,
    trim: true
  }],
  contact: {
    type: String,
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  coordinates: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required']
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Track who last updated the shelter
  lastUpdatedBy: {
    userId: String,
    name: String,
    role: String
  }
}, {
  timestamps: true
});

// Index for search functionality
shelterSchema.index({ 
  name: 'text', 
  location: 'text' 
});

module.exports = mongoose.model('Shelter', shelterSchema);