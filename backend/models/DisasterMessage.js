const mongoose = require('mongoose');

const disasterMessageSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    predictions: {
        type: Map,
        of: Number,
        required: true
    },
    activeCategories: [{
        type: String
    }],
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true // This adds createdAt and updatedAt automatically
});

// Indexes for better query performance
disasterMessageSchema.index({ activeCategories: 1 });
disasterMessageSchema.index({ timestamp: -1 });

// Pre-save hook to extract active categories
disasterMessageSchema.pre('save', function(next) {
    this.activeCategories = [];
    if (this.predictions) {
        for (let [category, value] of this.predictions) {
            if (value === 1) {
                this.activeCategories.push(category);
            }
        }
    }
    next();
});

// Virtual for getting the count of active categories
disasterMessageSchema.virtual('activeCategoryCount').get(function() {
    return this.activeCategories.length;
});

// Method to check if a specific category is active
disasterMessageSchema.methods.hasCategory = function(category) {
    return this.predictions.get(category) === 1;
};

// Static method to find messages by category
disasterMessageSchema.statics.findByCategory = function(category, limit = 10) {
    return this.find({ activeCategories: category })
        .sort({ timestamp: -1 })
        .limit(limit);
};

// Static method to get category statistics
disasterMessageSchema.statics.getCategoryStats = async function() {
    const stats = await this.aggregate([
        { $unwind: '$activeCategories' },
        { 
            $group: {
                _id: '$activeCategories',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);
    
    return stats.map(stat => ({
        category: stat._id,
        count: stat.count
    }));
};

// Ensure virtuals are included in JSON responses
disasterMessageSchema.set('toJSON', {
    virtuals: true
});

const DisasterMessage = mongoose.model('DisasterMessage', disasterMessageSchema);

module.exports = DisasterMessage;