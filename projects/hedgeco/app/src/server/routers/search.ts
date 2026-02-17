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

// SearchType enum - matches Prisma schema
// Will be auto-generated after `prisma generate`
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
        // Generate embedding for the query
        const { embedding } = await generateEmbedding(query);

        // Search using vector similarity
        const results = await searchFundsByVector(embedding, {
          fundType: filters?.fundType,
          strategy: filters?.strategy,
          minAum: filters?.minAum,
          maxAum: filters?.maxAum,
          limit,
          threshold,
        });

        const latencyMs = Date.now() - startTime;

        // Log the search query for analytics (using raw SQL for pgvector compatibility)
        const searchId = `sq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const topIds = results.slice(0, 10).map((r) => r.id);
        await ctx.prisma.$executeRaw`
          INSERT INTO "SearchQuery" (id, "userId", query, filters, "searchType", "resultCount", "topResultIds", "latencyMs", "createdAt")
          VALUES (
            ${searchId},
            ${ctx.user?.sub ?? null},
            ${query},
            ${JSON.stringify(filters || {})}::jsonb,
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

        return {
          results: enrichedResults,
          totalCount: results.length,
          latencyMs,
        };
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
   * Uses Reciprocal Rank Fusion (RRF) to merge results
   */
  hybridSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(1000),
        filters: searchFiltersSchema.optional(),
        limit: z.number().min(1).max(100).default(20),
        semanticWeight: z.number().min(0).max(1).default(0.6),
      })
    )
    .query(async ({ ctx, input }) => {
      const startTime = Date.now();
      const { query, filters, limit, semanticWeight } = input;
      const structuredWeight = 1 - semanticWeight;
      const RRF_K = 60; // Standard RRF constant

      try {
        // 1. Get semantic search results
        const { embedding } = await generateEmbedding(query);
        const semanticResults = await searchFundsByVector(embedding, {
          fundType: filters?.fundType,
          strategy: filters?.strategy,
          minAum: filters?.minAum,
          maxAum: filters?.maxAum,
          limit: limit * 2, // Get more for better fusion
          threshold: 0.3, // Lower threshold for hybrid
        });

        // 2. Get structured search results (traditional SQL)
        const structuredResults = await ctx.prisma.fund.findMany({
          where: {
            status: FundStatus.APPROVED,
            visible: true,
            ...(filters?.fundType && { type: filters.fundType }),
            ...(filters?.strategy && { 
              strategy: { contains: filters.strategy, mode: 'insensitive' } 
            }),
            ...(filters?.country && { country: filters.country }),
            ...((filters?.minAum || filters?.maxAum) && {
              aum: {
                ...(filters.minAum && { gte: filters.minAum }),
                ...(filters.maxAum && { lte: filters.maxAum }),
              },
            }),
            // Text search in name/description
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { strategy: { contains: query, mode: 'insensitive' } },
            ],
          },
          take: limit * 2,
          orderBy: [{ featured: 'desc' }, { aum: 'desc' }],
          select: { id: true, name: true },
        });

        // 3. Reciprocal Rank Fusion
        const scores = new Map<string, number>();

        // Add semantic scores
        semanticResults.forEach((result, rank) => {
          const rrfScore = semanticWeight * (1 / (RRF_K + rank + 1));
          scores.set(result.id, (scores.get(result.id) || 0) + rrfScore);
        });

        // Add structured scores
        structuredResults.forEach((result, rank) => {
          const rrfScore = structuredWeight * (1 / (RRF_K + rank + 1));
          scores.set(result.id, (scores.get(result.id) || 0) + rrfScore);
        });

        // Sort by combined score
        const rankedIds = Array.from(scores.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([id]) => id);

        const latencyMs = Date.now() - startTime;

        // Log the search (using raw SQL for pgvector compatibility)
        const hybridSearchId = `sq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const hybridTopIds = rankedIds.slice(0, 10);
        await ctx.prisma.$executeRaw`
          INSERT INTO "SearchQuery" (id, "userId", query, filters, "searchType", "resultCount", "topResultIds", "latencyMs", "createdAt")
          VALUES (
            ${hybridSearchId},
            ${ctx.user?.sub ?? null},
            ${query},
            ${JSON.stringify(filters || {})}::jsonb,
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

        return {
          results: sortedResults,
          totalCount: sortedResults.length,
          latencyMs,
          searchType: 'hybrid' as const,
        };
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
});
