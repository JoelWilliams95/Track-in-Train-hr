// Shared Server-Sent Events connections management
export const connections = new Map<string, ReadableStreamDefaultController>();

// Function to send notification to specific users via SSE
export function sendNotification(notification: {
  type: 'tag' | 'profile_added';
  targetUsers?: string[];
  targetZone?: string;
  message: string;
  data?: any;
}) {
  const notificationData = {
    ...notification,
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  console.log('📤 Sending SSE notification:', notificationData);
  console.log('📤 Active connections:', connections.size);

  connections.forEach((controller, connectionKey) => {
    try {
      // Extract userId and userZone from connection key (format: userId-timestamp)
      const connectionParts = connectionKey.split('-');
      const userId = connectionParts[0];
      
      // Check if this user should receive the notification
      let shouldSend = false;
      
      // Direct user targeting
      if (notification.targetUsers && notification.targetUsers.includes(userId)) {
        shouldSend = true;
        console.log(`✅ Sending to user ${userId} (direct target)`);
      }
      
      // Zone-based targeting - need to get user's zone from the notification data
      // or from a separate user zone lookup (this logic may need enhancement)
      if (notification.targetZone) {
        // For zone-based notifications, we'll send to all connected users
        // The filtering should be done at the database level during notification creation
        shouldSend = true;
        console.log(`✅ Sending zone notification to user ${userId} for zone ${notification.targetZone}`);
      }

      if (shouldSend) {
        console.log(`📤 Sending notification to connection: ${connectionKey}`);
        controller.enqueue(`data: ${JSON.stringify(notificationData)}\n\n`);
      }
    } catch (error) {
      console.error(`💥 Failed to send to connection ${connectionKey}:`, error);
      // Remove dead connection
      connections.delete(connectionKey);
    }
  });
}
