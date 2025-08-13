// Database adapter that can switch between JSON files and MongoDB
import fs from 'fs';
import path from 'path';

// JSON file paths
const PERSONNEL_FILE = path.join(process.cwd(), 'data', 'personnelRecords.json');
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const NOTIFICATIONS_FILE = path.join(process.cwd(), 'data', 'notifications.json');
const LOGS_FILE = path.join(process.cwd(), 'data', 'logs.json');

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'json';

// JSON file helpers
function readJsonFile(filePath: string) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

function writeJsonFile(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// Personnel Records Service
export class PersonnelRecordService {
  static async getAll() {
    console.log('🔍 PersonnelRecordService.getAll() - DATABASE_TYPE:', DATABASE_TYPE);
    if (DATABASE_TYPE === 'json') {
      console.log('📄 Using JSON file storage');
      return readJsonFile(PERSONNEL_FILE);
    }
    console.log('🗄️ Using MongoDB storage');

    try {
      const { PersonnelRecordService: MongoService } = await import('./database');
      const records = await MongoService.getAll();

      console.log('🔍 Raw MongoDB records received:', records.length);
      
      // Convert MongoDB documents to plain objects for Next.js client compatibility
      const plainRecords = records.map(record => {
        let plainRecord;
        if (record.toObject) {
          // It's a Mongoose document, convert to plain object
          plainRecord = record.toObject();
          console.log('🔍 Converted Mongoose document to plain object');
        } else {
          // Already a plain object, just copy it
          plainRecord = { ...record };
        }

        // Convert ObjectId to string and ensure proper serialization
        if (plainRecord._id) {
          plainRecord.id = plainRecord._id.toString();
          delete plainRecord._id; // Remove the ObjectId to prevent serialization issues
        }

        // Convert any other ObjectId fields to strings
        Object.keys(plainRecord).forEach(key => {
          try {
            if (plainRecord[key] && 
                typeof plainRecord[key] === 'object' && 
                plainRecord[key].constructor && 
                plainRecord[key].constructor.name === 'ObjectId') {
              plainRecord[key] = plainRecord[key].toString();
            }
          } catch (error) {
            // Skip this field if there's any error checking it
            console.log(`⚠️ Could not process field ${key}:`, error.message);
          }
        });

        return plainRecord;
      });

      console.log('✅ Converted', plainRecords.length, 'MongoDB records to plain objects');
      
      // If no records from Mongoose, try direct MongoDB connection as fallback
      if (plainRecords.length === 0) {
        console.log('⚠️ Mongoose returned 0 records, trying direct MongoDB connection...');
        const { connectToDatabase } = await import('@/lib/mongodb');
        const { db } = await connectToDatabase();
        const directRecords = await db.collection('personnelRecords').find({}).toArray();
        console.log('🔍 Direct MongoDB query found:', directRecords.length, 'records');

        if (directRecords.length > 0) {
          console.log('✅ Using direct MongoDB results as fallback');
          // Serialize the direct MongoDB results
          const serializedRecords = directRecords.map(record => {
            const { _id, ...plainRecord } = record;
            if (_id) {
              (plainRecord as any).id = _id.toString();
            }
            return plainRecord;
          });
          return serializedRecords;
        }
      }

      return plainRecords;
    } catch (error) {
      console.error('❌ Error in MongoDB service, trying direct connection:', error);

      // Fallback to direct MongoDB connection
      const { connectToDatabase } = await import('@/lib/mongodb');
      const { db } = await connectToDatabase();
      const directRecords = await db.collection('personnelRecords').find({}).toArray();
      console.log('🔍 Fallback direct MongoDB query found:', directRecords.length, 'records');

      // Serialize the fallback results
      const serializedRecords = directRecords.map(record => {
        const { _id, ...plainRecord } = record;
        if (_id) {
          (plainRecord as any).id = _id.toString();
        }
        return plainRecord;
      });

      return serializedRecords;
    }
  }

  static async getByFullName(fullName: string) {
    if (DATABASE_TYPE === 'json') {
      const records = readJsonFile(PERSONNEL_FILE);
      return records.find((record: any) => record.fullName === fullName) || null;
    }
    const { PersonnelRecordService: MongoService } = await import('./database');
    return await MongoService.getByFullName(fullName);
  }

  static async create(data: any) {
    console.log('🔍 PersonnelRecordService.create() - DATABASE_TYPE:', DATABASE_TYPE);
    console.log('📝 Creating record for:', data.fullName);
    if (DATABASE_TYPE === 'json') {
      console.log('📄 Using JSON file storage');
      const records = readJsonFile(PERSONNEL_FILE);
      const newRecord = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      records.push(newRecord);
      writeJsonFile(PERSONNEL_FILE, records);
      return newRecord;
    }
    console.log('🗄️ Using MongoDB storage');
    const { PersonnelRecordService: MongoService } = await import('./database');
    return await MongoService.create(data);
  }

  static async update(fullName: string, data: any) {
    if (DATABASE_TYPE === 'json') {
      const records = readJsonFile(PERSONNEL_FILE);
      const index = records.findIndex((record: any) => record.fullName === fullName);
      if (index !== -1) {
        records[index] = { ...records[index], ...data, updatedAt: new Date().toISOString() };
        writeJsonFile(PERSONNEL_FILE, records);
        return records[index];
      }
      return null;
    }
    const { PersonnelRecordService: MongoService } = await import('./database');
    return await MongoService.update(fullName, data);
  }

  static async delete(fullName: string) {
    if (DATABASE_TYPE === 'json') {
      const records = readJsonFile(PERSONNEL_FILE);
      const index = records.findIndex((record: any) => record.fullName === fullName);
      if (index !== -1) {
        records.splice(index, 1);
        writeJsonFile(PERSONNEL_FILE, records);
        return true;
      }
      return false;
    }
    const { PersonnelRecordService: MongoService } = await import('./database');
    return await MongoService.delete(fullName);
  }

  static async addComment(fullName: string, comment: any) {
    console.log('🔍 PersonnelRecordService.addComment() for:', fullName, '- DATABASE_TYPE:', DATABASE_TYPE);
    console.log('📝 Adding comment:', comment.text?.substring(0, 50) + '...');
    if (DATABASE_TYPE === 'json') {
      console.log('📄 Using JSON file storage for adding comment');
      const records = readJsonFile(PERSONNEL_FILE);
      const index = records.findIndex((record: any) => record.fullName === fullName);
      if (index !== -1) {
        if (!records[index].comments) {
          records[index].comments = [];
        }
        records[index].comments.push(comment);
        writeJsonFile(PERSONNEL_FILE, records);
        console.log('✅ Comment added to JSON file');
        return records[index];
      }
      console.log('❌ User not found in JSON file');
      return null;
    }
    console.log('🗄️ Using MongoDB storage for adding comment');
    const { PersonnelRecordService: MongoService } = await import('./database');
    const result = await MongoService.addComment(fullName, comment);
    console.log('✅ Comment added to MongoDB:', !!result);
    return result;
  }

  static async getComments(fullName: string) {
    console.log('🔍 PersonnelRecordService.getComments() for:', fullName, '- DATABASE_TYPE:', DATABASE_TYPE);
    if (DATABASE_TYPE === 'json') {
      console.log('📄 Using JSON file storage for comments');
      const records = readJsonFile(PERSONNEL_FILE);
      const record = records.find((record: any) => record.fullName === fullName);
      const comments = record?.comments || [];
      console.log('✅ Found', comments.length, 'comments in JSON for', fullName);
      return comments;
    }
    console.log('🗄️ Using MongoDB storage for comments');
    const { PersonnelRecordService: MongoService } = await import('./database');
    const comments = await MongoService.getComments(fullName);
    console.log('✅ Found', comments.length, 'comments in MongoDB for', fullName);
    return comments;
  }

  static async searchByZone(zone: string) {
    if (DATABASE_TYPE === 'json') {
      const records = readJsonFile(PERSONNEL_FILE);
      return records.filter((record: any) => record.zone === zone);
    }
    const { PersonnelRecordService: MongoService } = await import('./database');
    return await MongoService.searchByZone(zone);
  }

  static async searchByStatus(status: string) {
    if (DATABASE_TYPE === 'json') {
      const records = readJsonFile(PERSONNEL_FILE);
      return records.filter((record: any) => record.status === status);
    }
    const { PersonnelRecordService: MongoService } = await import('./database');
    return await MongoService.searchByStatus(status);
  }
}

// Users Service
export class UserService {
  static async getAll() {
    if (DATABASE_TYPE === 'json') {
      return readJsonFile(USERS_FILE);
    }
    const { UserService: MongoService } = await import('./database');
    return await MongoService.getAll();
  }

  static async getByEmail(email: string) {
    if (DATABASE_TYPE === 'json') {
      const users = readJsonFile(USERS_FILE);
      return users.find((user: any) => user.email === email) || null;
    }
    const { UserService: MongoService } = await import('./database');
    return await MongoService.getByEmail(email);
  }

  static async getByFullName(fullName: string) {
    if (DATABASE_TYPE === 'json') {
      const users = readJsonFile(USERS_FILE);
      return users.find((user: any) => user.fullName === fullName) || null;
    }
    const { UserService: MongoService } = await import('./database');
    return await MongoService.getByFullName(fullName);
  }

  static async getById(id: string) {
    if (DATABASE_TYPE === 'json') {
      const users = readJsonFile(USERS_FILE);
      return users.find((user: any) => user.id === id) || null;
    }
    const { UserService: MongoService } = await import('./database');
    return await MongoService.getById(id);
  }

  static async create(data: any) {
    if (DATABASE_TYPE === 'json') {
      const users = readJsonFile(USERS_FILE);
      const newUser = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true
      };
      users.push(newUser);
      writeJsonFile(USERS_FILE, users);
      return { ...newUser, toObject: () => newUser };
    }
    const { UserService: MongoService } = await import('./database');
    return await MongoService.create(data);
  }

  static async updateById(id: string, data: any) {
    if (DATABASE_TYPE === 'json') {
      const users = readJsonFile(USERS_FILE);
      const index = users.findIndex((user: any) => user.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...data, updatedAt: new Date().toISOString() };
        writeJsonFile(USERS_FILE, users);
        return users[index];
      }
      return null;
    }
    const { UserService: MongoService } = await import('./database');
    return await MongoService.updateById(id, data);
  }

  static async deleteById(id: string) {
    if (DATABASE_TYPE === 'json') {
      const users = readJsonFile(USERS_FILE);
      const index = users.findIndex((user: any) => user.id === id);
      if (index !== -1) {
        users.splice(index, 1);
        writeJsonFile(USERS_FILE, users);
        return true;
      }
      return false;
    }
    const { UserService: MongoService } = await import('./database');
    return await MongoService.deleteById(id);
  }

  static async updateLastLogin(email: string) {
    if (DATABASE_TYPE === 'json') {
      const users = readJsonFile(USERS_FILE);
      const index = users.findIndex((user: any) => user.email === email);
      if (index !== -1) {
        users[index].lastLogin = new Date().toISOString();
        writeJsonFile(USERS_FILE, users);
        return users[index];
      }
      return null;
    }
    const { UserService: MongoService } = await import('./database');
    return await MongoService.updateLastLogin(email);
  }
}

