/**
 * Trending Algorithm Module
 * Sprint 5: HedgeCo.Net
 *
 * Implements time-weighted scoring for fund trending lists.
 * Designed to run hourly via cron job.
 */

import { prisma } from "./prisma";
import { cacheSet, CacheKeys, CacheTTL, getRedisClient } from "./cache";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface TrendingScore {
  fundId: string;
  rawScore: number;
  normalizedScore: number;
  viewCount: number;
  velocity: number;
  recencyFactor: number;
  lastViewAt: Date | null;
}

export interface TrendingListEntry {
  fundId: string;
  name: string;
  slug: string;
  type: string;
  strategy: string | null;
  aum: number | null;
  score: number;
  viewCount: number;
  velocity: number;
  rank: number;
}

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

const CONFIG = {
  // Time decay half-life in hours
  DECAY_HALF_LIFE_HOURS: 24,

  // Weight factors
  WEIGHT_VIEWS: 0.4,
  WEIGHT_VELOCITY: 0.35,
  WEIGHT_RECENCY: 0.25,

  // Analysis windows
  RECENT_WINDOW_HOURS: 168, // 7 days
  VELOCITY_WINDOW_HOURS: 24, // Compare last 24h vs previous 24h

  // Normalization
  MIN_VIEWS_FOR_TRENDING: 5,
  MAX_FUNDS_IN_LIST: 100,
};

// --------------------------------------------------------------------------
// Scoring Functions
// --------------------------------------------------------------------------

/**
 * Calculate time-weighted view score
 * Recent views count more than older views
 */
function calculateTimeWeightedViews(
  views: Array<{ createdAt: Date }>,
  now: Date
): number {
  if (views.length === 0) return 0;

  const halfLifeMs = CONFIG.DECAY_HALF_LIFE_HOURS * 60 * 60 * 1000;

  return views.reduce((score, view) => {
    const ageMs = now.getTime() - view.createdAt.getTime();
    const decayFactor = Math.pow(0.5, ageMs / halfLifeMs);
    return score + decayFactor;
  }, 0);
}

/**
 * Calculate velocity (rate of change)
 * Positive = trending up, negative = trending down
 */
function calculateVelocity(
  views: Array<{ createdAt: Date }>,
  now: Date
): number {
  const windowMs = CONFIG.VELOCITY_WINDOW_HOURS * 60 * 60 * 1000;

  const recentWindowStart = new Date(now.getTime() - windowMs);
  const previousWindowStart = new Date(now.getTime() - windowMs * 2);

  const recentCount = views.filter(
    (v) => v.createdAt >= recentWindowStart
  ).length;

  const previousCount = views.filter(
    (v) => v.createdAt >= previousWindowStart && v.createdAt < recentWindowStart
  ).length;

  if (previousCount === 0) {
    // No previous activity - high velocity if any recent activity
    return recentCount > 0 ? recentCount * 2 : 0;
  }

  // Return ratio (>1 = growing, <1 = declining)
  return recentCount / previousCount;
}

/**
 * Calculate recency factor
 * How recently was this fund viewed?
 */
function calculateRecencyFactor(
  lastViewAt: Date | null,
  now: Date
): number {
  if (!lastViewAt) return 0;

  const hoursSinceLastView =
    (now.getTime() - lastViewAt.getTime()) / (1000 * 60 * 60);

  // Exponential decay with half-life of 24 hours
  return Math.exp((-hoursSinceLastView * Math.LN2) / 24);
}

/**
 * Calculate trending score for a single fund
 */
