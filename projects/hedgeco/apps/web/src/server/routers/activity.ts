// Activity router - Activity feed from follows

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { ActivityAction, EntityType, FollowTargetType } from '@prisma/client';

export const activityRouter = router({
  /**
   * Get aggregated activity feed from followed entities
   */
  getFeed: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      // Get user's follows
      const follows = await ctx.prisma.follow.findMany({
        where: { followerId: ctx.user.sub },
        select: { targetType: true, targetId: true },
      });

      if (follows.length === 0) {
        return { activities: [], nextCursor: undefined };
      }

      // Build OR conditions for activity query
      const orConditions = follows.map((f) => {
        switch (f.targetType) {
          case 'FUND':
            return { entityType: 'FUND' as EntityType, entityId: f.targetId };
          case 'MANAGER':
            return { userId: f.targetId };
          case 'PROVIDER':
            return { entityType: 'PROVIDER' as EntityType, entityId: f.targetId };
          default:
            return null;
        }
      }).filter(Boolean);

      // Get activities from followed entities
      const activities = await ctx.prisma.userActivity.findMany({
        where: {
          OR: orConditions as any[],
          // Exclude the user's own activities
          NOT: { userId: ctx.user.sub },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (activities.length > limit) {
        const next = activities.pop();
        nextCursor = next?.id;
      }

      // Enrich activities with entity details
      const enriched = await Promise.all(
        activities.map(async (activity) => {
          const entity = await getEntityDetails(
            ctx.prisma,
            activity.entityType,
            activity.entityId
          );
          return {
            id: activity.id,
            action: activity.action,
            entityType: activity.entityType,
            entityId: activity.entityId,
            entity,
            user: activity.user,
            metadata: activity.metadata,
            createdAt: activity.createdAt,
          };
        })
      );

      return { activities: enriched, nextCursor };
    }),

  /**
   * Get specific user's public activity
   */
  getUserActivity: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input;

      // Only show public activities (views, saves - not contacts/messages)
      const publicActions: ActivityAction[] = ['VIEW', 'SEARCH', 'SAVE', 'SHARE'];

      const activities = await ctx.prisma.userActivity.findMany({
        where: {
          userId,
          action: { in: publicActions },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (activities.length > limit) {
        const next = activities.pop();
        nextCursor = next?.id;
      }

      // Enrich with entity details
      const enriched = await Promise.all(
        activities.map(async (activity) => {
          const entity = await getEntityDetails(
            ctx.prisma,
            activity.entityType,
            activity.entityId
          );
          return {
            id: activity.id,
            action: activity.action,
            entityType: activity.entityType,
            entityId: activity.entityId,
            entity,
            metadata: activity.metadata,
            createdAt: activity.createdAt,
          };
        })
      );

      return { activities: enriched, nextCursor };
    }),

  /**
   * Log user activity (internal use)
   */
  logActivity: protectedProcedure
    .input(
      z.object({
        action: z.nativeEnum(ActivityAction),
        entityType: z.nativeEnum(EntityType),
        entityId: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        },
      });

      return { id: activity.id };
    }),

  /**
   * Get activity stats for a user
   */
  getActivityStats: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(), // Optional: defaults to current user
        period: z.enum(['week', 'month', 'year']).default('month'),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user.sub;
      const periodStart = getPeriodStart(input.period);

      // Activity breakdown by action
      const byAction = await ctx.prisma.userActivity.groupBy({
        by: ['action'],
        where: {
          userId,
          createdAt: { gte: periodStart },
        },
        _count: true,
      });

      // Activity breakdown by entity type
      const byEntityType = await ctx.prisma.userActivity.groupBy({
        by: ['entityType'],
        where: {
          userId,
          createdAt: { gte: periodStart },
        },
        _count: true,
      });

      // Total activity count
      const total = await ctx.prisma.userActivity.count({
        where: {
          userId,
          createdAt: { gte: periodStart },
        },
      });

      // Daily activity trend
      const dailyActivity = await ctx.prisma.$queryRaw<
        { date: Date; count: bigint }[]
      >`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM "UserActivity"
        WHERE user_id = ${userId}
          AND created_at >= ${periodStart}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      return {
        total,
        byAction: byAction.reduce((acc, item) => {
          acc[item.action] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byEntityType: byEntityType.reduce((acc, item) => {
          acc[item.entityType] = item._count;
          return acc;
        }, {} as Record<string, number>),
        dailyTrend: dailyActivity.map((d) => ({
          date: d.date.toISOString().split('T')[0],
          count: Number(d.count),
        })),
      };
    }),

  /**
   * Get recent activity summary for dashboard
   */
  getRecentSummary: protectedProcedure.query(async ({ ctx }) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get follows
    const follows = await ctx.prisma.follow.findMany({
      where: { followerId: ctx.user.sub },
      select: { targetType: true, targetId: true },
    });

    // Count new activities from follows
    const newFromFollows = follows.length > 0
      ? await ctx.prisma.userActivity.count({
          where: {
            OR: follows.map((f) => {
              switch (f.targetType) {
                case 'FUND':
                  return { entityType: 'FUND' as EntityType, entityId: f.targetId };
                case 'MANAGER':
                  return { userId: f.targetId };
                case 'PROVIDER':
                  return { entityType: 'PROVIDER' as EntityType, entityId: f.targetId };
                default:
                  return {};
              }
            }).filter(Boolean) as any[],
            NOT: { userId: ctx.user.sub },
            createdAt: { gte: oneDayAgo },
          },
        })
      : 0;

    // User's own activity counts
    const userActivityToday = await ctx.prisma.userActivity.count({
      where: {
        userId: ctx.user.sub,
        createdAt: { gte: oneDayAgo },
      },
    });

    const userActivityWeek = await ctx.prisma.userActivity.count({
      where: {
        userId: ctx.user.sub,
        createdAt: { gte: oneWeekAgo },
      },
    });

    return {
      newFromFollows,
      userActivityToday,
      userActivityWeek,
      followingCount: follows.length,
    };
  }),
});

// Helper: Get entity details
async function getEntityDetails(
  prisma: any,
  entityType: EntityType,
  entityId?: string | null
) {
  if (!entityId) return null;

  switch (entityType) {
    case 'FUND':
      return prisma.fund.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          strategy: true,
        },
      });
    case 'PROVIDER':
      return prisma.serviceProvider.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          companyName: true,
          slug: true,
          category: true,
        },
      });
    case 'CONFERENCE':
      return prisma.conference.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          name: true,
          slug: true,
          startDate: true,
        },
      });
    case 'DOCUMENT':
      return prisma.fundDocument.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          title: true,
          documentType: true,
        },
      });
    default:
      return null;
  }
}

// Helper: Get period start date
function getPeriodStart(period: 'week' | 'month' | 'year'): Date {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
}
