// Simple authentication middleware without JWT
// In production, integrate with Firebase Auth or similar

// Authenticate user based on session or Firebase
// TEMPORARY - FOR TESTING ONLY
exports.authenticate = async (req, res, next) => {
    try {
        // For testing: accept userId from header or body
        const userId = req.headers['x-user-id'] || req.body.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const Profile = require('../models/Profile');
        const userProfile = await Profile.findOne({ userId });
        
        if (!userProfile) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        req.user = {
            id: userId,
            uid: userId,
            role: userProfile.role || 'user',
            department: userProfile.department || 'emergency_response', // Default for testing
            name: userProfile.name,
            profile: userProfile
        };
        
        console.log('✅ Authenticated:', req.user.name, req.user.role, req.user.department);
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
// Check department access
exports.checkDepartmentAccess = (req, res, next) => {
    const { department } = req.params;
    const userDepartment = req.user.department;
    
    // Super admin can access all departments
    if (req.user.role === 'super_admin') {
        return next();
    }
    
    // Department admin can only access their own department
    if (req.user.role === 'department_admin' && userDepartment !== department) {
        return res.status(403).json({ error: 'Access denied to this department' });
    }
    
    next();
};