async function calculateFundTrendingScore(
  fundId: string,
  now: Date
): Promise<TrendingScore> {
  const windowStart = new Date(
    now.getTime() - CONFIG.RECENT_WINDOW_HOURS * 60 * 60 * 1000
  );

  // Get views within the analysis window
  const views = await prisma.fundView.findMany({
    where: {
      fundId,
      createdAt: {
        gte: windowStart,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const viewCount = views.length;
  const lastViewAt = views.length > 0 ? views[0].createdAt : null;

  // Calculate component scores
  const timeWeightedViews = calculateTimeWeightedViews(views, now);
  const velocity = calculateVelocity(views, now);
  const recencyFactor = calculateRecencyFactor(lastViewAt, now);

  // Combine into raw score
  const rawScore =
    timeWeightedViews * CONFIG.WEIGHT_VIEWS +
    velocity * 10 * CONFIG.WEIGHT_VELOCITY + // Scale velocity
    recencyFactor * 50 * CONFIG.WEIGHT_RECENCY; // Scale recency

  return {
    fundId,
    rawScore,
    normalizedScore: 0, // Will be set during normalization
    viewCount,
    velocity,
    recencyFactor,
    lastViewAt,
  };
}

/**
 * Normalize scores across fund sizes
 * Uses percentile-based normalization to account for varying fund popularity
 */
function normalizeScores(scores: TrendingScore[]): TrendingScore[] {
  if (scores.length === 0) return [];

  // Sort by raw score
  const sorted = [...scores].sort((a, b) => b.rawScore - a.rawScore);

  // Calculate percentile-based normalized score (0-100)
  return sorted.map((score, index) => ({
    ...score,
    normalizedScore: ((sorted.length - index) / sorted.length) * 100,
  }));
}

// --------------------------------------------------------------------------
// Trending List Management
// --------------------------------------------------------------------------

/**
 * Update the trending funds list
 * Called hourly via cron job
 */
export async function updateTrendingList(): Promise<TrendingListEntry[]> {
  const now = new Date();
  console.log(`[trending] Starting trending list update at ${now.toISOString()}`);

  const windowStart = new Date(
    now.getTime() - CONFIG.RECENT_WINDOW_HOURS * 60 * 60 * 1000
  );

  // Get all funds with views in the analysis window
  const fundsWithViews = await prisma.fundView.groupBy({
    by: ["fundId"],
    where: {
      createdAt: {
        gte: windowStart,
      },
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gte: CONFIG.MIN_VIEWS_FOR_TRENDING,
        },
      },
    },
  });

  console.log(`[trending] Found ${fundsWithViews.length} funds with sufficient views`);

  if (fundsWithViews.length === 0) {
    // No funds with enough views - return empty list
    await cacheSet(CacheKeys.trendingFunds(), [], CacheTTL.TRENDING);
    return [];
  }

  // Calculate scores for all qualifying funds
  const scores = await Promise.all(
    fundsWithViews.map((f) => calculateFundTrendingScore(f.fundId, now))
  );

  // Normalize and sort
  const normalizedScores = normalizeScores(scores);

  // Get top funds
  const topFundIds = normalizedScores
    .slice(0, CONFIG.MAX_FUNDS_IN_LIST)
    .map((s) => s.fundId);

  // Fetch fund details
  const funds = await prisma.fund.findMany({
    where: {
      id: { in: topFundIds },
      status: "APPROVED",
      visible: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      strategy: true,
      aum: true,
    },
  });

  const fundMap = new Map(funds.map((f) => [f.id, f]));

  // Build trending list
  const trendingList: TrendingListEntry[] = normalizedScores
    .slice(0, CONFIG.MAX_FUNDS_IN_LIST)
    .map((score, index) => {
      const fund = fundMap.get(score.fundId);
      if (!fund) return null;

      return {
        fundId: score.fundId,
        name: fund.name,
        slug: fund.slug,
        type: fund.type,
        strategy: fund.strategy,
        aum: fund.aum ? Number(fund.aum) : null,
        score: score.normalizedScore,
        viewCount: score.viewCount,
        velocity: score.velocity,
        rank: index + 1,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  // Cache the trending list
  await cacheSet(CacheKeys.trendingFunds(), trendingList, CacheTTL.TRENDING);

  // Also store individual fund scores in a sorted set for quick lookups
  const redis = getRedisClient();
  const pipeline = redis.pipeline();

  // Clear and rebuild sorted set
  pipeline.del("trending:scores");
  for (const score of normalizedScores.slice(0, CONFIG.MAX_FUNDS_IN_LIST)) {
    pipeline.zadd("trending:scores", score.normalizedScore, score.fundId);
  }
  pipeline.expire("trending:scores", CacheTTL.TRENDING * 2); // Longer TTL for sorted set

  await pipeline.exec();

  console.log(`[trending] Updated trending list with ${trendingList.length} funds`);

  return trendingList;
}

/**
 * Get a fund's trending rank
 */
export async function getFundTrendingRank(fundId: string): Promise<number | null> {
  const redis = getRedisClient();

  // zrevrank returns 0-based index (highest score = 0)
  const rank = await redis.zrevrank("trending:scores", fundId);

  if (rank === null) return null;

  return rank + 1; // Convert to 1-based rank
}

/**
 * Get funds by trending score range
 */
export async function getFundsByTrendingRange(
  minRank: number,
  maxRank: number
): Promise<string[]> {
  const redis = getRedisClient();

  // zrevrange is 0-indexed
  return redis.zrevrange("trending:scores", minRank - 1, maxRank - 1);
}

/**
 * Check if a fund is trending (in top N)
 */
export async function isFundTrending(
  fundId: string,
  topN: number = 20
): Promise<boolean> {
  const rank = await getFundTrendingRank(fundId);
  return rank !== null && rank <= topN;
}

// --------------------------------------------------------------------------
// Cron Job Handler
// --------------------------------------------------------------------------

/**
 * Entry point for cron job
 * Run hourly: `0 * * * * node -e "require('./src/lib/trending').runTrendingUpdate()"`
 */
export async function runTrendingUpdate(): Promise<void> {
  try {
    const startTime = Date.now();
    const result = await updateTrendingList();
    const duration = Date.now() - startTime;

    console.log(
      `[trending] Cron completed: ${result.length} funds in ${duration}ms`
    );
  } catch (error) {
    console.error("[trending] Cron failed:", error);
    throw error;
  }
}
