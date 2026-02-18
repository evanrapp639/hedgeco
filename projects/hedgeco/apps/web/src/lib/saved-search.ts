// Saved Search Utilities
// Functions for executing saved searches and comparing results

import { prisma } from '@/lib/prisma';
import { FundType, FundStatus } from '@prisma/client';
import { generateEmbedding, searchFundsByVector } from '@/lib/embeddings';
import { notifySavedSearchMatch } from '@/lib/notification-emitter';

// ============================================================
// Types
// ============================================================

export interface SavedSearchCriteria {
  // Text query (for semantic search)
  query?: string;

  // Structured filters
  fundType?: FundType;
  strategy?: string;
  minAum?: number;
  maxAum?: number;
  country?: string;
  state?: string;
  city?: string;

  // Performance filters
  minYtdReturn?: number;
  maxYtdReturn?: number;
  minOneYearReturn?: number;
  maxOneYearReturn?: number;
  minSharpeRatio?: number;

  // Other filters
  minInceptionDate?: string; // ISO date
  maxInceptionDate?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  type: FundType;
  strategy: string | null;
  aum: number | null;
  country: string | null;
  similarity?: number;
}

export interface SearchComparisonResult {
  hasNewMatches: boolean;
  newMatchCount: number;
  previousCount: number;
  currentCount: number;
  newFundIds: string[];
}

// ============================================================
// Execute Saved Search
// ============================================================

/**
 * Execute a saved search against the database
 * Supports both semantic (vector) and structured (SQL) search
 */
export async function executeSavedSearch(
  criteria: SavedSearchCriteria,
  limit: number = 100
): Promise<SearchResult[]> {
  // If there's a text query, use hybrid search
  if (criteria.query && criteria.query.trim().length > 0) {
    return executeSemanticSearch(criteria, limit);
  }

  // Otherwise, use structured search only
  return executeStructuredSearch(criteria, limit);
}

/**
 * Execute semantic (vector) search with filters
 */
async function executeSemanticSearch(
  criteria: SavedSearchCriteria,
  limit: number
): Promise<SearchResult[]> {
  try {
    const { embedding } = await generateEmbedding(criteria.query!);

    const vectorResults = await searchFundsByVector(embedding, {
      fundType: criteria.fundType,
      strategy: criteria.strategy,
      minAum: criteria.minAum,
      maxAum: criteria.maxAum,
      limit,
      threshold: 0.4,
    });

    // Fetch full details and apply additional filters
    const fundIds = vectorResults.map((r) => r.id);
    const funds = await prisma.fund.findMany({
      where: {
        id: { in: fundIds },
        ...buildAdditionalFilters(criteria),
      },
      select: {
        id: true,
        name: true,
        type: true,
        strategy: true,
        aum: true,
        country: true,
      },
    });

    // Merge with similarity scores
    const fundMap = new Map(funds.map((f) => [f.id, f]));
    return vectorResults
      .filter((r) => fundMap.has(r.id))
      .map((r) => ({
        ...fundMap.get(r.id)!,
        aum: fundMap.get(r.id)!.aum?.toNumber() ?? null,
        similarity: r.similarity,
      }));
  } catch (error) {
    console.error('[SavedSearch] Semantic search error:', error);
    // Fallback to structured search
    return executeStructuredSearch(criteria, limit);
  }
}

/**
 * Execute structured (SQL) search
 */
async function executeStructuredSearch(
  criteria: SavedSearchCriteria,
  limit: number
): Promise<SearchResult[]> {
  const funds = await prisma.fund.findMany({
    where: {
      status: FundStatus.APPROVED,
      visible: true,
      ...buildStructuredFilters(criteria),
      ...buildAdditionalFilters(criteria),
    },
    take: limit,
    orderBy: [{ featured: 'desc' }, { aum: 'desc' }],
    select: {
      id: true,
      name: true,
      type: true,
      strategy: true,
      aum: true,
      country: true,
    },
  });

  return funds.map((f) => ({
    ...f,
    aum: f.aum?.toNumber() ?? null,
  }));
}

/**
 * Build Prisma where clause for basic structured filters
 */
function buildStructuredFilters(criteria: SavedSearchCriteria) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (criteria.fundType) {
    where.type = criteria.fundType;
  }

  if (criteria.strategy) {
    where.strategy = { contains: criteria.strategy, mode: 'insensitive' };
  }

  if (criteria.minAum || criteria.maxAum) {
    where.aum = {};
    if (criteria.minAum) where.aum.gte = criteria.minAum;
    if (criteria.maxAum) where.aum.lte = criteria.maxAum;
  }

  if (criteria.country) {
    where.country = criteria.country;
  }

  if (criteria.state) {
    where.state = criteria.state;
  }

  if (criteria.city) {
    where.city = { contains: criteria.city, mode: 'insensitive' };
  }

  return where;
}

