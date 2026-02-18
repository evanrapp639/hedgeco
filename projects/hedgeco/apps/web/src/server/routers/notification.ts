// Notification router - User notifications and preferences

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const notificationRouter = router({
  /**
   * List notifications with cursor-based pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, unreadOnly } = input;

      const notifications = await ctx.prisma.notification.findMany({
        where: {
          userId: ctx.user.sub,
          ...(unreadOnly ? { read: false } : {}),
        },
        take: limit + 1, // Fetch one extra to determine if there's a next page
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined = undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem!.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  /**
   * Mark a single notification as read
   */
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notification.userId !== ctx.user.sub) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot modify this notification',
        });
      }

      const updated = await ctx.prisma.notification.update({
        where: { id: input.id },
        data: { read: true },
      });

      return updated;
    }),

  /**
   * Mark all notifications as read
   */
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.prisma.notification.updateMany({
      where: {
        userId: ctx.user.sub,
        read: false,
      },
      data: { read: true },
    });

    return { count: result.count };
  }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      if (notification.userId !== ctx.user.sub) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot delete this notification',
        });
      }

      await ctx.prisma.notification.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get unread notification count (for badge)
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.notification.count({
      where: {
        userId: ctx.user.sub,
        read: false,
      },
    });

    return { count };
  }),

  /**
   * Get user's notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    let preferences = await ctx.prisma.notificationPreference.findUnique({
      where: { userId: ctx.user.sub },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await ctx.prisma.notificationPreference.create({
        data: {
          userId: ctx.user.sub,
        },
      });
    }

    return preferences;
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailMessages: z.boolean().optional(),
        emailFundUpdates: z.boolean().optional(),
        emailInquiries: z.boolean().optional(),
        emailMarketing: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const preferences = await ctx.prisma.notificationPreference.upsert({
        where: { userId: ctx.user.sub },
        update: input,
        create: {
          userId: ctx.user.sub,
          ...input,
        },
      });

      return preferences;
    }),

  /**
   * Create a notification (internal use - typically called by other services)
   * Requires admin or system-level access in production
   */
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: z.enum(['MESSAGE', 'FUND_UPDATE', 'INQUIRY', 'SUBSCRIPTION', 'SYSTEM', 'ALERT']),
        title: z.string(),
        message: z.string(),
        link: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // In production, restrict this to admin/system users
      // For now, allow creating notifications for the current user
      // or if the user is an admin
      if (input.userId !== ctx.user.sub && 
          ctx.user.role !== 'ADMIN' && 
          ctx.user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot create notifications for other users',
        });
      }

      const notification = await ctx.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
          metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        },
      });

      return notification;
    }),
});
