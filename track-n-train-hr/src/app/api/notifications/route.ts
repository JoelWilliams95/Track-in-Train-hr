import { NextRequest } from 'next/server';

// Import shared connections map
import { connections } from '@/lib/sse-connections';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let userId = searchParams.get('userId');
  let userZone = searchParams.get('userZone');

  if (!userId) {
    return new Response('Missing userId', { status: 400 });
  }

  // Handle URL decoding if needed
  if (userId.includes('%')) {
    userId = decodeURIComponent(userId);
  }
  if (userZone && userZone.includes('%')) {
    userZone = decodeURIComponent(userZone);
  }

  console.log('Notification connection for userId:', userId, 'userZone:', userZone);

  const stream = new ReadableStream({
    start(controller) {
      // Store connection with user info
      const connectionKey = `${userId}-${Date.now()}`;

      console.log('📡 Storing connection for key:', connectionKey);
      console.log('📡 Total connections before adding:', connections.size);

      connections.set(connectionKey, controller);

      console.log('📡 Total connections after adding:', connections.size);
      console.log('📡 All connection keys:', Array.from(connections.keys()));

      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to notifications',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`);
        } catch (error) {
          console.log('💔 Heartbeat failed for connection:', connectionKey, 'Error:', error);
          clearInterval(heartbeat);
          connections.delete(connectionKey);
          console.log('💔 Connection removed. Remaining connections:', connections.size);
        }
      }, 30000); // 30 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        console.log('🔌 Connection aborted for:', connectionKey);
        clearInterval(heartbeat);
        connections.delete(connectionKey);
        console.log('🔌 Connection removed. Remaining connections:', connections.size);
        try {
          controller.close();
        } catch (error) {
          console.log('🔌 Error closing controller:', error);
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
