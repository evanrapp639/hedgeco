// Admin Analytics router - Platform-wide metrics and analytics

import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { Prisma } from '@prisma/client';

const periodSchema = z.enum(['day', 'week', 'month', 'quarter', 'year']);

type Period = z.infer<typeof periodSchema>;

function getPeriodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
}

export const adminAnalyticsRouter = router({
  /**
   * Get user metrics - signups, active users, retention
   */
  getUserMetrics: adminProcedure
    .input(z.object({ period: periodSchema }))
    .query(async ({ ctx, input }) => {
      const periodStart = getPeriodStart(input.period);
      const previousPeriodStart = new Date(
        periodStart.getTime() - (Date.now() - periodStart.getTime())
      );

      // New signups in period
      const newSignups = await ctx.prisma.user.count({
        where: { createdAt: { gte: periodStart } },
      });

      // Previous period signups for comparison
      const previousSignups = await ctx.prisma.user.count({
        where: {
          createdAt: { gte: previousPeriodStart, lt: periodStart },
        },
      });

      // Active users (users with sessions in period)
      const activeUsers = await ctx.prisma.session.groupBy({
        by: ['userId'],
        where: { lastActiveAt: { gte: periodStart } },
      });

      // Total users
      const totalUsers = await ctx.prisma.user.count();

      // Users by role
      const usersByRole = await ctx.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      });

      // Verified vs unverified
      const verifiedUsers = await ctx.prisma.user.count({
        where: { emailVerified: { not: null } },
      });

      // Daily signups for trend (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dailySignups = await ctx.prisma.$queryRaw<
        { date: Date; count: bigint }[]
      >`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM "User"
        WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      // Calculate retention (users who logged in again after signup)
      const returningUsers = await ctx.prisma.user.count({
        where: {
          createdAt: { gte: periodStart },
          sessions: { some: {} },
        },
      });

      const retentionRate = newSignups > 0 ? (returningUsers / newSignups) * 100 : 0;

      return {
        newSignups,
        signupGrowth: previousSignups > 0
          ? ((newSignups - previousSignups) / previousSignups) * 100
          : 0,
        activeUsers: activeUsers.length,
        totalUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        retentionRate,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>),
        dailySignups: dailySignups.map((d) => ({
          date: d.date.toISOString().split('T')[0],
          count: Number(d.count),
        })),
      };
    }),

  /**
   * Get revenue metrics - MRR, churn, LTV
   */
  getRevenueMetrics: adminProcedure
    .input(z.object({ period: periodSchema }))
    .query(async ({ ctx, input }) => {
      const periodStart = getPeriodStart(input.period);

      // Active subscriptions by plan
      const subscriptionsByPlan = await ctx.prisma.subscription.groupBy({
        by: ['plan'],
        where: { status: 'ACTIVE' },
        _count: true,
      });

      // Subscription statuses
      const subscriptionsByStatus = await ctx.prisma.subscription.groupBy({
        by: ['status'],
        _count: true,
      });

      // New subscriptions in period
      const newSubscriptions = await ctx.prisma.subscription.count({
        where: {
          createdAt: { gte: periodStart },
          status: 'ACTIVE',
        },
      });

      // Churned (canceled) in period
      const churned = await ctx.prisma.subscription.count({
        where: {
          status: 'CANCELED',
          updatedAt: { gte: periodStart },
        },
      });

      // Calculate MRR (assuming pricing tiers)
      const planPricing: Record<string, number> = {
        FREE: 0,
        BASIC: 49,
        PRO: 199,
        ENTERPRISE: 499,
      };

      const mrr = subscriptionsByPlan.reduce((total, sub) => {
        return total + (planPricing[sub.plan] || 0) * sub._count;
      }, 0);

      // Total active subscribers
      const totalActive = await ctx.prisma.subscription.count({
        where: { status: 'ACTIVE' },
      });

      // Churn rate
      const churnRate = totalActive > 0 ? (churned / totalActive) * 100 : 0;

      // Average revenue per user (ARPU)
      const arpu = totalActive > 0 ? mrr / totalActive : 0;

      // Simple LTV calculation (ARPU / churn rate)
      const monthlyChurnRate = churnRate / (input.period === 'month' ? 1 : 
        input.period === 'quarter' ? 3 : input.period === 'year' ? 12 : 1);
      const ltv = monthlyChurnRate > 0 ? arpu / (monthlyChurnRate / 100) : arpu * 24;

      return {
        mrr,
        arr: mrr * 12,
        newSubscriptions,
        churned,
        churnRate,
        arpu,
        ltv,
        totalActiveSubscriptions: totalActive,
        subscriptionsByPlan: subscriptionsByPlan.reduce((acc, item) => {
          acc[item.plan] = item._count;
          return acc;
        }, {} as Record<string, number>),
        subscriptionsByStatus: subscriptionsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      };
    }),

  /**
   * Get engagement metrics - searches, views, inquiries
   */
  getEngagementMetrics: adminProcedure
    .input(z.object({ period: periodSchema }))
    .query(async ({ ctx, input }) => {
      const periodStart = getPeriodStart(input.period);

      // Search events
      const totalSearches = await ctx.prisma.searchEvent.count({
        where: { createdAt: { gte: periodStart } },
      });

      // Searches with clicks
      const searchesWithClicks = await ctx.prisma.searchEvent.count({
        where: {
          createdAt: { gte: periodStart },
          clickedFundId: { not: null },
        },
      });

      // Fund views
      const fundViews = await ctx.prisma.fundView.count({
        where: { createdAt: { gte: periodStart } },
      });

      // Unique fund viewers
      const uniqueViewers = await ctx.prisma.fundView.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: periodStart },
          userId: { not: null },
        },
      });

      // Fund inquiries
      const inquiries = await ctx.prisma.fundInquiry.count({
        where: { createdAt: { gte: periodStart } },
      });

      // Messages sent
      const messagesSent = await ctx.prisma.message.count({
        where: { createdAt: { gte: periodStart } },
      });

      // Documents downloaded (from user activity)
      const downloads = await ctx.prisma.userActivity.count({
        where: {
          action: 'DOWNLOAD',
          createdAt: { gte: periodStart },
        },
      });

      // Watchlist additions
      const watchlistAdds = await ctx.prisma.watchlist.count({
        where: { addedAt: { gte: periodStart } },
      });

      // Click-through rate
      const ctr = totalSearches > 0 ? (searchesWithClicks / totalSearches) * 100 : 0;

      // Daily engagement trend
      const dailyViews = await ctx.prisma.$queryRaw<
        { date: Date; count: bigint }[]
      >`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM "FundView"
        WHERE created_at >= ${periodStart}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      return {
        totalSearches,
        searchesWithClicks,
        clickThroughRate: ctr,
        fundViews,
        uniqueViewers: uniqueViewers.length,
        inquiries,
        messagesSent,
        downloads,
        watchlistAdds,
        dailyViews: dailyViews.map((d) => ({
          date: d.date.toISOString().split('T')[0],
          count: Number(d.count),
        })),
      };
    }),

  /**
   * Get fund metrics - new funds, updates, top viewed
   */
  getFundMetrics: adminProcedure
    .input(z.object({ period: periodSchema }))
    .query(async ({ ctx, input }) => {
      const periodStart = getPeriodStart(input.period);

      // New funds
      const newFunds = await ctx.prisma.fund.count({
        where: { createdAt: { gte: periodStart } },
      });

      // Funds by status
      const fundsByStatus = await ctx.prisma.fund.groupBy({
        by: ['status'],
        _count: true,
      });

      // Funds by type
      const fundsByType = await ctx.prisma.fund.groupBy({
        by: ['type'],
        _count: true,
      });

      // Top viewed funds
      const topViewed = await ctx.prisma.fundView.groupBy({
        by: ['fundId'],
        where: { createdAt: { gte: periodStart } },
        _count: true,
        orderBy: { _count: { fundId: 'desc' } },
        take: 10,
      });

      // Enrich with fund details
      const topViewedWithDetails = await Promise.all(
        topViewed.map(async (item) => {
          const fund = await ctx.prisma.fund.findUnique({
            where: { id: item.fundId },
            select: { id: true, name: true, slug: true, type: true },
          });
          return { fund, views: item._count };
        })
      );

      // Most inquired funds
      const mostInquired = await ctx.prisma.fundInquiry.groupBy({
        by: ['fundId'],
        where: { createdAt: { gte: periodStart } },
        _count: true,
        orderBy: { _count: { fundId: 'desc' } },
        take: 10,
      });

      const mostInquiredWithDetails = await Promise.all(
        mostInquired.map(async (item) => {
          const fund = await ctx.prisma.fund.findUnique({
            where: { id: item.fundId },
            select: { id: true, name: true, slug: true, type: true },
          });
          return { fund, inquiries: item._count };
        })
      );

      // Return data updates
      const returnUpdates = await ctx.prisma.fundReturn.count({
        where: { createdAt: { gte: periodStart } },
      });

      // Total AUM (across all funds)
      const aumResult = await ctx.prisma.fund.aggregate({
        _sum: { aum: true },
        where: { status: 'APPROVED', visible: true },
      });

      return {
        newFunds,
        totalFunds: await ctx.prisma.fund.count(),
        returnUpdates,
        totalAum: aumResult._sum.aum?.toNumber() || 0,
        fundsByStatus: fundsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        fundsByType: fundsByType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        topViewedFunds: topViewedWithDetails,
        mostInquiredFunds: mostInquiredWithDetails,
      };
    }),

  /**
   * Get top search terms
   */
  getTopSearches: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        period: periodSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const periodStart = input.period ? getPeriodStart(input.period) : undefined;

      const topSearches = await ctx.prisma.searchEvent.groupBy({
        by: ['query'],
        where: periodStart ? { createdAt: { gte: periodStart } } : undefined,
        _count: true,
        orderBy: { _count: { query: 'desc' } },
        take: input.limit,
      });

      // Calculate click rates per term
      const enriched = await Promise.all(
        topSearches.map(async (item) => {
          const withClicks = await ctx.prisma.searchEvent.count({
            where: {
              query: item.query,
              clickedFundId: { not: null },
              ...(periodStart && { createdAt: { gte: periodStart } }),
            },
          });
          return {
            query: item.query,
            count: item._count,
            clickRate: item._count > 0 ? (withClicks / item._count) * 100 : 0,
          };
        })
      );

      return { topSearches: enriched };
    }),

  /**
   * Get geographic distribution of users
   */
  getGeographicDistribution: adminProcedure.query(async ({ ctx }) => {
    // Users by country
    const usersByCountry = await ctx.prisma.profile.groupBy({
      by: ['country'],
      _count: true,
      orderBy: { _count: { country: 'desc' } },
    });

    // Users by state (US only)
    const usersByState = await ctx.prisma.profile.groupBy({
      by: ['state'],
      where: { country: 'US', state: { not: null } },
      _count: true,
      orderBy: { _count: { state: 'desc' } },
    });

    // Sessions by country (from login IP geolocation)
    const sessionsByCountry = await ctx.prisma.session.groupBy({
      by: ['country'],
      where: { country: { not: null } },
      _count: true,
      orderBy: { _count: { country: 'desc' } },
    });

    return {
      usersByCountry: usersByCountry
        .filter((c) => c.country)
        .map((c) => ({ country: c.country!, count: c._count })),
      usersByState: usersByState
        .filter((s) => s.state)
        .map((s) => ({ state: s.state!, count: s._count })),
      sessionsByCountry: sessionsByCountry
        .filter((c) => c.country)
        .map((c) => ({ country: c.country!, count: c._count })),
    };
  }),
});