// Notifications Service
export class NotificationService {
  static async getAll() {
    if (DATABASE_TYPE === 'json') {
      return readJsonFile(NOTIFICATIONS_FILE);
    }
    const { NotificationService: MongoService } = await import('./database');
    return await MongoService.getAll();
  }

  static async getByUser(targetUser: string) {
    console.log('🔍 NotificationService.getByUser() for:', targetUser, '- DATABASE_TYPE:', DATABASE_TYPE);
    if (DATABASE_TYPE === 'json') {
      console.log('📄 Using JSON file storage for notifications');
      const notifications = readJsonFile(NOTIFICATIONS_FILE);
      const userNotifications = notifications
        .filter((n: any) => n.targetUser === targetUser)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      console.log('✅ Found', userNotifications.length, 'notifications in JSON for', targetUser);
      return userNotifications;
    }
    console.log('🗄️ Using MongoDB storage for notifications');
    const { NotificationService: MongoService } = await import('./database');

    // Handle both "SuperAdmin" and "Super Admin" variations
    const searchUsers = [targetUser];
    if (targetUser === 'SuperAdmin') {
      searchUsers.push('Super Admin');
    } else if (targetUser === 'Super Admin') {
      searchUsers.push('SuperAdmin');
    }

    console.log('🔍 Searching notifications for users:', searchUsers);

    // Get notifications for all variations of the username
    let allNotifications = [];
    for (const user of searchUsers) {
      const userNotifications = await MongoService.getByUser(user);
      allNotifications = allNotifications.concat(userNotifications);
    }

    // Convert MongoDB documents to plain objects
    const plainNotifications = allNotifications.map(notification => {
      if (notification.toObject) {
        const plain = notification.toObject();
        // Ensure we have the right structure for frontend
        return {
          ...plain,
          id: plain._id?.toString() || plain.id,
          timestamp: plain.createdAt?.toISOString() || new Date().toISOString()
        };
      }
      return {
        ...notification,
        id: notification._id?.toString() || notification.id,
        timestamp: notification.createdAt?.toISOString() || notification.timestamp || new Date().toISOString()
      };
    });

    // Remove duplicates and sort by timestamp
    const uniqueNotifications = plainNotifications.filter((notif, index, self) =>
      index === self.findIndex(n => n.id === notif.id)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log('✅ Found', uniqueNotifications.length, 'notifications in MongoDB for', targetUser);
    return uniqueNotifications;
  }

  static async getUnreadCount(targetUser: string) {
    console.log('🔍 NotificationService.getUnreadCount() for:', targetUser, '- DATABASE_TYPE:', DATABASE_TYPE);
    if (DATABASE_TYPE === 'json') {
      console.log('📄 Using JSON file storage for unread count');
      const notifications = readJsonFile(NOTIFICATIONS_FILE);
      const unreadCount = notifications.filter((n: any) => n.targetUser === targetUser && !n.read).length;
      console.log('✅ Found', unreadCount, 'unread notifications in JSON for', targetUser);
      return unreadCount;
    }
    console.log('🗄️ Using MongoDB storage for unread count');
    const { NotificationService: MongoService } = await import('./database');

    // Handle both "SuperAdmin" and "Super Admin" variations
    const searchUsers = [targetUser];
    if (targetUser === 'SuperAdmin') {
      searchUsers.push('Super Admin');
    } else if (targetUser === 'Super Admin') {
      searchUsers.push('SuperAdmin');
    }

    let totalUnreadCount = 0;
    for (const user of searchUsers) {
      const count = await MongoService.getUnreadCount(user);
      totalUnreadCount += count;
    }

    console.log('✅ Found', totalUnreadCount, 'unread notifications in MongoDB for', targetUser);
    return totalUnreadCount;
  }

  static async create(data: any) {
    console.log('🔍 NotificationService.create() - DATABASE_TYPE:', DATABASE_TYPE);
    console.log('📝 Creating notification for:', data.targetUser, 'Type:', data.type);
    if (DATABASE_TYPE === 'json') {
      console.log('📄 Using JSON file storage for notifications');
      const notifications = readJsonFile(NOTIFICATIONS_FILE);
      const newNotification = {
        ...data,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        read: false
      };
      notifications.unshift(newNotification);

      // Keep only last 500 notifications per user
      const userNotifications = notifications.filter((n: any) => n.targetUser === data.targetUser);
      if (userNotifications.length > 500) {
        const toRemove = userNotifications.slice(500);
        const filteredNotifications = notifications.filter((n: any) =>
          n.targetUser !== data.targetUser || !toRemove.includes(n)
        );
        writeJsonFile(NOTIFICATIONS_FILE, filteredNotifications);
      } else {
        writeJsonFile(NOTIFICATIONS_FILE, notifications);
      }

      console.log('✅ Notification saved to JSON file');
      return { ...newNotification, _id: newNotification.id, createdAt: new Date(newNotification.timestamp) };
    }
    console.log('🗄️ Using MongoDB storage for notifications');
    const { NotificationService: MongoService } = await import('./database');
    const result = await MongoService.create(data);
    console.log('✅ Notification saved to MongoDB');
    return result;
  }

  static async markAsRead(id: string) {
    if (DATABASE_TYPE === 'json') {
      const notifications = readJsonFile(NOTIFICATIONS_FILE);
      const notification = notifications.find((n: any) => n.id === id);
      if (notification) {
        notification.read = true;
        writeJsonFile(NOTIFICATIONS_FILE, notifications);
      }
      return notification;
    }
    const { NotificationService: MongoService } = await import('./database');
    return await MongoService.markAsRead(id);
  }

  static async markAllAsRead(targetUser: string) {
    if (DATABASE_TYPE === 'json') {
      const notifications = readJsonFile(NOTIFICATIONS_FILE);
      let updated = 0;
      notifications.forEach((n: any) => {
        if (n.targetUser === targetUser && !n.read) {
          n.read = true;
          updated++;
        }
      });
      if (updated > 0) {
        writeJsonFile(NOTIFICATIONS_FILE, notifications);
      }
      return updated;
    }
    const { NotificationService: MongoService } = await import('./database');
    return await MongoService.markAllAsRead(targetUser);
  }

  static async deleteOld(daysOld: number = 30) {
    if (DATABASE_TYPE === 'json') {
      const notifications = readJsonFile(NOTIFICATIONS_FILE);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const initialCount = notifications.length;
      const filteredNotifications = notifications.filter((notification: any) => {
        const notificationDate = new Date(notification.timestamp);
        return notificationDate >= cutoffDate;
      });
      
      const deletedCount = initialCount - filteredNotifications.length;
      if (deletedCount > 0) {
        writeJsonFile(NOTIFICATIONS_FILE, filteredNotifications);
      }
      
      return deletedCount;
    }
    const { NotificationService: MongoService } = await import('./database');
    return await MongoService.deleteOld(daysOld);
  }
}

// Logs Service
export class LogService {
  static async getAll(limit: number = 500) {
    if (DATABASE_TYPE === 'json') {
      const logs = readJsonFile(LOGS_FILE);
      return logs
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    }
    const { LogService: MongoService } = await import('./database');
    return await MongoService.getAll(limit);
  }

