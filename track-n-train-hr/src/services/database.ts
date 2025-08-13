import { connectToMongoose } from '@/lib/mongodb';
import { PersonnelRecord, User, Notification, Log, IPersonnelRecord, IUser, INotification, ILog } from '@/models';

// Personnel Records Service
export class PersonnelRecordService {
  static async getAll(): Promise<IPersonnelRecord[]> {
    console.log('🔍 PersonnelRecordService.getAll() - Connecting to Mongoose...');
    await connectToMongoose();
    console.log('🔍 PersonnelRecordService.getAll() - Connected, querying records...');

    try {
      // Check what collection Mongoose is actually using
      console.log('🔍 Mongoose model collection name:', PersonnelRecord.collection.name);

      // Query the records using Mongoose
      const records = await PersonnelRecord.find({});
      console.log('🔍 PersonnelRecordService.getAll() - Mongoose query found', records.length, 'records');

      if (records.length > 0) {
        console.log('🔍 Sample record:', {
          fullName: records[0].fullName,
          zone: records[0].zone,
          status: records[0].status,
          hasCreatedAt: !!records[0].createdAt
        });

        // Sort manually if createdAt exists, otherwise return as-is
        if (records[0].createdAt) {
          return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else {
          console.log('⚠️ No createdAt field found, returning unsorted');
          return records;
        }
      }

      return records;
    } catch (error) {
      console.error('❌ PersonnelRecordService.getAll() error:', error);
      throw error;
    }
  }

  static async getByFullName(fullName: string): Promise<IPersonnelRecord | null> {
    await connectToMongoose();
    return await PersonnelRecord.findOne({ fullName });
  }

  static async create(data: Partial<IPersonnelRecord>): Promise<IPersonnelRecord> {
    await connectToMongoose();
    const record = new PersonnelRecord(data);
    return await record.save();
  }

  static async update(fullName: string, data: Partial<IPersonnelRecord>): Promise<IPersonnelRecord | null> {
    await connectToMongoose();
    return await PersonnelRecord.findOneAndUpdate(
      { fullName },
      { $set: data },
      { new: true }
    );
  }

  static async delete(fullName: string): Promise<boolean> {
    await connectToMongoose();
    const result = await PersonnelRecord.deleteOne({ fullName });
    return result.deletedCount > 0;
  }

  static async addComment(fullName: string, comment: any): Promise<IPersonnelRecord | null> {
    await connectToMongoose();
    return await PersonnelRecord.findOneAndUpdate(
      { fullName },
      { $push: { comments: comment } },
      { new: true }
    );
  }

  static async getComments(fullName: string): Promise<any[]> {
    console.log('🔍 PersonnelRecordService.getComments() - MongoDB service for:', fullName);
    await connectToMongoose();

    // Debug: Check which collection Mongoose is actually using
    console.log('🔍 Mongoose collection name:', PersonnelRecord.collection.name);
    console.log('🔍 Mongoose collection namespace:', PersonnelRecord.collection.namespace);

    // Try direct collection query as fallback
    const directRecord = await PersonnelRecord.db.collection('personnelRecords').findOne({ fullName });
    console.log('🔍 Direct query to personnelRecords collection:', directRecord ? 'Found' : 'Not found');
    if (directRecord) {
      console.log('🔍 Direct query comments count:', directRecord.comments?.length || 0);
    }

    const record = await PersonnelRecord.findOne({ fullName }, { comments: 1 });
    console.log('🔍 Mongoose query result for', fullName, ':', record ? 'Found record' : 'No record found');

    if (record) {
      console.log('🔍 Record has comments field:', !!record.comments);
      console.log('🔍 Comments count:', record.comments?.length || 0);
      if (record.comments && record.comments.length > 0) {
        console.log('🔍 Sample comment:', {
          author: record.comments[0].author,
          text: record.comments[0].text?.substring(0, 50) + '...'
        });
      }
    } else if (directRecord && directRecord.comments) {
      console.log('⚠️ Mongoose query failed but direct query succeeded - using direct result');
      return directRecord.comments;
    }

    const comments = record?.comments || [];
    console.log('🔍 Returning', comments.length, 'comments for', fullName);
    return comments;
  }

  static async searchByZone(zone: string): Promise<IPersonnelRecord[]> {
    await connectToMongoose();
    return await PersonnelRecord.find({ zone }).sort({ createdAt: -1 });
  }

  static async searchByStatus(status: string): Promise<IPersonnelRecord[]> {
    await connectToMongoose();
    return await PersonnelRecord.find({ status }).sort({ createdAt: -1 });
  }
}

// Users Service
export class UserService {
  static async getAll(): Promise<IUser[]> {
    await connectToMongoose();
    return await User.find({}).sort({ createdAt: -1 });
  }

