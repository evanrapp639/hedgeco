// Server-Sent Events endpoint for real-time notifications
// Authenticates via JWT and streams notifications to connected clients

import { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { notificationEmitter, type NotificationPayload } from '@/lib/notification-emitter';

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;

// Connection timeout (5 minutes of inactivity)
const CONNECTION_TIMEOUT = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  // ============================================================
  // Authentication
  // ============================================================
  
  // Get token from Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    // Fallback to cookie
    token = request.cookies.get('accessToken')?.value ?? null;
  }

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const user = await verifyAccessToken(token);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ============================================================
  // SSE Stream Setup
  // ============================================================

  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  let isConnected = true;
  let lastActivity = Date.now();

  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Helper to write SSE formatted data
  const writeSSE = async (event: string, data: unknown) => {
    if (!isConnected) return;
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
      lastActivity = Date.now();
    } catch (error) {
      console.error('[SSE] Write error:', error);
      cleanup();
    }
  };

  // ============================================================
  // Event Handlers
  // ============================================================

  // Handle incoming notifications for this connection
  const onNotification = async (notification: NotificationPayload) => {
    await writeSSE('notification', notification);
  };

  // ============================================================
  // Connection Management
  // ============================================================

  // Register connection
  notificationEmitter.registerConnection(connectionId, user.sub, user.role);
  notificationEmitter.on(`notification:${connectionId}`, onNotification);

  // Heartbeat timer
  const heartbeatTimer = setInterval(async () => {
    if (!isConnected) return;
    
    // Check for timeout
    if (Date.now() - lastActivity > CONNECTION_TIMEOUT) {
      console.log(`[SSE] Connection ${connectionId} timed out`);
      cleanup();
      return;
    }

    await writeSSE('heartbeat', { 
      timestamp: new Date().toISOString(),
      connectionId 
    });
  }, HEARTBEAT_INTERVAL);

  // Cleanup function
  const cleanup = () => {
    if (!isConnected) return;
    isConnected = false;

    clearInterval(heartbeatTimer);
    notificationEmitter.off(`notification:${connectionId}`, onNotification);
    notificationEmitter.unregisterConnection(connectionId);

    try {
      writer.close();
    } catch {
      // Writer may already be closed
    }

    console.log(`[SSE] Connection ${connectionId} closed`);
  };

  // Handle client disconnect via AbortController
  request.signal.addEventListener('abort', cleanup);

  // ============================================================
  // Initial Connection
  // ============================================================

  // Send initial connection confirmation
  await writeSSE('connected', {
    connectionId,
    userId: user.sub,
    timestamp: new Date().toISOString(),
  });

  // ============================================================
  // Response
  // ============================================================

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// Disable body parsing for SSE endpoint
export const dynamic = 'force-dynamic';
