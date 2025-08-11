"use client";
import React, { useState } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { COLORS, getColors, BUTTON_COLORS } from '@/lib/colors';

interface NotificationButtonProps {
  userId: string;
  userZone: string;
  darkMode: boolean;
}

export default function NotificationButton({ userId, userZone, darkMode }: NotificationButtonProps) {
  const [showPanel, setShowPanel] = useState(false);
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, clearNotifications } = useNotifications(userId, userZone);
  const colors = getColors(darkMode);

  // Debug logging
  console.log('NotificationButton - userId:', userId);
  console.log('NotificationButton - userZone:', userZone);
  console.log('NotificationButton - isConnected:', isConnected);
  console.log('NotificationButton - notifications count:', notifications.length);
  console.log('NotificationButton - unreadCount:', unreadCount);
  console.log('NotificationButton - showPanel:', showPanel);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Handle redirection based on notification type
    if (notification.data?.actionType === 'view_profile' && notification.data?.profileName) {
      // Close the notification panel
      setShowPanel(false);

      // Redirect to profiles page with the specific profile
      // We'll use a URL parameter to auto-select the profile
      const profileName = encodeURIComponent(notification.data.profileName);
      window.location.href = `/profiles?select=${profileName}`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tag': return '💬';
      case 'profile_added': return '👤';
      default: return '🔔';
    }
  };

  return (
    <>
      {/* Floating Notification Button */}
      <button
        onClick={() => {
          console.log('Notification button clicked! Current showPanel:', showPanel);
          setShowPanel(!showPanel);
          console.log('Setting showPanel to:', !showPanel);
        }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: colors.ACCENT || '#3b82f6',
          border: 'none',
          color: COLORS.WHITE,
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: `0 4px 20px ${colors.ACCENT}66`,
          zIndex: 9999,

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.4)';
        }}
        title="Notifications"
      >
        🔔
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: '#ef4444',
            color: '#ffffff',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #ffffff'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* Connection status indicator */}
        <div style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isConnected ? '#10b981' : '#ef4444',
          border: '1px solid #ffffff'
        }} />
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div
          style={{
          position: 'fixed',
          bottom: '90px',
          right: '24px',
          width: '350px',
          maxHeight: '500px',
          background: colors.BACKGROUND,
          border: `1px solid ${colors.BORDER}`,
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          zIndex: 10000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            background: darkMode ? '#374151' : '#f9fafb'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
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
              <div style={{ display: 'flex', gap: '8px' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: darkMode ? '#60a5fa' : '#2563eb',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: darkMode ? '#9ca3af' : '#6b7280',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {notifications.length === 0 ? (
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
                    background: notification.read
                      ? 'transparent'
                      : (darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'),
                    transition: 'all 0.2s ease',
                    borderLeft: notification.read
                      ? 'none'
                      : `4px solid ${darkMode ? '#3b82f6' : '#2563eb'}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read
                      ? 'transparent'
                      : (darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)');
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
                        fontWeight: notification.read ? '400' : '500'
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
                    {!notification.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        flexShrink: 0,
                        marginTop: '4px'
                      }} />
                    )}
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
                    {notifications.filter(n => n.read).map((notification) => (
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
    </>
  );
}
