// Notification Emitter - Event-driven real-time notifications
// Uses EventEmitter pattern for broadcasting notifications to connected clients

import { EventEmitter } from 'events';
import { UserRole } from '@prisma/client';

// ============================================================
// Types
// ============================================================

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: Date;
}

export type NotificationType =
  | 'SAVED_SEARCH_MATCH'
  | 'MESSAGE_RECEIVED'
  | 'FUND_UPDATE'
  | 'DOCUMENT_AVAILABLE'
  | 'ACCREDITATION_STATUS'
  | 'SYSTEM_ALERT'
  | 'WATCHLIST_UPDATE';

interface ConnectionInfo {
  userId: string;
  role: UserRole;
  connectedAt: Date;
}

// ============================================================
// Notification Emitter Singleton
// ============================================================

class NotificationEmitterClass extends EventEmitter {
  private connections: Map<string, Set<string>> = new Map(); // userId -> Set of connectionIds
  private connectionInfo: Map<string, ConnectionInfo> = new Map(); // connectionId -> info

  constructor() {
    super();
    // Increase max listeners for high-traffic scenarios
    this.setMaxListeners(1000);
  }

  /**
   * Register a new SSE connection for a user
   */
  registerConnection(connectionId: string, userId: string, role: UserRole): void {
    // Track connection info
    this.connectionInfo.set(connectionId, {
      userId,
      role,
      connectedAt: new Date(),
    });

    // Add to user's connection set
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(connectionId);

    console.log(`[NotificationEmitter] Connection registered: ${connectionId} for user ${userId}`);
  }

  /**
   * Remove a connection (on disconnect)
   */
  unregisterConnection(connectionId: string): void {
    const info = this.connectionInfo.get(connectionId);
    if (info) {
      const userConnections = this.connections.get(info.userId);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.connections.delete(info.userId);
        }
      }
      this.connectionInfo.delete(connectionId);
      console.log(`[NotificationEmitter] Connection unregistered: ${connectionId}`);
    }
  }

  /**
   * Emit notification to a specific user
   * All of their connected clients will receive it
   */
  emitToUser(userId: string, notification: NotificationPayload): void {
    const userConnections = this.connections.get(userId);
    if (userConnections && userConnections.size > 0) {
      userConnections.forEach((connectionId) => {
        this.emit(`notification:${connectionId}`, notification);
      });
      console.log(`[NotificationEmitter] Sent to user ${userId}: ${notification.type}`);
    } else {
      console.log(`[NotificationEmitter] User ${userId} not connected, notification queued in DB`);
    }
  }

  /**
   * Emit notification to all users with a specific role
   */
  emitToRole(role: UserRole, notification: NotificationPayload): void {
    let sentCount = 0;
    this.connectionInfo.forEach((info, connectionId) => {
      if (info.role === role) {
        this.emit(`notification:${connectionId}`, notification);
        sentCount++;
      }
    });
    console.log(`[NotificationEmitter] Sent to role ${role}: ${sentCount} connections`);
  }

  /**
   * Emit notification to all connected users
   */
  broadcast(notification: NotificationPayload): void {
    this.connectionInfo.forEach((_, connectionId) => {
      this.emit(`notification:${connectionId}`, notification);
    });
    console.log(`[NotificationEmitter] Broadcast to ${this.connectionInfo.size} connections`);
  }

  /**
   * Check if a user has any active connections
   */
  isUserConnected(userId: string): boolean {
    const connections = this.connections.get(userId);
    return !!connections && connections.size > 0;
  }

  /**
   * Get connection count for a user
   */
  getUserConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  /**
   * Get total active connections
   */
  getTotalConnections(): number {
    return this.connectionInfo.size;
  }

  /**
   * Get stats about connections
   */
  getStats(): {
    totalConnections: number;
    uniqueUsers: number;
    connectionsByRole: Record<string, number>;
  } {
    const roleCount: Record<string, number> = {};
    this.connectionInfo.forEach((info) => {
      roleCount[info.role] = (roleCount[info.role] || 0) + 1;
    });

    return {
      totalConnections: this.connectionInfo.size,
      uniqueUsers: this.connections.size,
      connectionsByRole: roleCount,
    };
  }
}

// Export singleton instance
export const notificationEmitter = new NotificationEmitterClass();

// ============================================================
// Helper Functions
// ============================================================

/**
 * Create a notification payload with defaults
 */
export function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): NotificationPayload {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    title,
    message,
    data,
    createdAt: new Date(),
  };
}

/**
 * Emit a saved search match notification
 */
export function notifySavedSearchMatch(
  userId: string,
  searchName: string,
  newMatches: number,
  searchId: string
): void {
  const notification = createNotification(
    'SAVED_SEARCH_MATCH',
    'New Search Results',
    `Your saved search "${searchName}" found ${newMatches} new ${newMatches === 1 ? 'match' : 'matches'}`,
    { searchId, newMatches, searchName }
  );
  notificationEmitter.emitToUser(userId, notification);
}

/**
 * Emit a message received notification
 */
export function notifyMessageReceived(
  userId: string,
  senderName: string,
  subject: string,
  threadId: string
): void {
  const notification = createNotification(
    'MESSAGE_RECEIVED',
    'New Message',
    `${senderName}: ${subject}`,
    { threadId, senderName }
  );
  notificationEmitter.emitToUser(userId, notification);
}

/**
 * Emit a fund update notification
 */
export function notifyFundUpdate(
  userId: string,
  fundName: string,
  updateType: string,
  fundId: string
): void {
  const notification = createNotification(
    'FUND_UPDATE',
    'Fund Update',
    `${fundName}: ${updateType}`,
    { fundId, fundName, updateType }
  );
  notificationEmitter.emitToUser(userId, notification);
}

/**
 * Emit a system alert to admins
 */
export function notifyAdmins(title: string, message: string, data?: Record<string, unknown>): void {
  const notification = createNotification('SYSTEM_ALERT', title, message, data);
  notificationEmitter.emitToRole('ADMIN', notification);
  notificationEmitter.emitToRole('SUPER_ADMIN', notification);
}
