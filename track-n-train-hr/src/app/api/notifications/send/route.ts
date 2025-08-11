import { NextRequest, NextResponse } from 'next/server';
import { NotificationService, PersonnelRecordService, UserService } from '@/services/database-adapter';
import { sendNotification } from '@/lib/sse-connections';

function sendNotificationToUsers(notification: any) {
  console.log('=== NOTIFICATION SEND DEBUG ===');
  console.log('sendNotificationToUsers: notification type:', notification.type);
  console.log('sendNotificationToUsers: notification message:', notification.message);
  
  if (notification.type === 'tag') {
    console.log('sendNotificationToUsers: tag notification targetUsers:', notification.targetUsers);
    
    // Send tag notifications to specific users
    notification.targetUsers.forEach(async (targetUser: string) => {
      console.log(`✅ STORING tag notification for ${targetUser}`);
      await NotificationService.create({
        type: 'tag',
        targetUser: targetUser,
        message: notification.message,
        data: notification.data || {}
      });
    });
    
    // Also send real-time notification via SSE
    sendNotification({
      type: 'tag',
      targetUsers: notification.targetUsers,
      message: notification.message,
      data: notification.data
    });
  }
  
  if (notification.type === 'profile_added') {
    console.log('sendNotificationToUsers: profile_added notification targetZone:', notification.targetZone);
    
    // Find all users who should receive this notification
    const sendNotificationsAsync = async () => {
      const targetUsers = new Set<string>();
      
      // Add users from personnel records in the same zone
      const personnelRecords = await PersonnelRecordService.searchByZone(notification.targetZone);
      personnelRecords.forEach((record: any) => {
        targetUsers.add(record.fullName);
      });
      
      // Add users from users collection in the same zone or SuperAdmin
      const users = await UserService.getAll();
      users.forEach((user: any) => {
        if (user.zone === notification.targetZone || 
            user.zone === 'All' || 
            user.fullName === 'Super Admin' || 
            user.fullName === 'SuperAdmin') {
          targetUsers.add(user.fullName);
        }
      });
      
      // Send notifications to all target users
      for (const targetUser of targetUsers) {
        console.log(`✅ STORING profile_added notification for ${targetUser}`);
        await NotificationService.create({
          type: 'profile_added',
          targetUser: targetUser,
          message: notification.message,
          data: notification.data || {}
        });
      }
      
      // Also send real-time notification via SSE
      if (targetUsers.size > 0) {
        sendNotification({
          type: 'profile_added',
          targetUsers: Array.from(targetUsers),
          targetZone: notification.targetZone,
          message: notification.message,
          data: notification.data
        });
      }
    };
    
    sendNotificationsAsync().catch(console.error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json();
    
    if (!notification || !notification.type) {
      return NextResponse.json({ error: 'Invalid notification data' }, { status: 400 });
    }

    console.log('Received notification request:', notification);

    // Send notification to users
    sendNotificationToUsers(notification);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
