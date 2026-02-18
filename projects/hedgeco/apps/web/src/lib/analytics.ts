/**
 * Analytics Aggregation Module
 * Sprint 5: HedgeCo.Net
 *
 * Provides functions for aggregating views, searches,
 * and calculating engagement metrics.
 */

import { prisma } from "./prisma";
import { cacheMemoize, CacheKeys, CacheTTL } from "./cache";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type TimePeriod = "day" | "week" | "month" | "year";

export interface ViewAggregation {
  period: string;
  views: number;
  uniqueUsers: number;
  uniqueSessions: number;
}

export interface SearchAggregation {
  query: string;
  count: number;
  avgResultCount: number;
  clickThroughRate: number;
}

export interface EngagementScore {
  fundId: string;
  totalScore: number;
  viewScore: number;
  velocityScore: number;
  recencyScore: number;
  calculatedAt: Date;
}

export interface TrendingFund {
  fundId: string;
  name: string;
  score: number;
  viewCount: number;
  velocity: number;
  rank: number;
}

// --------------------------------------------------------------------------
// View Aggregation
// --------------------------------------------------------------------------

/**
 * Get period boundaries based on time period
 */
function getPeriodBoundaries(period: TimePeriod): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  switch (period) {
    case "day":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return { start, end };
}

/**
 * Aggregate fund views by period
 */
