import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/database-adapter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const notificationId = searchParams.get('notificationId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Decode userId if needed
    let cleanUserId = userId.includes('%') ? decodeURIComponent(userId) : userId;

    // Handle SuperAdmin vs Super Admin variations
    if (cleanUserId === 'SuperAdmin') {
      cleanUserId = 'Super Admin';
    } else if (cleanUserId === 'Super Admin' && userId.includes('SuperAdmin')) {
      cleanUserId = 'Super Admin';
    }

    switch (action) {
      case 'unreadCount':
        const unreadCount = await NotificationService.getUnreadCount(cleanUserId);
        return NextResponse.json({ unreadCount });

      case 'markAsRead':
        if (!notificationId) {
          return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
        }
        await NotificationService.markAsRead(notificationId);
        return NextResponse.json({ success: true });

      case 'markAllAsRead':
        await NotificationService.markAllAsRead(cleanUserId);
        return NextResponse.json({ success: true });

      default:
        // Get all notifications for user
        const notifications = await NotificationService.getByUser(cleanUserId);
        const unread = await NotificationService.getUnreadCount(cleanUserId);
        return NextResponse.json({
          notifications,
          unreadCount: unread
        });
    }
  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