  static async getByEmail(email: string): Promise<IUser | null> {
    await connectToMongoose();
    return await User.findOne({ email });
  }

  static async getByFullName(fullName: string): Promise<IUser | null> {
    await connectToMongoose();
    return await User.findOne({ fullName });
  }

  static async getById(id: string): Promise<IUser | null> {
    await connectToMongoose();
    return await User.findById(id);
  }

  static async create(data: Partial<IUser>): Promise<IUser> {
    await connectToMongoose();
    const user = new User(data);
    return await user.save();
  }

  static async update(email: string, data: Partial<IUser>): Promise<IUser | null> {
    await connectToMongoose();
    return await User.findOneAndUpdate(
      { email },
      { $set: data },
      { new: true }
    );
  }

  static async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    await connectToMongoose();
    return await User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
  }

  static async deleteById(id: string): Promise<boolean> {
    await connectToMongoose();
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  static async updateLastLogin(email: string): Promise<IUser | null> {
    await connectToMongoose();
    return await User.findOneAndUpdate(
      { email },
      { $set: { lastLogin: new Date() } },
      { new: true }
    );
  }
}

// Notifications Service
export class NotificationService {
  static async getAll(): Promise<INotification[]> {
    await connectToMongoose();
    return await Notification.find({}).sort({ createdAt: -1 });
  }

  static async getByUser(targetUser: string): Promise<INotification[]> {
    await connectToMongoose();
    return await Notification.find({ targetUser }).sort({ createdAt: -1 });
  }

  static async getUnreadCount(targetUser: string): Promise<number> {
    await connectToMongoose();
    return await Notification.countDocuments({ targetUser, read: false });
  }

  static async create(data: Partial<INotification>): Promise<INotification> {
    await connectToMongoose();
    const notification = new Notification(data);
    return await notification.save();
  }

  static async markAsRead(id: string): Promise<INotification | null> {
    await connectToMongoose();
    return await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    );
  }

  static async markAllAsRead(targetUser: string): Promise<number> {
    await connectToMongoose();
    const result = await Notification.updateMany(
      { targetUser, read: false },
      { $set: { read: true } }
    );
    return result.modifiedCount;
  }

  static async deleteOld(daysOld: number = 30): Promise<number> {
    await connectToMongoose();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    return result.deletedCount;
  }
}

// Logs Service
export class LogService {
  static async getAll(limit: number = 500): Promise<ILog[]> {
    await connectToMongoose();
    return await Log.find({}).sort({ createdAt: -1 }).limit(limit);
  }

  static async getByUser(user: string, limit: number = 100): Promise<ILog[]> {
    await connectToMongoose();
    return await Log.find({ user }).sort({ createdAt: -1 }).limit(limit);
  }

  static async getByCategory(category: string, limit: number = 100): Promise<ILog[]> {
    await connectToMongoose();
    return await Log.find({ category }).sort({ createdAt: -1 }).limit(limit);
  }

  static async create(data: Partial<ILog>): Promise<ILog> {
    await connectToMongoose();
    const log = new Log(data);
    return await log.save();
  }

  static async search(filters: {
    user?: string;
    category?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ILog[]> {
    await connectToMongoose();
    
    const query: any = {};
    
    if (filters.user) query.user = new RegExp(filters.user, 'i');
    if (filters.category) query.category = filters.category;
    if (filters.severity) query.severity = filters.severity;
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    
    return await Log.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 500);
  }

  static async deleteAll(): Promise<number> {
    await connectToMongoose();
    const result = await Log.deleteMany({});
    return result.deletedCount;
  }

  static async deleteOld(daysOld: number = 90): Promise<number> {
    await connectToMongoose();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await Log.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    return result.deletedCount;
  }
}
