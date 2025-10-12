// models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Task category is required'],
    enum: {
      values: [
        'Emergency Department',
        'Medical & Health',
        'Infrastructure',
        'Relief & Shelter',
        'Environment',
        'Community Support'
      ],
      message: '{VALUE} is not a valid category'
    }
  },
  priority: {
    type: String,
    required: [true, 'Task priority is required'],
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: '{VALUE} is not a valid priority'
    },
    default: 'medium'
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending',
    index: true
  },
  location: {
    type: String,
    required: [true, 'Task location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  // Optional coordinates field - properly structured for GeoJSON
  coordinates: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      validate: {
        validator: function(coords) {
          if (!coords || coords.length === 0) return true;
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && 
                 coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Invalid coordinates format. Expected [longitude, latitude]'
      }
    }
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  estimatedHours: {
    type: Number,
    required: [true, 'Estimated hours is required'],
    min: [1, 'Estimated hours must be at least 1'],
    max: [24, 'Estimated hours cannot exceed 24'],
    default: 4
  },
  deadline: {
    type: Date,
    required: [true, 'Task deadline is required']
  },
  resources: {
    type: String,
    trim: true,
    maxlength: [500, 'Resources description cannot exceed 500 characters'],
    default: ''
  },
  assignedTo: {
    type: String, // User ID of volunteer
    ref: 'Profile',
    default: null
  },
  assignedBy: {
    type: String, // User ID of admin who assigned
    ref: 'Profile',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String, // User ID of creator
    required: [true, 'Creator ID is required'],
    ref: 'Profile'
  },
  completedAt: {
    type: Date,
    default: null
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Feedback comment cannot exceed 500 characters']
    },
    submittedAt: {
      type: Date
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for better query performance
taskSchema.index({ category: 1, status: 1 });
taskSchema.index({ priority: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ coordinates: '2dsphere' });
taskSchema.index({ status: 1, priority: -1 });

// Virtual for overdue tasks
taskSchema.virtual('isOverdue').get(function() {
  return this.status !== 'completed' && this.deadline < new Date();
});

// Pre-save hook to clean up coordinates if not provided
taskSchema.pre('save', function(next) {
  // If coordinates is null or has no valid data, remove it entirely
  if (this.coordinates && (!this.coordinates.coordinates || this.coordinates.coordinates.length === 0)) {
    this.coordinates = undefined;
  }
  next();
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);