/**
 * Build additional filters (performance, dates, etc.)
 */
function buildAdditionalFilters(criteria: SavedSearchCriteria) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Performance filters via statistics relation
  if (
    criteria.minYtdReturn !== undefined ||
    criteria.maxYtdReturn !== undefined ||
    criteria.minOneYearReturn !== undefined ||
    criteria.maxOneYearReturn !== undefined ||
    criteria.minSharpeRatio !== undefined
  ) {
    where.statistics = {};

    if (criteria.minYtdReturn !== undefined || criteria.maxYtdReturn !== undefined) {
      where.statistics.ytdReturn = {};
      if (criteria.minYtdReturn !== undefined) {
        where.statistics.ytdReturn.gte = criteria.minYtdReturn / 100; // Convert % to decimal
      }
      if (criteria.maxYtdReturn !== undefined) {
        where.statistics.ytdReturn.lte = criteria.maxYtdReturn / 100;
      }
    }

    if (criteria.minOneYearReturn !== undefined || criteria.maxOneYearReturn !== undefined) {
      where.statistics.oneYearReturn = {};
      if (criteria.minOneYearReturn !== undefined) {
        where.statistics.oneYearReturn.gte = criteria.minOneYearReturn / 100;
      }
      if (criteria.maxOneYearReturn !== undefined) {
        where.statistics.oneYearReturn.lte = criteria.maxOneYearReturn / 100;
      }
    }

    if (criteria.minSharpeRatio !== undefined) {
      where.statistics.sharpeRatio = { gte: criteria.minSharpeRatio };
    }
  }

  // Inception date filters
  if (criteria.minInceptionDate || criteria.maxInceptionDate) {
    where.inceptionDate = {};
    if (criteria.minInceptionDate) {
      where.inceptionDate.gte = new Date(criteria.minInceptionDate);
    }
    if (criteria.maxInceptionDate) {
      where.inceptionDate.lte = new Date(criteria.maxInceptionDate);
    }
  }

  return where;
}

// ============================================================
// Compare Results
// ============================================================

/**
 * Compare new search results with previous count
 * Returns information about new matches
 */
export function compareResults(
  previousCount: number,
  newResults: SearchResult[],
  previousFundIds?: string[]
): SearchComparisonResult {
  const currentCount = newResults.length;
  const currentIds = newResults.map((r) => r.id);

  // If we have previous fund IDs, calculate exact new funds
  let newFundIds: string[] = [];
  if (previousFundIds && previousFundIds.length > 0) {
    const previousSet = new Set(previousFundIds);
    newFundIds = currentIds.filter((id) => !previousSet.has(id));
  } else {
    // Estimate based on count difference
    newFundIds = currentCount > previousCount ? currentIds.slice(0, currentCount - previousCount) : [];
  }

  return {
    hasNewMatches: newFundIds.length > 0,
    newMatchCount: newFundIds.length,
    previousCount,
    currentCount,
    newFundIds,
  };
}

// ============================================================
// Notify User
// ============================================================

/**
 * Send notification to user about new search matches
 * Creates in-app notification and sends real-time alert if connected
 */
export async function notifyUser(
  userId: string,
  searchId: string,
  searchName: string,
  newMatches: number
): Promise<void> {
  // Create persistent notification in database
  // Using the JobQueue as a simple notification store
  // (In production, you'd have a dedicated Notification model)
  await prisma.jobQueue.create({
    data: {
      queue: 'notifications',
      jobType: 'SAVED_SEARCH_ALERT',
      payload: {
        userId,
        searchId,
        searchName,
        newMatches,
        message: `Your saved search "${searchName}" found ${newMatches} new ${newMatches === 1 ? 'match' : 'matches'}`,
      },
      status: 'COMPLETED', // Already "delivered" as notification
    },
  });

  // Send real-time notification via SSE
  notifySavedSearchMatch(userId, searchName, newMatches, searchId);

  console.log(`[SavedSearch] Notified user ${userId}: ${newMatches} new matches for "${searchName}"`);
}

// ============================================================
// Batch Processing Helpers
// ============================================================

/**
 * Get all saved searches with alerts enabled that need to run
 * Optionally filter by time since last run
 */
export async function getAlertEnabledSearches(minHoursSinceLastRun: number = 1) {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - minHoursSinceLastRun);

  return prisma.savedSearch.findMany({
    where: {
      alertEnabled: true,
      OR: [
        { lastAlertAt: null },
        { lastAlertAt: { lt: cutoffTime } },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          active: true,
        },
      },
    },
  });
}

/**
 * Update saved search after running
 */
export async function updateSearchAfterRun(
  searchId: string,
  matchCount: number
): Promise<void> {
  await prisma.savedSearch.update({
    where: { id: searchId },
    data: {
      lastAlertAt: new Date(),
      lastMatchCount: matchCount,
    },
  });
}
