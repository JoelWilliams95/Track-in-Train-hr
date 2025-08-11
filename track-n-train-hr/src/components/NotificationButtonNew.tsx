'use client';

import { useState, useEffect } from 'react';
import { getColors } from '@/lib/colors';
import { useResponsive } from '@/hooks/useResponsive';

interface Notification {
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

interface NotificationButtonProps {
  userId: string;
  userZone: string;
  darkMode: boolean;
}

export default function NotificationButton({ userId, userZone, darkMode }: NotificationButtonProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const colors = getColors(darkMode);
  const { isMobile, isTablet } = useResponsive();

  // Load notifications from API
  const loadNotifications = async () => {
    if (!userId) return;

    // Decode userId if it's URL encoded (handle multiple levels of encoding)
    let cleanUserId = userId;
    while (cleanUserId.includes('%')) {
      const decoded = decodeURIComponent(cleanUserId);
      if (decoded === cleanUserId) break; // No more decoding needed
      cleanUserId = decoded;
    }

    console.log('📱 Loading notifications for userId:', cleanUserId, '(original:', userId, ')');

    setIsLoading(true);
    try {
      const response = await fetch(`/api/notifications/get?userId=${encodeURIComponent(cleanUserId)}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        console.log('📱 Loaded notifications:', data.notifications?.length, 'unread:', data.unreadCount);
      } else {
        console.error('Failed to load notifications:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications on mount and when userId changes
  useEffect(() => {
    loadNotifications();
  }, [userId]);

  // Poll for new notifications every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    // Decode userId if it's URL encoded (handle multiple levels of encoding)
    let cleanUserId = userId;
    while (cleanUserId.includes('%')) {
      const decoded = decodeURIComponent(cleanUserId);
      if (decoded === cleanUserId) break;
      cleanUserId = decoded;
    }

    try {
      const response = await fetch(`/api/notifications/get?userId=${encodeURIComponent(cleanUserId)}&action=markAsRead&notificationId=${notificationId}`);
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // Decode userId if it's URL encoded (handle multiple levels of encoding)
    let cleanUserId = userId;
    while (cleanUserId.includes('%')) {
      const decoded = decodeURIComponent(cleanUserId);
      if (decoded === cleanUserId) break;
      cleanUserId = decoded;
    }

    try {
      const response = await fetch(`/api/notifications/get?userId=${encodeURIComponent(cleanUserId)}&action=markAllAsRead`);
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle profile selection based on notification type
    if (notification.data?.actionType === 'view_profile' && notification.data?.profileName) {
      // Close the notification panel
      setShowPanel(false);

      // Trigger profile selection by dispatching a custom event
      // This will be caught by the Profiles component to open the profile details
      const profileName = notification.data.profileName;
      console.log('🔔 Notification clicked - opening profile:', profileName);

      // Dispatch custom event to select profile
      window.dispatchEvent(new CustomEvent('selectProfile', {
        detail: { profileName }
      }));
    }
  };

  // Format time functions
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`; // 7 days
    if (diffInMinutes < 43200) return `${Math.floor(diffInMinutes / 10080)}w ago`; // 30 days
    return `${Math.floor(diffInMinutes / 43200)}mo ago`;
  };

  const formatFullDateTime = (timestamp: string) => {
    const time = new Date(timestamp);
    return time.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tag': return '🏷️';
      case 'profile_added': return '👤';
      default: return '🔔';
    }
  };

  // Debug logging
  let cleanUserId = userId;
  while (cleanUserId.includes('%')) {
    const decoded = decodeURIComponent(cleanUserId);
    if (decoded === cleanUserId) break;
    cleanUserId = decoded;
  }
  console.log('NotificationButton - userId:', userId, '(decoded:', cleanUserId, ')');
  console.log('NotificationButton - notifications count:', notifications.length);
  console.log('NotificationButton - unreadCount:', unreadCount);
  console.log('NotificationButton - showPanel:', showPanel);

  if (!userId) {
    return null; // Don't render if no user
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Floating Notification Button */}
      <button
        onClick={() => {
          console.log('Notification button clicked! Current showPanel:', showPanel);
          setShowPanel(!showPanel);
          console.log('Setting showPanel to:', !showPanel);
        }}
        className="responsive-floating"
        style={{
          borderRadius: '50%',
          background: colors.ACCENT || '#3b82f6',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: 'white',
          transition: 'all 0.3s ease',
          transform: showPanel ? 'scale(1.1)' : 'scale(1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = showPanel ? 'scale(1.1)' : 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '2px solid white'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div
          className="responsive-notification-panel"
          style={{
            background: darkMode ? '#1f2937' : '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            zIndex: 9998,
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            background: darkMode ? '#111827' : '#f8fafc'
          }}>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: darkMode ? '#f9fafb' : '#1e293b'
              }}>
                Notifications
              </h3>
              {notifications.length > 0 && (
                <p style={{
                  margin: '2px 0 0 0',
                  fontSize: '12px',
                  color: darkMode ? '#9ca3af' : '#6b7280'
                }}>
                  {unreadCount > 0 ? `${unreadCount} new` : 'All read'} • {notifications.length} total
                </p>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {isLoading ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: darkMode ? '#9ca3af' : '#6b7280',
                fontSize: '14px'
              }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: darkMode ? '#9ca3af' : '#6b7280',
                fontSize: '14px'
              }}>
                No notifications yet
              </div>
            ) : (
              <>
                {/* Unread Notifications */}
                {notifications.filter(n => !n.read).length > 0 && (
                  <>
                    <div style={{
                      padding: '12px 20px',
                      background: darkMode ? '#1f2937' : '#f8fafc',
                      borderBottom: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: darkMode ? '#60a5fa' : '#2563eb',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      New Notifications ({notifications.filter(n => !n.read).length})
                    </div>
                    {notifications.filter(n => !n.read).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        style={{
                          padding: '16px 20px',
                          borderBottom: darkMode ? '1px solid #374151' : '1px solid #f3f4f6',
                          cursor: 'pointer',
                          background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                          transition: 'all 0.2s ease',
                          borderLeft: `4px solid ${darkMode ? '#3b82f6' : '#2563eb'}`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)';
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}>
                          <span style={{ fontSize: '18px', flexShrink: 0 }}>
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0,
                              fontSize: '14px',
                              color: darkMode ? '#f9fafb' : '#1e293b',
                              lineHeight: '1.4',
                              fontWeight: '500'
                            }}>
                              {notification.message}
                            </p>
                            <div style={{
                              margin: '6px 0 0 0',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '12px',
                                color: darkMode ? '#9ca3af' : '#6b7280',
                                fontWeight: '500'
                              }}>
                                {formatTimeAgo(notification.timestamp)}
                              </p>
                              <p style={{
                                margin: 0,
                                fontSize: '11px',
                                color: darkMode ? '#6b7280' : '#9ca3af',
                                fontStyle: 'italic'
                              }}>
                                {formatFullDateTime(notification.timestamp)}
                              </p>
                            </div>
                            {notification.data?.actionType === 'view_profile' && (
                              <p style={{
                                margin: '6px 0 0 0',
                                fontSize: '11px',
                                color: darkMode ? '#60a5fa' : '#2563eb',
                                fontWeight: '500'
                              }}>
                                Click to view profile →
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Read Notifications */}
                {notifications.filter(n => n.read).length > 0 && (
                  <>
                    <div style={{
                      padding: '12px 20px',
                      background: darkMode ? '#111827' : '#f1f5f9',
                      borderBottom: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: darkMode ? '#9ca3af' : '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Previous Notifications ({notifications.filter(n => n.read).length})
                    </div>
                    {notifications.filter(n => n.read).slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        style={{
                          padding: '16px 20px',
                          borderBottom: darkMode ? '1px solid #374151' : '1px solid #f3f4f6',
                          cursor: 'pointer',
                          background: 'transparent',
                          transition: 'all 0.2s ease',
                          opacity: 0.7
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = darkMode ? 'rgba(75, 85, 99, 0.1)' : 'rgba(148, 163, 184, 0.1)';
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.opacity = '0.7';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}>
                          <span style={{ fontSize: '18px', flexShrink: 0, opacity: 0.6 }}>
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0,
                              fontSize: '14px',
                              color: darkMode ? '#d1d5db' : '#374151',
                              lineHeight: '1.4',
                              fontWeight: '400'
                            }}>
                              {notification.message}
                            </p>
                            <div style={{
                              margin: '6px 0 0 0',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}>
                              <p style={{
                                margin: 0,
                                fontSize: '12px',
                                color: darkMode ? '#6b7280' : '#9ca3af',
                                fontWeight: '500'
                              }}>
                                {formatTimeAgo(notification.timestamp)}
                              </p>
                              <p style={{
                                margin: 0,
                                fontSize: '11px',
                                color: darkMode ? '#4b5563' : '#d1d5db',
                                fontStyle: 'italic'
                              }}>
                                {formatFullDateTime(notification.timestamp)}
                              </p>
                            </div>
                            {notification.data?.actionType === 'view_profile' && (
                              <p style={{
                                margin: '6px 0 0 0',
                                fontSize: '11px',
                                color: darkMode ? '#4b5563' : '#9ca3af',
                                fontWeight: '500'
                              }}>
                                Click to view profile →
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '12px 20px',
              borderTop: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
              background: darkMode ? '#374151' : '#f9fafb',
              display: 'flex',
              gap: '12px'
            }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: `1px solid ${darkMode ? '#60a5fa' : '#2563eb'}`,
                    color: darkMode ? '#60a5fa' : '#2563eb',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  Mark all as read
                </button>
              )}
              <div style={{
                fontSize: '11px',
                color: darkMode ? '#9ca3af' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: unreadCount > 0 ? 1 : 'none',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
