// Search router - Semantic and hybrid search for funds
// Uses pgvector for vector similarity search

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { FundType, FundStatus } from '@prisma/client';
import {
  generateEmbedding,
  searchFundsByVector,
  findSimilarFunds,
} from '@/lib/embeddings';
import {
  preprocessQuery,
  getBestQuery,
  getAutocompleteSuggestions,
  extractFundType,
  extractStrategyHints,
  // buildSearchAnalyticsEvent - TODO: implement logging
  type PreprocessedQuery,
} from '@/lib/search-utils';

// SearchType enum - matches Prisma schema
const SearchType = {
  SEMANTIC: 'SEMANTIC',
  STRUCTURED: 'STRUCTURED',
  HYBRID: 'HYBRID',
} as const;

// ============================================================
// Input Schemas
// ============================================================

const searchFiltersSchema = z.object({
  fundType: z.nativeEnum(FundType).optional(),
  strategy: z.string().optional(),
  minAum: z.number().optional(),
  maxAum: z.number().optional(),
  country: z.string().optional(),
  minReturn: z.number().optional(),
  maxReturn: z.number().optional(),
});

// ============================================================
// Hybrid Search Configuration
// ============================================================

// Improved RRF weights based on query characteristics
function getHybridWeights(preprocessed: PreprocessedQuery): { semantic: number; structured: number } {
  // If query has specific fund type or strategy hints, boost structured search
  const hasFundType = extractFundType(preprocessed.normalized) !== null;
  const hasStrategyHints = extractStrategyHints(preprocessed.normalized).length > 0;
  
  if (hasFundType || hasStrategyHints) {
    // Query is more specific - balance toward structured
    return { semantic: 0.45, structured: 0.55 };
  }
  
  // Natural language query - favor semantic
  if (preprocessed.tokens.length > 3) {
    return { semantic: 0.7, structured: 0.3 };
  }
  
  // Default balanced weights
  return { semantic: 0.6, structured: 0.4 };
}

// ============================================================
// Search Router
// ============================================================

