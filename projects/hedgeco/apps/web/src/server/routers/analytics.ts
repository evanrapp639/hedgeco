// Analytics Router - Platform analytics and event tracking
// Sprint 5: Analytics Collection API

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// Event types for tracking
const EventTypeSchema = z.enum([
  'PAGE_VIEW',
  'FUND_VIEW',
  'FUND_SEARCH',
  'FUND_INQUIRY',
  'FUND_SAVE',
  'FUND_DOWNLOAD',
  'FUND_COMPARE',
  'PROVIDER_VIEW',
  'PROVIDER_CONTACT',
  'CONFERENCE_VIEW',
  'USER_LOGIN',
  'USER_SIGNUP',
  'USER_PROFILE_UPDATE',
  'SUBSCRIPTION_UPGRADE',
  'SUBSCRIPTION_CANCEL',
]);

export const analyticsRouter = router({
  /**
   * Track a generic analytics event
   */
  trackEvent: protectedProcedure
    .input(
      z.object({
        type: EventTypeSchema,
        data: z.record(z.string(), z.unknown()).optional(),
        entityType: z.enum(['FUND', 'PROVIDER', 'CONFERENCE', 'DOCUMENT', 'SEARCH']).optional(),
        entityId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      // Map event type to activity action
      const actionMap: Record<string, 'VIEW' | 'SEARCH' | 'FILTER' | 'CONTACT' | 'SAVE' | 'DOWNLOAD' | 'SHARE' | 'COMPARE'> = {
        PAGE_VIEW: 'VIEW',
        FUND_VIEW: 'VIEW',
        FUND_SEARCH: 'SEARCH',
        FUND_INQUIRY: 'CONTACT',
        FUND_SAVE: 'SAVE',
        FUND_DOWNLOAD: 'DOWNLOAD',
        FUND_COMPARE: 'COMPARE',
        PROVIDER_VIEW: 'VIEW',
        PROVIDER_CONTACT: 'CONTACT',
        CONFERENCE_VIEW: 'VIEW',
        USER_LOGIN: 'VIEW',
        USER_SIGNUP: 'VIEW',
        USER_PROFILE_UPDATE: 'VIEW',
        SUBSCRIPTION_UPGRADE: 'VIEW',
        SUBSCRIPTION_CANCEL: 'VIEW',
      };

      await prisma.userActivity.create({
        data: {
          userId: user.sub,
          action: actionMap[input.type] || 'VIEW',
          entityType: input.entityType || 'FUND',
          entityId: input.entityId,
          metadata: input.data ? {
            eventType: input.type,
            ...(input.data as Record<string, unknown>),
          } : { eventType: input.type },
        },
      });

      return { success: true };
    }),

  /**
   * Get analytics for a specific fund
   */
  getFundAnalytics: protectedProcedure
    .input(
      z.object({
        fundId: z.string(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma, user } = ctx;

      // Verify user has access to this fund's analytics (must be manager or admin)
      const fund = await prisma.fund.findUnique({
        where: { id: input.fundId },
        select: { managerId: true },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      if (fund.managerId !== user.sub && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this fund\'s analytics',
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Get view count
      const views = await prisma.userActivity.count({
        where: {
          entityType: 'FUND',
          entityId: input.fundId,
          action: 'VIEW',
          createdAt: { gte: startDate },
        },
      });

      // Get inquiry count
      const inquiries = await prisma.fundInquiry.count({
        where: {
          fundId: input.fundId,
          createdAt: { gte: startDate },
        },
      });

      // Get saves (watchlist adds)
      const saves = await prisma.watchlist.count({
        where: {
          fundId: input.fundId,
          addedAt: { gte: startDate },
        },
      });

      // Get total watchlist count
      const totalWatchlist = await prisma.watchlist.count({
        where: { fundId: input.fundId },
      });

      // Get document downloads
      const downloads = await prisma.userActivity.count({
        where: {
          entityType: 'DOCUMENT',
          action: 'DOWNLOAD',
          metadata: {
            path: ['fundId'],
            equals: input.fundId,
          },
          createdAt: { gte: startDate },
        },
      });

      // Get daily views for chart
      const dailyViews = await prisma.userActivity.groupBy({
        by: ['createdAt'],
        where: {
          entityType: 'FUND',
          entityId: input.fundId,
          action: 'VIEW',
          createdAt: { gte: startDate },
        },
        _count: true,
      });

      // Get unique viewers
      const uniqueViewers = await prisma.userActivity.findMany({
        where: {
          entityType: 'FUND',
          entityId: input.fundId,
          action: 'VIEW',
          createdAt: { gte: startDate },
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      return {
        period: input.days,
        views,
        uniqueViewers: uniqueViewers.length,
        inquiries,
        saves,
        totalWatchlist,
        downloads,
        dailyViews: dailyViews.map((d) => ({
          date: d.createdAt,
          count: d._count,
        })),
      };
    }),

  /**
   * Get search analytics - popular searches and trends
   */
  getSearchAnalytics: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Get total searches
      const totalSearches = await prisma.searchQuery.count({
        where: { createdAt: { gte: startDate } },
      });

      // Get search type breakdown
      const searchTypeBreakdown = await prisma.searchQuery.groupBy({
        by: ['searchType'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      });

      // Get popular search queries
      const popularQueries = await prisma.searchQuery.groupBy({
        by: ['query'],
        where: {
          createdAt: { gte: startDate },
          query: { not: '' },
        },
        _count: true,
        orderBy: { _count: { query: 'desc' } },
        take: 20,
      });

      // Get average latency
      const latencyStats = await prisma.searchQuery.aggregate({
        where: {
          createdAt: { gte: startDate },
          latencyMs: { not: null },
        },
        _avg: { latencyMs: true },
        _max: { latencyMs: true },
        _min: { latencyMs: true },
      });

      // Get searches by day
      const dailySearches = await prisma.searchQuery.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      });

      return {
        period: input.days,
        totalSearches,
        searchTypeBreakdown: searchTypeBreakdown.map((s) => ({
          type: s.searchType,
          count: s._count,
        })),
        popularQueries: popularQueries.map((q) => ({
          query: q.query,
          count: q._count,
        })),
        latency: {
          avg: latencyStats._avg.latencyMs,
          max: latencyStats._max.latencyMs,
          min: latencyStats._min.latencyMs,
        },
        dailySearches: dailySearches.map((d) => ({
          date: d.createdAt,
          count: d._count,
        })),
      };
    }),

  /**
   * Get user engagement metrics
   */
  getUserEngagement: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma, user } = ctx;

      // Users can only view their own engagement unless admin
      const targetUserId = input.userId || user.sub;
      if (targetUserId !== user.sub && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only view your own engagement metrics',
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Get activity breakdown
      const activityBreakdown = await prisma.userActivity.groupBy({
        by: ['action'],
        where: {
          userId: targetUserId,
          createdAt: { gte: startDate },
        },
        _count: true,
      });

      // Get total activities
      const totalActivities = await prisma.userActivity.count({
        where: {
          userId: targetUserId,
          createdAt: { gte: startDate },
        },
      });

      // Get funds viewed
      const fundsViewed = await prisma.userActivity.findMany({
        where: {
          userId: targetUserId,
          entityType: 'FUND',
          action: 'VIEW',
          createdAt: { gte: startDate },
        },
        select: { entityId: true },
        distinct: ['entityId'],
      });

      // Get watchlist count
      const watchlistCount = await prisma.watchlist.count({
        where: { userId: targetUserId },
      });

      // Get inquiries sent
      const inquiriesSent = await prisma.fundInquiry.count({
        where: {
          investorId: targetUserId,
          createdAt: { gte: startDate },
        },
      });

      // Get saved searches
      const savedSearches = await prisma.savedSearch.count({
        where: { userId: targetUserId },
      });

      // Get daily activity
      const dailyActivity = await prisma.userActivity.groupBy({
        by: ['createdAt'],
        where: {
          userId: targetUserId,
          createdAt: { gte: startDate },
        },
        _count: true,
      });

      return {
        period: input.days,
        totalActivities,
        activityBreakdown: activityBreakdown.map((a) => ({
          action: a.action,
          count: a._count,
        })),
        fundsViewed: fundsViewed.length,
        watchlistCount,
        inquiriesSent,
        savedSearches,
        dailyActivity: dailyActivity.map((d) => ({
          date: d.createdAt,
          count: d._count,
        })),
      };
    }),

  /**
   * Get overall platform statistics (admin only)
   */
  getPlatformStats: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const days = input?.days ?? 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user counts
      const totalUsers = await prisma.user.count();
      const newUsers = await prisma.user.count({
        where: { createdAt: { gte: startDate } },
      });
      const activeUsers = await prisma.userActivity.findMany({
        where: { createdAt: { gte: startDate } },
        select: { userId: true },
        distinct: ['userId'],
      });

      // Get fund counts
      const totalFunds = await prisma.fund.count({
        where: { status: 'APPROVED', visible: true },
      });
      const newFunds = await prisma.fund.count({
        where: {
          status: 'APPROVED',
          visible: true,
          createdAt: { gte: startDate },
        },
      });

      // Get provider counts
      const totalProviders = await prisma.serviceProvider.count({
        where: { status: 'APPROVED', visible: true },
      });

      // Get subscription breakdown
      const subscriptionBreakdown = await prisma.subscription.groupBy({
        by: ['plan'],
        _count: true,
      });

      // Get total revenue (from subscription count - actual revenue would come from Stripe)
      const paidSubscriptions = await prisma.subscription.count({
        where: {
          plan: { not: 'FREE' },
          status: 'ACTIVE',
        },
      });

      // Get inquiry stats
      const totalInquiries = await prisma.fundInquiry.count({
        where: { createdAt: { gte: startDate } },
      });

      // Get search stats
      const totalSearches = await prisma.searchQuery.count({
        where: { createdAt: { gte: startDate } },
      });

      // Get user role breakdown
      const userRoleBreakdown = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
      });

      return {
        period: days,
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers.length,
        },
        funds: {
          total: totalFunds,
          new: newFunds,
        },
        providers: {
          total: totalProviders,
        },
        subscriptions: {
          breakdown: subscriptionBreakdown.map((s) => ({
            plan: s.plan,
            count: s._count,
          })),
          paidActive: paidSubscriptions,
        },
        activity: {
          inquiries: totalInquiries,
          searches: totalSearches,
        },
        userRoles: userRoleBreakdown.map((r) => ({
          role: r.role,
          count: r._count,
        })),
      };
    }),
});
