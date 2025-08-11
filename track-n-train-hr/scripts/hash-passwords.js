const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/track-n-train-hr';
const DB_NAME = 'track-n-train-hr';

async function hashPasswords() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📄 Found ${users.length} users to update`);
    
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (user.password && !user.password.startsWith('$2')) {
        console.log(`🔐 Hashing password for: ${user.fullName} (${user.email})`);
        
        // Hash the plain text password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Update the user in MongoDB
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
        
        console.log(`✅ Updated password for: ${user.fullName}`);
      } else {
        console.log(`⏭️  Password already hashed for: ${user.fullName}`);
      }
    }
    
    console.log('🎉 All passwords have been hashed successfully!');
    
    // Display login credentials for reference
    console.log('\n📋 Login Credentials:');
    console.log('==========================================');
    
    // Read from JSON file to show original passwords
    const usersJsonPath = path.join(__dirname, '../data/users.json');
    const usersJson = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
    
    usersJson.forEach(user => {
      console.log(`👤 ${user.fullName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error hashing passwords:', error);
  } finally {
    await client.close();
  }
}

// Run the script
hashPasswords().catch(console.error);
