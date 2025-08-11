// MongoDB-based notification storage
import { NotificationService } from '@/services/database-adapter';

export interface Notification {
  id: string;
  type: 'tag' | 'profile_added' | 'system';
  targetUser: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: {
    taggerName?: string;
    profileName?: string;
    profileId?: string;
    comment?: string;
    actionType?: string;
    zone?: string;
    adderName?: string;
  };
}

// Add a new notification
export async function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  try {
    const newNotification = await NotificationService.create({
      type: notification.type,
      targetUser: notification.targetUser,
      message: notification.message,
      read: false,
      data: notification.data
    });
    
    return {
      id: newNotification._id.toString(),
      type: newNotification.type,
      targetUser: newNotification.targetUser,
      message: newNotification.message,
      timestamp: newNotification.createdAt?.toISOString() || new Date().toISOString(),
      read: newNotification.read,
      data: newNotification.data
    };
  } catch (error) {
    console.error('Error adding notification:', error);
    throw error;
  }
}

// Get notifications for a specific user
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const notifications = await NotificationService.getByUser(userId);
    
    return notifications.map((notification: any) => ({
      id: notification._id.toString(),
      type: notification.type,
      targetUser: notification.targetUser,
      message: notification.message,
      timestamp: notification.createdAt?.toISOString() || new Date().toISOString(),
      read: notification.read,
      data: notification.data
    }));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    await NotificationService.markAsRead(notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await NotificationService.markAllAsRead(userId);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Get unread count for a user
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await NotificationService.getUnreadCount(userId);
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Clean old notifications (older than specified days)
export async function cleanOldNotifications(daysOld: number = 30) {
  try {
    const deletedCount = await NotificationService.deleteOld(daysOld);
    console.log(`Cleaned ${deletedCount} old notifications`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning old notifications:', error);
    throw error;
  }
}

// Read all notifications (for admin purposes)
export async function readNotifications(): Promise<Notification[]> {
  try {
    const notifications = await NotificationService.getAll();
    
    return notifications.map((notification: any) => ({
      id: notification._id.toString(),
      type: notification.type,
      targetUser: notification.targetUser,
      message: notification.message,
      timestamp: notification.createdAt?.toISOString() || new Date().toISOString(),
      read: notification.read,
      data: notification.data
    }));
  } catch (error) {
    console.error('Error reading all notifications:', error);
    return [];
  }
}

// Write notifications (not needed for MongoDB, but kept for compatibility)
export function writeNotifications(notifications: Notification[]) {
  console.warn('writeNotifications is deprecated when using MongoDB. Use individual notification operations instead.');
  return true;
}
