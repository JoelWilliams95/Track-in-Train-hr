# MongoDB Setup Guide for Track-n-Train HR

## 🎯 Overview
This guide will help you set up MongoDB for your HR tracking application. You have two options: local MongoDB installation or MongoDB Atlas (cloud).

## 📋 Prerequisites
- Node.js installed
- MongoDB packages already installed (`mongodb`, `mongoose`)

## 🔧 Option 1: Local MongoDB Installation

### Step 1: Install MongoDB Community Server
1. **Download MongoDB**: Go to https://www.mongodb.com/try/download/community
2. **Select your OS**: Windows 64-bit
3. **Install**: Run the installer with default settings
4. **Start MongoDB**: MongoDB should start automatically as a Windows service

### Step 2: Verify Installation
Open Command Prompt and run:
```bash
mongosh
```
If successful, you'll see the MongoDB shell.

### Step 3: Create Database
In the MongoDB shell:
```javascript
use track-n-train-hr
db.test.insertOne({test: "Hello MongoDB"})
db.test.find()
```

## ☁️ Option 2: MongoDB Atlas (Cloud) - Recommended

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Sign up for a free account
3. Create a new cluster (free tier available)

### Step 2: Configure Network Access
1. In Atlas dashboard, go to "Network Access"
2. Add IP Address: `0.0.0.0/0` (for development) or your specific IP
3. Save changes

### Step 3: Create Database User
1. Go to "Database Access"
2. Add new database user
3. Choose "Password" authentication
4. Set username and password
5. Grant "Read and write to any database" permissions

### Step 4: Get Connection String
1. Go to "Clusters"
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password

## 🔧 Configuration

### Update .env.local
Replace the MongoDB URI in your `.env.local` file:

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/track-n-train-hr
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/track-n-train-hr?retryWrites=true&w=majority
```

## 📊 Data Migration

### Step 1: Run Migration Script
```bash
npm run migrate
```

This will:
- Connect to your MongoDB database
- Migrate all existing JSON data to MongoDB collections
- Create necessary indexes for performance
- Set up the database structure

### Step 2: Verify Migration
Check that your data was migrated successfully:
```bash
mongosh "your-connection-string"
use track-n-train-hr
db.personnelRecords.countDocuments()
db.users.countDocuments()
db.notifications.countDocuments()
db.logs.countDocuments()
```

## 🗄️ Database Structure

Your MongoDB database will have these collections:

### personnelRecords
- Stores all employee/recruit information
- Includes embedded comments array
- Indexed on: fullName, cin, status, zone

### users
- Stores system users (admins, managers, etc.)
- Indexed on: email, fullName, role

### notifications
- Stores all user notifications
- Indexed on: targetUser, read, createdAt

### logs
- Stores system activity logs
- Indexed on: user, category, createdAt

## 🚀 Next Steps

### 1. Update API Routes
The existing API routes need to be updated to use MongoDB instead of JSON files. The service layer is already created in `src/services/database.ts`.

### 2. Test the Application
```bash
npm run dev
```

### 3. Monitor Performance
- Use MongoDB Compass (GUI tool) to monitor your database
- Check query performance and optimize as needed

## 🔍 Troubleshooting

### Connection Issues
- Verify MongoDB is running (local) or network access is configured (Atlas)
- Check connection string format
- Ensure credentials are correct

### Migration Issues
- Check that JSON files exist in the `data` directory
- Verify MongoDB connection before running migration
- Check console output for specific error messages

### Performance Issues
- Ensure indexes are created (migration script does this automatically)
- Monitor query patterns and add additional indexes if needed

## 📚 Useful Commands

### MongoDB Shell Commands
```javascript
// Show databases
show dbs

// Use database
use track-n-train-hr

// Show collections
show collections

// Count documents
db.personnelRecords.countDocuments()

// Find documents
db.personnelRecords.find().limit(5)

// Create index
db.personnelRecords.createIndex({fullName: 1})
```

### Application Commands
```bash
# Run migration
npm run migrate

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎉 You're Ready!

Once you've completed these steps, your HR application will be running on MongoDB with all the benefits of a proper database system:

- ✅ Better performance and scalability
- ✅ ACID transactions
- ✅ Advanced querying capabilities
- ✅ Automatic backups (Atlas)
- ✅ Real-time change streams
- ✅ Professional database management