  static async create(data: any) {
    if (DATABASE_TYPE === 'json') {
      const logs = readJsonFile(LOGS_FILE);
      const newLog = {
        ...data,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      };
      logs.unshift(newLog);
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(1000);
      }
      
      writeJsonFile(LOGS_FILE, logs);
      return { ...newLog, _id: newLog.id, createdAt: new Date(newLog.timestamp) };
    }
    const { LogService: MongoService } = await import('./database');
    return await MongoService.create(data);
  }

  static async search(filters: any) {
    if (DATABASE_TYPE === 'json') {
      let logs = readJsonFile(LOGS_FILE);
      
      if (filters.user) {
        logs = logs.filter((log: any) => 
          log.user.toLowerCase().includes(filters.user.toLowerCase())
        );
      }
      if (filters.category) {
        logs = logs.filter((log: any) => log.category === filters.category);
      }
      if (filters.severity) {
        logs = logs.filter((log: any) => log.severity === filters.severity);
      }
      
      return logs
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, filters.limit || 500);
    }
    const { LogService: MongoService } = await import('./database');
    return await MongoService.search(filters);
  }

  static async deleteAll() {
    if (DATABASE_TYPE === 'json') {
      const count = readJsonFile(LOGS_FILE).length;
      writeJsonFile(LOGS_FILE, []);
      return count;
    }
    const { LogService: MongoService } = await import('./database');
    return await MongoService.deleteAll();
  }

  static async deleteOld(daysOld: number = 90) {
    if (DATABASE_TYPE === 'json') {
      const logs = readJsonFile(LOGS_FILE);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const initialCount = logs.length;
      const filteredLogs = logs.filter((log: any) => {
        const logDate = new Date(log.timestamp);
        return logDate >= cutoffDate;
      });
      
      const deletedCount = initialCount - filteredLogs.length;
      if (deletedCount > 0) {
        writeJsonFile(LOGS_FILE, filteredLogs);
      }
      
      return deletedCount;
    }
    const { LogService: MongoService } = await import('./database');
    return await MongoService.deleteOld(daysOld);
  }
}
