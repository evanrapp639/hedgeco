// Message router - Internal messaging system

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

export const messageRouter = router({
  /**
   * Get inbox - list of message threads for current user
   */
  getInbox: protectedProcedure
    .input(
      z.object({
        archived: z.boolean().default(false),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { archived, cursor, limit } = input;
      const userId = ctx.user.sub;

      // Get distinct thread IDs where user is sender or recipient
      // Group by threadId and get latest message per thread
      const threads = await ctx.prisma.$queryRaw<
        Array<{
          threadId: string;
          subject: string | null;
          lastMessageAt: Date;
          lastBody: string;
          otherUserId: string;
          otherUserName: string;
          unreadCount: bigint;
        }>
      >`
        WITH thread_messages AS (
          SELECT 
            m."threadId",
            m.subject,
            m.body,
            m."createdAt",
            m."senderId",
            m."recipientId",
            m.read,
            ROW_NUMBER() OVER (PARTITION BY m."threadId" ORDER BY m."createdAt" DESC) as rn
          FROM "Message" m
          WHERE (m."senderId" = ${userId} OR m."recipientId" = ${userId})
            AND m.deleted = false
            AND m.archived = ${archived}
        ),
        latest AS (
          SELECT * FROM thread_messages WHERE rn = 1
        ),
        unread_counts AS (
          SELECT "threadId", COUNT(*) as unread
          FROM "Message"
          WHERE "recipientId" = ${userId}
            AND read = false
            AND deleted = false
          GROUP BY "threadId"
        )
        SELECT 
          l."threadId",
          l.subject,
          l."createdAt" as "lastMessageAt",
          l.body as "lastBody",
          CASE 
            WHEN l."senderId" = ${userId} THEN l."recipientId"
            ELSE l."senderId"
          END as "otherUserId",
          COALESCE(p."firstName" || ' ' || p."lastName", u.email) as "otherUserName",
          COALESCE(uc.unread, 0) as "unreadCount"
        FROM latest l
        LEFT JOIN unread_counts uc ON l."threadId" = uc."threadId"
        LEFT JOIN "User" u ON u.id = CASE 
          WHEN l."senderId" = ${userId} THEN l."recipientId"
          ELSE l."senderId"
        END
        LEFT JOIN "Profile" p ON p."userId" = u.id
        ORDER BY l."createdAt" DESC
        LIMIT ${limit + 1}
        ${cursor ? Prisma.sql`OFFSET ${parseInt(cursor)}` : Prisma.sql``}
      `;

      let nextCursor: string | undefined = undefined;
      if (threads.length > limit) {
        threads.pop();
        nextCursor = String((cursor ? parseInt(cursor) : 0) + limit);
      }

      return {
        threads: threads.map((t) => ({
          ...t,
          unreadCount: Number(t.unreadCount),
          lastBody: t.lastBody.substring(0, 100) + (t.lastBody.length > 100 ? '...' : ''),
        })),
        nextCursor,
      };
    }),

  /**
   * Get full conversation thread
   */
  getThread: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { threadId, cursor, limit } = input;
      const userId = ctx.user.sub;

      // Verify user has access to this thread
      const hasAccess = await ctx.prisma.message.findFirst({
        where: {
          threadId,
          OR: [{ senderId: userId }, { recipientId: userId }],
        },
      });

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this thread',
        });
      }

      const messages = await ctx.prisma.message.findMany({
        where: {
          threadId,
          deleted: false,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              fileSize: true,
              mimeType: true,
            },
          },
        },
      });

      // Mark messages as read
      await ctx.prisma.message.updateMany({
        where: {
          threadId,
          recipientId: userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      let nextCursor: string | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem!.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),

  /**
   * Send a new message (starts new thread)
   */
  send: protectedProcedure
    .input(
      z.object({
        toUserId: z.string(),
        subject: z.string().min(1).max(255),
        body: z.string().min(1),
        relatedFundId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { toUserId, subject, body, relatedFundId } = input;
      const senderId = ctx.user.sub;

      // Verify recipient exists
      const recipient = await ctx.prisma.user.findUnique({
        where: { id: toUserId },
      });

      if (!recipient) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Recipient not found',
        });
      }

      // Check if sending to self
      if (toUserId === senderId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot send message to yourself',
        });
      }

      // Create message with new thread
      const message = await ctx.prisma.message.create({
        data: {
          senderId,
          recipientId: toUserId,
          subject,
          body,
          relatedFundId,
        },
        include: {
          sender: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      return message;
    }),

  /**
   * Reply to existing thread
   */
  reply: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        body: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { threadId, body } = input;
      const senderId = ctx.user.sub;

      // Get the original thread to determine recipient
      const threadMessage = await ctx.prisma.message.findFirst({
        where: {
          threadId,
          OR: [{ senderId }, { recipientId: senderId }],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!threadMessage) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Thread not found',
        });
      }

      // Determine recipient (the other person in the thread)
      const recipientId =
        threadMessage.senderId === senderId
          ? threadMessage.recipientId
          : threadMessage.senderId;

      const message = await ctx.prisma.message.create({
        data: {
          senderId,
          recipientId,
          threadId,
          parentId: threadMessage.id,
          subject: threadMessage.subject,
          body,
          relatedFundId: threadMessage.relatedFundId,
        },
        include: {
          sender: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      return message;
    }),

  /**
   * Mark message as read
   */
  markRead: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.prisma.message.findUnique({
        where: { id: input.messageId },
      });

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      if (message.recipientId !== ctx.user.sub) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Can only mark your own messages as read',
        });
      }

      const updated = await ctx.prisma.message.update({
        where: { id: input.messageId },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return updated;
    }),

  /**
   * Mark entire thread as read
   */
  markThreadRead: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.message.updateMany({
        where: {
          threadId: input.threadId,
          recipientId: ctx.user.sub,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return { markedRead: count.count };
    }),

  /**
   * Soft delete a message
   */
  delete: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.prisma.message.findUnique({
        where: { id: input.messageId },
      });

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      // Only sender or recipient can delete
      if (message.senderId !== ctx.user.sub && message.recipientId !== ctx.user.sub) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own messages',
        });
      }

      const updated = await ctx.prisma.message.update({
        where: { id: input.messageId },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      });

      return updated;
    }),

  /**
   * Archive a thread
   */
  archiveThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.message.updateMany({
        where: {
          threadId: input.threadId,
          OR: [{ senderId: ctx.user.sub }, { recipientId: ctx.user.sub }],
        },
        data: { archived: true },
      });

      return { archived: count.count };
    }),

  /**
   * Get unread count for current user
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.message.count({
      where: {
        recipientId: ctx.user.sub,
        read: false,
        deleted: false,
        archived: false,
      },
    });

    return { count };
  }),
});
