require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const Profile = require("./models/Profile");

// Connect to MongoDB
connectDB();

const app = express();
const disasterRoutes = require("./routes/disasterRoutes");
const sosRoutes = require('./routes/sosRoutes'); 
const RoadReport = require('./routes/RoadReport');
const chatbotRoutes = require('./routes/chatbot');
const newsRoutes = require('./routes/newsRoutes');
const taskRoutes = require('./routes/tasks');
const volunteerRoutes = require('./routes/volunteers');

const partnerRoutes = require('./routes/Partner'); 
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Import sendWhatsAppMessage from your notifications module
const { sendWhatsAppMessage } = require('./notifications');

// Routes
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/tasks', taskRoutes);
app.use("/api/profile", require("./routes/profile"));
app.use('/api/shelters', require('./routes/shelters'));
app.use("/api/disaster", disasterRoutes);
app.use('/api/sos', sosRoutes); 
app.use('/api/road-reports', RoadReport);
app.use('/api/chat', chatbotRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/partners', partnerRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Profile service is running",
    timestamp: new Date().toISOString(),
  });
});

// Your existing admin credentials
const SUPER_ADMIN_CREDENTIALS = {
  'superadmin@emergency.gov': {
    password: 'SuperAdmin123!',
    role: 'super_admin',
    department: 'all',
    name: 'Super Administrator'
  },
  'demo@superadmin.com': {
    password: 'Demo123!',
    role: 'super_admin', 
    department: 'all',
    name: 'Demo Super Admin'
  }
};

const ADMIN_CREDENTIALS = {
  'emergency@response.gov': {
    password: 'Emergency123!',
    role: 'department_admin',
    department: 'emergency_response',
    name: 'Emergency Response Admin'
  },
  'medical@health.gov': {
    password: 'Medical123!',
    role: 'department_admin',
    department: 'medical_health',
    name: 'Medical Health Admin'
  },
  'infrastructure@utilities.gov': {
    password: 'Infrastructure123!',
    role: 'department_admin',
    department: 'infrastructure_utilities',
    name: 'Infrastructure Admin'
  },
  'relief@shelter.gov': {
    password: 'Relief123!',
    role: 'department_admin',
    department: 'relief_shelter',
    name: 'Relief Shelter Admin'
  },
  'environment@hazards.gov': {
    password: 'Environment123!',
    role: 'department_admin',
    department: 'environment_hazards',
    name: 'Environment Hazards Admin'
  },
  'community@safety.gov': {
    password: 'Community123!',
    role: 'department_admin',
    department: 'community_support',
    name: 'Community Support Admin'
  }
};

// Sync admin users with Profile database
const syncAdminUsers = async () => {
  try {
    console.log('🔄 Syncing admin users with Profile database...');
    
    let createdCount = 0;
    let updatedCount = 0;

    // Sync super admins
    for (const [email, adminData] of Object.entries(SUPER_ADMIN_CREDENTIALS)) {
      const userId = `admin_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      const existingProfile = await Profile.findOne({ userId });
      
      if (existingProfile) {
        // Update existing profile
        if (existingProfile.role !== adminData.role || 
            existingProfile.name !== adminData.name ||
            existingProfile.email !== email) {
          
          existingProfile.role = adminData.role;
          existingProfile.name = adminData.name;
          existingProfile.email = email;
          existingProfile.department = adminData.department;
          await existingProfile.save();
          updatedCount++;
          console.log(`✅ Updated super admin: ${adminData.name}`);
        }
      } else {
        // Create new profile
        const newProfile = new Profile({
          userId: userId,
          name: adminData.name,
          email: email,
          phone: '+10000000000',
          address: 'Administrative Office',
          role: adminData.role,
          department: adminData.department,
          trustScore: 100
        });
        
        await newProfile.save();
        createdCount++;
        console.log(`✅ Created super admin: ${adminData.name} (${email})`);
      }
    }

    // Sync department admins
    for (const [email, adminData] of Object.entries(ADMIN_CREDENTIALS)) {
      const userId = `admin_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      const existingProfile = await Profile.findOne({ userId });
      
      if (existingProfile) {
        // Update existing profile
        if (existingProfile.role !== adminData.role || 
            existingProfile.name !== adminData.name ||
            existingProfile.email !== email ||
            existingProfile.department !== adminData.department) {
          
          existingProfile.role = adminData.role;
          existingProfile.name = adminData.name;
          existingProfile.email = email;
          existingProfile.department = adminData.department;
          await existingProfile.save();
          updatedCount++;
          console.log(`✅ Updated department admin: ${adminData.name}`);
        }
      } else {
        // Create new profile
        const newProfile = new Profile({
          userId: userId,
          name: adminData.name,
          email: email,
          phone: '+10000000000',
          address: 'Department Office',
          role: adminData.role,
          department: adminData.department,
          trustScore: 100
        });
        
        await newProfile.save();
        createdCount++;
        console.log(`✅ Created department admin: ${adminData.name} (${email}) - ${adminData.department}`);
      }
    }

    console.log(`\n📊 Admin Sync Summary:`);
    console.log(`   ✅ Created: ${createdCount} new admin profiles`);
    console.log(`   🔄 Updated: ${updatedCount} existing admin profiles`);

  } catch (error) {
    console.error('❌ Error syncing admin users:', error);
    // If it's a validation error, show which field failed
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(field => {
        console.error(`   - ${field}: ${error.errors[field].message}`);
      });
    }
  }
};

// Role update function for regular users
const updateProfilesWithRoles = async () => {
  try {
    console.log('🔄 Checking and updating user roles...');
    
    // Update all existing profiles to have a default role
    const result = await Profile.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Updated ${result.modifiedCount} regular users with default 'user' role`);
    }

    // Sync admin users
    await syncAdminUsers();

    // List all admin users for verification
    const superAdmins = await Profile.find({ role: 'super_admin' });
    const departmentAdmins = await Profile.find({ role: 'department_admin' });
    
    console.log(`\n👑 Super Admins (${superAdmins.length}):`);
    superAdmins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email}) - ID: ${admin.userId}`);
    });

    console.log(`\n🏢 Department Admins (${departmentAdmins.length}):`);
    departmentAdmins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email}) - ${admin.department} - ID: ${admin.userId}`);
    });

    console.log('\n🔑 Admin Login Credentials:');
    console.log('   Super Admins can access all departments');
    console.log('   Department Admins can only access their assigned department');

  } catch (error) {
    console.error('❌ Error updating profiles with roles:', error);
  }
};

// Add a department field to Profile model if not exists
const ensureDepartmentField = async () => {
  try {
    // This will ensure the department field exists in all profiles
    await Profile.updateMany(
      { department: { $exists: false } },
      { $set: { department: 'general' } }
    );
    console.log('✅ Ensured department field exists in all profiles');
  } catch (error) {
    console.error('Error ensuring department field:', error);
  }
};

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

const PORT = process.env.PORT || 5002;

// Start server after ensuring roles are updated
const startServer = async () => {
  try {
    // Wait a moment for database connection to be fully established
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ensure department field exists
    await ensureDepartmentField();
    
    // Update profiles with roles and sync admins
    await updateProfilesWithRoles();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`\nProfile service running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API Health: http://localhost:${PORT}/api/health`);
      console.log(`\nReady for admin authentication!`);
      console.log(`   Use the email/password combinations from your credentials`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();