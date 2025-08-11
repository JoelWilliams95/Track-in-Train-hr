const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/track-n-train-hr';
const DB_NAME = 'track-n-train-hr';

async function migrateData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Read existing JSON files
    const dataDir = path.join(__dirname, '../data');
    
    // Migrate Personnel Records
    console.log('📄 Migrating Personnel Records...');
    const personnelData = JSON.parse(fs.readFileSync(path.join(dataDir, 'personnelRecords.json'), 'utf8'));
    if (personnelData.length > 0) {
      await db.collection('personnelRecords').deleteMany({}); // Clear existing
      await db.collection('personnelRecords').insertMany(personnelData);
      console.log(`✅ Migrated ${personnelData.length} personnel records`);
    }
    
    // Migrate Users
    console.log('👥 Migrating Users...');
    const usersData = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
    if (usersData.length > 0) {
      await db.collection('users').deleteMany({}); // Clear existing
      await db.collection('users').insertMany(usersData);
      console.log(`✅ Migrated ${usersData.length} users`);
    }
    
    // Migrate Notifications
    console.log('🔔 Migrating Notifications...');
    const notificationsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'notifications.json'), 'utf8'));
    if (notificationsData.length > 0) {
      await db.collection('notifications').deleteMany({}); // Clear existing
      await db.collection('notifications').insertMany(notificationsData);
      console.log(`✅ Migrated ${notificationsData.length} notifications`);
    }
    
    // Migrate Logs
    console.log('📋 Migrating Logs...');
    const logsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'logs.json'), 'utf8'));
    if (logsData.length > 0) {
      await db.collection('logs').deleteMany({}); // Clear existing
      await db.collection('logs').insertMany(logsData);
      console.log(`✅ Migrated ${logsData.length} logs`);
    }
    
    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    
    // Personnel Records indexes
    await db.collection('personnelRecords').createIndex({ fullName: 1 }, { unique: true });
    await db.collection('personnelRecords').createIndex({ cin: 1 });
    await db.collection('personnelRecords').createIndex({ status: 1 });
    await db.collection('personnelRecords').createIndex({ zone: 1 });
    
    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ fullName: 1 });
    await db.collection('users').createIndex({ role: 1 });
    
    // Notifications indexes
    await db.collection('notifications').createIndex({ targetUser: 1 });
    await db.collection('notifications').createIndex({ read: 1 });
    await db.collection('notifications').createIndex({ createdAt: -1 });
    
    // Logs indexes
    await db.collection('logs').createIndex({ user: 1 });
    await db.collection('logs').createIndex({ category: 1 });
    await db.collection('logs').createIndex({ createdAt: -1 });
    
    console.log('✅ Indexes created successfully');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run migration
migrateData().catch(console.error);
