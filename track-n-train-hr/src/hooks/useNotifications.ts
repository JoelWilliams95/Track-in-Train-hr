import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'tag' | 'profile_added' | 'connected' | 'heartbeat';
  message: string;
  timestamp: string;
  data?: any;
  read?: boolean;
}

export function useNotifications(userId: string, userZone: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Load notifications from localStorage on component mount
  useEffect(() => {
    if (!userId) return;

    const storageKey = `notifications_${userId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsedNotifications = JSON.parse(stored);
        setNotifications(parsedNotifications);

        // Calculate unread count
        const unread = parsedNotifications.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error loading stored notifications:', error);
      }
    }
  }, [userId]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (!userId || notifications.length === 0) return;

    const storageKey = `notifications_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [notifications, userId]);

  useEffect(() => {
    if (!userId) {
      console.log('useNotifications: No userId provided');
      return;
    }

    console.log('useNotifications: Setting up EventSource for userId:', userId, 'userZone:', userZone);

    // Don't double-encode if already encoded
    const cleanUserId = userId.includes('%') ? decodeURIComponent(userId) : userId;
    const cleanUserZone = userZone.includes('%') ? decodeURIComponent(userZone) : userZone;

    console.log('useNotifications: Clean userId:', cleanUserId, 'Clean userZone:', cleanUserZone);

    const eventSource = new EventSource(
      `/api/notifications?userId=${encodeURIComponent(cleanUserId)}&userZone=${encodeURIComponent(cleanUserZone)}`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('Notifications connected for user:', userId);
    };

    eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);

        console.log('🔔 RECEIVED notification for user:', userId, 'notification:', notification);

        // Skip heartbeat and connection messages for UI
        if (notification.type === 'heartbeat' || notification.type === 'connected') {
          console.log('Heartbeat or connection message received');
          return;
        }

        console.log('Processing notification for UI:', notification);

        // Add notification to list
        setNotifications(prev => {
          const newNotifications = [{ ...notification, read: false }, ...prev];
          // Keep only last 200 notifications (increased from 50 for better history)
          return newNotifications.slice(0, 200);
        });

        // Update unread count
        setUnreadCount(prev => prev + 1);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('Track-n-Train HR', {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      console.log('Notifications disconnected');
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [userId, userZone]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true }
          : notif
      );

      // Update localStorage
      if (userId) {
        const storageKey = `notifications_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }

      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [userId]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));

      // Update localStorage
      if (userId) {
        const storageKey = `notifications_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }

      return updated;
    });
    setUnreadCount(0);
  }, [userId]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);

    // Clear localStorage
    if (userId) {
      const storageKey = `notifications_${userId}`;
      localStorage.removeItem(storageKey);
    }
  }, [userId]);

  // Request notification permission on first load
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
}