export const searchRouter = router({
  /**
   * Semantic search - Pure vector similarity search
   * Finds funds similar to the natural language query
   */
  semanticSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(1000),
        filters: searchFiltersSchema.optional(),
        limit: z.number().min(1).max(100).default(20),
        threshold: z.number().min(0).max(1).default(0.5),
      })
    )
    .query(async ({ ctx, input }) => {
      const startTime = Date.now();
      const { query, filters, limit, threshold } = input;

      try {
        // Preprocess query
        const preprocessed = preprocessQuery(query);
        const searchQuery = getBestQuery(preprocessed);
        
        // Auto-extract fund type if not specified in filters
        let effectiveFilters = { ...filters };
        if (!effectiveFilters?.fundType) {
          const detectedType = extractFundType(searchQuery);
          if (detectedType) {
            effectiveFilters = { ...effectiveFilters, fundType: detectedType as FundType };
          }
        }

        // Generate embedding for the processed query
        const { embedding } = await generateEmbedding(searchQuery);

        // Search using vector similarity
        const results = await searchFundsByVector(embedding, {
          fundType: effectiveFilters?.fundType,
          strategy: effectiveFilters?.strategy,
          minAum: effectiveFilters?.minAum,
          maxAum: effectiveFilters?.maxAum,
          limit,
          threshold,
        });

        const latencyMs = Date.now() - startTime;

        // Log the search query for analytics
        const searchId = `sq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const topIds = results.slice(0, 10).map((r) => r.id);
        await ctx.prisma.$executeRaw`
          INSERT INTO "SearchQuery" (id, "userId", query, filters, "searchType", "resultCount", "topResultIds", "latencyMs", "createdAt")
          VALUES (
            ${searchId},
            ${ctx.user?.sub ?? null},
            ${searchQuery},
            ${JSON.stringify(effectiveFilters || {})}::jsonb,
            ${SearchType.SEMANTIC}::"SearchType",
            ${results.length},
            ${topIds},
            ${latencyMs},
            NOW()
          )
        `;

        // Fetch full fund details for the results
        const fundIds = results.map((r) => r.id);
        const funds = await ctx.prisma.fund.findMany({
          where: { id: { in: fundIds } },
          include: {
            statistics: {
              select: {
                ytdReturn: true,
                oneYearReturn: true,
                sharpeRatio: true,
                maxDrawdown: true,
                volatility: true,
              },
            },
          },
        });

        // Merge similarity scores with fund data
        const fundMap = new Map(funds.map((f) => [f.id, f]));
        const enrichedResults = results
          .map((r) => ({
            ...fundMap.get(r.id)!,
            similarity: r.similarity,
          }))
          .filter((r) => r !== undefined);

        // Build response with suggestions
        const response: {
          results: typeof enrichedResults;
          totalCount: number;
          latencyMs: number;
          suggestions?: {
            didYouMean?: string[];
            spellCorrections?: Array<{ original: string; corrected: string }>;
          };
          queryInfo?: {
            processed: string;
            extractedFilters?: {
              fundType?: string;
              strategies?: string[];
            };
          };
        } = {
          results: enrichedResults,
          totalCount: results.length,
          latencyMs,
        };

        // Add suggestions if spell corrections or alternatives found
        if (preprocessed.spellCorrections.length > 0 || preprocessed.suggestions.length > 0) {
          response.suggestions = {};
          if (preprocessed.suggestions.length > 0) {
            response.suggestions.didYouMean = preprocessed.suggestions;
          }
          if (preprocessed.spellCorrections.length > 0) {
            response.suggestions.spellCorrections = preprocessed.spellCorrections;
          }
        }

        // Include query processing info
        if (searchQuery !== query.toLowerCase().trim()) {
          response.queryInfo = {
            processed: searchQuery,
          };
          const detected = extractFundType(searchQuery);
          const strategies = extractStrategyHints(searchQuery);
          if (detected || strategies.length > 0) {
            response.queryInfo.extractedFilters = {};
            if (detected) response.queryInfo.extractedFilters.fundType = detected;
            if (strategies.length > 0) response.queryInfo.extractedFilters.strategies = strategies;
          }
        }

        return response;
      } catch (error) {
        console.error('Semantic search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Search failed. Please try again.',
        });
      }
    }),

  /**
   * Hybrid search - Combines semantic similarity with structured filters
   * Uses Reciprocal Rank Fusion (RRF) to merge results with adaptive weights
   */
  hybridSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(1000),
        filters: searchFiltersSchema.optional(),
        limit: z.number().min(1).max(100).default(20),
        semanticWeight: z.number().min(0).max(1).optional(), // Now optional - will auto-calculate
      })
    )
    .query(async ({ ctx, input }) => {
      const startTime = Date.now();
      const { query, filters, limit } = input;
      const RRF_K = 60; // Standard RRF constant

      try {
        // Preprocess query
        const preprocessed = preprocessQuery(query);
        const searchQuery = getBestQuery(preprocessed);
        
        // Calculate adaptive weights or use provided
        const weights = input.semanticWeight !== undefined
          ? { semantic: input.semanticWeight, structured: 1 - input.semanticWeight }
          : getHybridWeights(preprocessed);
        
        // Auto-extract fund type and strategy hints
        let effectiveFilters = { ...filters };
        const detectedType = extractFundType(searchQuery);
        const strategyHints = extractStrategyHints(searchQuery);
        
        if (!effectiveFilters?.fundType && detectedType) {
          effectiveFilters = { ...effectiveFilters, fundType: detectedType as FundType };
        }
        if (!effectiveFilters?.strategy && strategyHints.length > 0) {
          effectiveFilters = { ...effectiveFilters, strategy: strategyHints[0] };
        }

        // 1. Get semantic search results
        const { embedding } = await generateEmbedding(searchQuery);
        const semanticResults = await searchFundsByVector(embedding, {
          fundType: effectiveFilters?.fundType,
          strategy: effectiveFilters?.strategy,
          minAum: effectiveFilters?.minAum,
          maxAum: effectiveFilters?.maxAum,
          limit: limit * 2,
          threshold: 0.3,
        });

        // 2. Get structured search results (traditional SQL with synonym expansion)
        const expandedTerms = preprocessed.expandedTerms;
        const structuredResults = await ctx.prisma.fund.findMany({
          where: {
            status: FundStatus.APPROVED,
            visible: true,
            ...(effectiveFilters?.fundType && { type: effectiveFilters.fundType }),
            ...(effectiveFilters?.strategy && { 
              strategy: { contains: effectiveFilters.strategy, mode: 'insensitive' } 
            }),
            ...(effectiveFilters?.country && { country: effectiveFilters.country }),
            ...((effectiveFilters?.minAum || effectiveFilters?.maxAum) && {
              aum: {
                ...(effectiveFilters.minAum && { gte: effectiveFilters.minAum }),
                ...(effectiveFilters.maxAum && { lte: effectiveFilters.maxAum }),
              },
            }),
            // Text search with synonym expansion
            OR: expandedTerms.flatMap((term) => [
              { name: { contains: term, mode: 'insensitive' as const } },
              { description: { contains: term, mode: 'insensitive' as const } },
              { strategy: { contains: term, mode: 'insensitive' as const } },
            ]),
          },
          take: limit * 2,
          orderBy: [{ featured: 'desc' }, { aum: 'desc' }],
          select: { id: true, name: true },
        });

        // 3. Reciprocal Rank Fusion with adaptive weights
        const scores = new Map<string, number>();

        // Add semantic scores
        semanticResults.forEach((result, rank) => {
          const rrfScore = weights.semantic * (1 / (RRF_K + rank + 1));
          scores.set(result.id, (scores.get(result.id) || 0) + rrfScore);
        });

        // Add structured scores
        structuredResults.forEach((result, rank) => {
          const rrfScore = weights.structured * (1 / (RRF_K + rank + 1));
          scores.set(result.id, (scores.get(result.id) || 0) + rrfScore);
        });

        // Sort by combined score
        const rankedIds = Array.from(scores.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([id]) => id);

        const latencyMs = Date.now() - startTime;

        // Log the search
        const hybridSearchId = `sq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const hybridTopIds = rankedIds.slice(0, 10);
        await ctx.prisma.$executeRaw`
          INSERT INTO "SearchQuery" (id, "userId", query, filters, "searchType", "resultCount", "topResultIds", "latencyMs", "createdAt")
          VALUES (
            ${hybridSearchId},
            ${ctx.user?.sub ?? null},
            ${searchQuery},
            ${JSON.stringify(effectiveFilters || {})}::jsonb,
            ${SearchType.HYBRID}::"SearchType",
            ${rankedIds.length},
            ${hybridTopIds},
            ${latencyMs},
            NOW()
          )
        `;

        // Fetch full fund details
        const funds = await ctx.prisma.fund.findMany({
          where: { id: { in: rankedIds } },
          include: {
            statistics: {
              select: {
                ytdReturn: true,
                oneYearReturn: true,
                sharpeRatio: true,
                maxDrawdown: true,
                volatility: true,
              },
            },
          },
        });

        // Sort by RRF score
        const fundMap = new Map(funds.map((f) => [f.id, f]));
        const sortedResults = rankedIds
          .map((id) => ({
            ...fundMap.get(id)!,
            score: scores.get(id),
          }))
          .filter((r) => r !== undefined);

        // Build response
        const response: {
          results: typeof sortedResults;
          totalCount: number;
          latencyMs: number;
          searchType: 'hybrid';
          weights: { semantic: number; structured: number };
          suggestions?: {
            didYouMean?: string[];
            spellCorrections?: Array<{ original: string; corrected: string }>;
          };
          queryInfo?: {
            processed: string;
            extractedFilters?: {
              fundType?: string;
              strategies?: string[];
            };
          };
        } = {
          results: sortedResults,
          totalCount: sortedResults.length,
          latencyMs,
          searchType: 'hybrid',
          weights,
        };

        // Add suggestions
        if (preprocessed.spellCorrections.length > 0 || preprocessed.suggestions.length > 0) {
          response.suggestions = {};
          if (preprocessed.suggestions.length > 0) {
            response.suggestions.didYouMean = preprocessed.suggestions;
          }
          if (preprocessed.spellCorrections.length > 0) {
            response.suggestions.spellCorrections = preprocessed.spellCorrections;
          }
        }

        // Include query processing info
        if (searchQuery !== query.toLowerCase().trim() || detectedType || strategyHints.length > 0) {
          response.queryInfo = {
            processed: searchQuery,
          };
          if (detectedType || strategyHints.length > 0) {
            response.queryInfo.extractedFilters = {};
            if (detectedType) response.queryInfo.extractedFilters.fundType = detectedType;
            if (strategyHints.length > 0) response.queryInfo.extractedFilters.strategies = strategyHints;
          }
        }

        return response;
      } catch (error) {
        console.error('Hybrid search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Search failed. Please try again.',
        });
      }
    }),

  /**
   * Similar funds - Find funds similar to a specific fund
   * Uses cosine similarity on fund embeddings
   */
  similarFunds: publicProcedure
    .input(
      z.object({
        fundId: z.string(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { fundId, limit } = input;

      // Verify the fund exists and is visible
      const fund = await ctx.prisma.fund.findUnique({
        where: {
          id: fundId,
          status: FundStatus.APPROVED,
          visible: true,
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      // Find similar funds
      const similarResults = await findSimilarFunds(fundId, limit);

      if (similarResults.length === 0) {
        return { results: [], sourceFund: fund };
      }

      // Fetch full details for similar funds
      const similarIds = similarResults.map((r) => r.id);
      const similarFunds = await ctx.prisma.fund.findMany({
        where: { id: { in: similarIds } },
        include: {
          statistics: {
            select: {
              ytdReturn: true,
              oneYearReturn: true,
              sharpeRatio: true,
            },
          },
        },
      });

      // Merge similarity scores
      const fundMap = new Map(similarFunds.map((f) => [f.id, f]));
      const enrichedResults = similarResults
        .map((r) => ({
          ...fundMap.get(r.id)!,
          similarity: r.similarity,
        }))
        .filter((r) => r !== undefined);

      return {
        results: enrichedResults,
        sourceFund: fund,
      };
    }),

  /**
   * Autocomplete - Get query suggestions as user types
   */
  autocomplete: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      // Get static suggestions from common queries
      const staticSuggestions = getAutocompleteSuggestions(query, limit);

      // Get popular queries from database that match
      const popularQueries = await ctx.prisma.$queryRaw<Array<{ query: string; count: bigint }>>`
        SELECT query, COUNT(*) as count
        FROM "SearchQuery"
        WHERE 
          LOWER(query) LIKE ${`%${query.toLowerCase()}%`}
          AND "resultCount" > 0
        GROUP BY query
        ORDER BY count DESC
        LIMIT ${limit}
      `;

      // Combine and deduplicate
      const allSuggestions = new Set([
        ...popularQueries.map((p) => p.query),
        ...staticSuggestions,
      ]);

      return {
        suggestions: Array.from(allSuggestions).slice(0, limit),
      };
    }),

  /**
   * Get recent searches for the logged-in user
   */
  recentSearches: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const searches = await ctx.prisma.$queryRaw<
        Array<{
          id: string;
          query: string;
          filters: unknown;
          searchType: string;
          resultCount: number;
          createdAt: Date;
        }>
      >`
        SELECT id, query, filters, "searchType"::TEXT as "searchType", "resultCount", "createdAt"
        FROM "SearchQuery"
        WHERE "userId" = ${ctx.user.sub}
        ORDER BY "createdAt" DESC
        LIMIT ${input.limit}
      `;

      return searches;
    }),

  /**
   * Get popular/trending searches (anonymized)
   */
  trendingSearches: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(30).default(7),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      // Group by query and count occurrences
      const trending = await ctx.prisma.$queryRaw<
        Array<{ query: string; count: bigint }>
      >`
        SELECT query, COUNT(*) as count
        FROM "SearchQuery"
        WHERE "createdAt" >= ${since}
        AND "resultCount" > 0
        GROUP BY query
        ORDER BY count DESC
        LIMIT ${input.limit}
      `;

      return trending.map((t) => ({
        query: t.query,
        count: Number(t.count),
      }));
    }),

  /**
   * Analyze a query without executing search
   * Useful for UI to show what filters will be applied
   */
  analyzeQuery: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(1000),
      })
    )
    .query(async ({ input }) => {
      const preprocessed = preprocessQuery(input.query);
      const bestQuery = getBestQuery(preprocessed);
      const fundType = extractFundType(bestQuery);
      const strategies = extractStrategyHints(bestQuery);

      return {
        original: input.query,
        processed: bestQuery,
        tokens: preprocessed.tokens,
        spellCorrections: preprocessed.spellCorrections,
        suggestions: preprocessed.suggestions,
        expandedTerms: preprocessed.expandedTerms,
        extractedFilters: {
          fundType,
          strategies,
        },
      };
    }),
});