export async function aggregateFundViews(
  fundId: string,
  period: TimePeriod
): Promise<ViewAggregation[]> {
  const { start, end } = getPeriodBoundaries(period);

  // Get raw view data
  const views = await prisma.fundView.findMany({
    where: {
      fundId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      userId: true,
      sessionId: true,
      createdAt: true,
    },
  });

  // Group by date
  const grouped = new Map<
    string,
    {
      views: number;
      users: Set<string>;
      sessions: Set<string>;
    }
  >();

  for (const view of views) {
    const dateKey = view.createdAt.toISOString().split("T")[0];

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        views: 0,
        users: new Set(),
        sessions: new Set(),
      });
    }

    const bucket = grouped.get(dateKey)!;
    bucket.views++;
    if (view.userId) bucket.users.add(view.userId);
    if (view.sessionId) bucket.sessions.add(view.sessionId);
  }

  // Convert to array
  return Array.from(grouped.entries())
    .map(([date, data]) => ({
      period: date,
      views: data.views,
      uniqueUsers: data.users.size,
      uniqueSessions: data.sessions.size,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get total view count for a fund in a period
 */
export async function getFundViewCount(
  fundId: string,
  period: TimePeriod
): Promise<number> {
  const { start, end } = getPeriodBoundaries(period);

  return prisma.fundView.count({
    where: {
      fundId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });
}

// --------------------------------------------------------------------------
// Search Analytics
// --------------------------------------------------------------------------

/**
 * Aggregate popular search queries
 */
export async function aggregateSearchQueries(
  period: TimePeriod,
  limit: number = 50
): Promise<SearchAggregation[]> {
  const { start, end } = getPeriodBoundaries(period);

  // Get search events
  const searches = await prisma.searchEvent.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      query: true,
      resultCount: true,
      clickedFundId: true,
    },
  });

  // Group by normalized query
  const grouped = new Map<
    string,
    {
      count: number;
      totalResults: number;
      clicks: number;
    }
  >();

  for (const search of searches) {
    const normalizedQuery = search.query.toLowerCase().trim();

    if (!grouped.has(normalizedQuery)) {
      grouped.set(normalizedQuery, {
        count: 0,
        totalResults: 0,
        clicks: 0,
      });
    }

    const bucket = grouped.get(normalizedQuery)!;
    bucket.count++;
    bucket.totalResults += search.resultCount;
    if (search.clickedFundId) bucket.clicks++;
  }

  // Convert and sort by count
  return Array.from(grouped.entries())
    .map(([query, data]) => ({
      query,
      count: data.count,
      avgResultCount: data.count > 0 ? data.totalResults / data.count : 0,
      clickThroughRate: data.count > 0 ? data.clicks / data.count : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// --------------------------------------------------------------------------
// Engagement Scoring
// --------------------------------------------------------------------------

/**
 * Calculate engagement score for a fund
 *
 * Score components:
 * - View score: Raw view count (normalized)
 * - Velocity score: Rate of change in views
 * - Recency score: Weight recent activity higher
 */
export async function calculateEngagementScore(
  fundId: string
): Promise<EngagementScore> {
  const now = new Date();

  // Get views from last 30 days
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const views = await prisma.fundView.findMany({
    where: {
      fundId,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Calculate view score (log scale to prevent outliers from dominating)
  const totalViews = views.length;
  const viewScore = totalViews > 0 ? Math.log10(totalViews + 1) * 20 : 0;

  // Calculate velocity (views in last 7 days vs previous 7 days)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const recentViews = views.filter((v) => v.createdAt >= sevenDaysAgo).length;
  const previousViews = views.filter(
    (v) => v.createdAt >= fourteenDaysAgo && v.createdAt < sevenDaysAgo
  ).length;

  let velocityScore = 0;
  if (previousViews > 0) {
    const velocityRatio = recentViews / previousViews;
    velocityScore = Math.min(velocityRatio * 10, 30); // Cap at 30
  } else if (recentViews > 0) {
    velocityScore = 20; // New activity where there was none
  }

  // Calculate recency score (exponential decay)
  let recencyScore = 0;
  if (views.length > 0) {
    const mostRecent = views[views.length - 1];
    const hoursSinceLastView =
      (now.getTime() - mostRecent.createdAt.getTime()) / (1000 * 60 * 60);

    // Decay factor: score drops by half every 24 hours
    recencyScore = 30 * Math.exp(-hoursSinceLastView / 24);
  }

  const totalScore = viewScore + velocityScore + recencyScore;

  return {
    fundId,
    totalScore,
    viewScore,
    velocityScore,
    recencyScore,
    calculatedAt: now,
  };
}

// --------------------------------------------------------------------------
// Trending Funds
// --------------------------------------------------------------------------

/**
 * Get trending funds based on engagement scores
 */
export async function getTrendingFunds(
  limit: number = 20
): Promise<TrendingFund[]> {
  // Use cache for trending results
  return cacheMemoize(
    CacheKeys.trendingFunds(),
    async () => computeTrendingFunds(limit),
    CacheTTL.TRENDING
  );
}

/**
 * Compute trending funds (internal, called by memoized version)
 */
async function computeTrendingFunds(limit: number): Promise<TrendingFund[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  // Get funds with recent views
  const fundViews = await prisma.fundView.groupBy({
    by: ["fundId"],
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: limit * 2, // Get more than needed for scoring
  });

  if (fundViews.length === 0) {
    return [];
  }

  // Calculate engagement scores for each fund
  const scoredFunds = await Promise.all(
    fundViews.map(async (fv) => {
      const score = await calculateEngagementScore(fv.fundId);
      return {
        fundId: fv.fundId,
        viewCount: fv._count.id,
        score: score.totalScore,
        velocity: score.velocityScore,
      };
    })
  );

  // Sort by score and get fund details
  scoredFunds.sort((a, b) => b.score - a.score);
  const topFunds = scoredFunds.slice(0, limit);

  // Fetch fund names
  const fundDetails = await prisma.fund.findMany({
    where: {
      id: { in: topFunds.map((f) => f.fundId) },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const fundNameMap = new Map(fundDetails.map((f) => [f.id, f.name]));

  return topFunds.map((f, index) => ({
    fundId: f.fundId,
    name: fundNameMap.get(f.fundId) || "Unknown Fund",
    score: f.score,
    viewCount: f.viewCount,
    velocity: f.velocity,
    rank: index + 1,
  }));
}

// --------------------------------------------------------------------------
// Event Recording
// --------------------------------------------------------------------------

/**
 * Record a fund view event
 */
export async function recordFundView(params: {
  fundId: string;
  userId?: string;
  sessionId?: string;
  referrer?: string;
}): Promise<void> {
  await prisma.fundView.create({
    data: {
      fundId: params.fundId,
      userId: params.userId,
      sessionId: params.sessionId,
      referrer: params.referrer,
    },
  });
}

/**
 * Record a search event
 */
export async function recordSearchEvent(params: {
  query: string;
  filters?: object;
  resultCount: number;
  userId?: string;
  clickedFundId?: string;
}): Promise<void> {
  await prisma.searchEvent.create({
    data: {
      query: params.query,
      filters: params.filters || undefined,
      resultCount: params.resultCount,
      userId: params.userId,
      clickedFundId: params.clickedFundId,
    },
  });
}

/**
 * Update search event with click (when user clicks a result)
 */
export async function recordSearchClick(
  searchEventId: string,
  clickedFundId: string
): Promise<void> {
  await prisma.searchEvent.update({
    where: { id: searchEventId },
    data: { clickedFundId },
  });
}
