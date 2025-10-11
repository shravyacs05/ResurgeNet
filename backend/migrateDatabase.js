// scripts/migrateDatabase.js
// Run this script once to update existing data structures

const mongoose = require('mongoose');
require('dotenv').config();

const Profile = require('./models/Profile');
const SOSAlert = require('./models/SOSAlert');

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sos-system');
    console.log('✅ Connected to MongoDB');

    // 1. Add location field to existing profiles
    console.log('\n📍 Migrating Profile locations...');
    const profilesWithoutLocation = await Profile.countDocuments({
      location: { $exists: false }
    });
    
    if (profilesWithoutLocation > 0) {
      await Profile.updateMany(
        { location: { $exists: false } },
        {
          $set: {
            location: {
              type: 'Point',
              coordinates: [0, 0] // Default to [0, 0] - users will update later
            }
          }
        }
      );
      console.log(`✅ Updated ${profilesWithoutLocation} profiles with location field`);
    } else {
      console.log('✅ All profiles already have location field');
    }

    // 2. Create geospatial index on Profile.location
    console.log('\n📊 Creating geospatial index...');
    try {
      await Profile.collection.createIndex({ location: '2dsphere' });
      console.log('✅ Geospatial index created on Profile.location');
    } catch (error) {
      if (error.code === 85) {
        console.log('✅ Geospatial index already exists');
      } else {
        throw error;
      }
    }

    // 3. Initialize responseMetrics for existing SOS alerts
    console.log('\n📋 Migrating SOS Alert responseMetrics...');
    const alertsWithoutMetrics = await SOSAlert.countDocuments({
      responseMetrics: { $exists: false }
    });
    
    if (alertsWithoutMetrics > 0) {
      await SOSAlert.updateMany(
        { responseMetrics: { $exists: false } },
        {
          $set: {
            responseMetrics: {
              departmentResponseTimes: new Map()
            }
          }
        }
      );
      console.log(`✅ Updated ${alertsWithoutMetrics} alerts with responseMetrics`);
    } else {
      console.log('✅ All alerts already have responseMetrics');
    }

    // 4. Verify indexes
    console.log('\n🔍 Verifying indexes...');
    const profileIndexes = await Profile.collection.getIndexes();
    const alertIndexes = await SOSAlert.collection.getIndexes();
    
    console.log('\nProfile Indexes:');
    Object.keys(profileIndexes).forEach(key => {
      console.log(`  - ${key}`);
    });
    
    console.log('\nSOS Alert Indexes:');
    Object.keys(alertIndexes).forEach(key => {
      console.log(`  - ${key}`);
    });

    // 5. Database statistics
    console.log('\n📊 Database Statistics:');
    const profileCount = await Profile.countDocuments();
    const alertCount = await SOSAlert.countDocuments();
    const activeAlerts = await SOSAlert.countDocuments({
      status: { $in: ['pending', 'verified', 'assigned', 'in_progress'] }
    });
    
    console.log(`  Profiles: ${profileCount}`);
    console.log(`  Total Alerts: ${alertCount}`);
    console.log(`  Active Alerts: ${activeAlerts}`);

    // 6. Test geospatial query
    console.log('\n🧪 Testing geospatial query...');
    const testLocation = [73.8567, 18.5204]; // Pune coordinates [lng, lat]
    const nearbyUsers = await Profile.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: testLocation
          },
          $maxDistance: 5000 // 5km
        }
      }
    }).limit(5);
    
    console.log(`✅ Found ${nearbyUsers.length} users near test location (Pune)`);

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateDatabase();