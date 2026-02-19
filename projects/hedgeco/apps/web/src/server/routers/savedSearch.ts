// Saved Search Router - CRUD operations for saved searches
// Allows users to save, manage, and run searches with optional alerts

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { FundType, AlertFrequency } from '@prisma/client';
import {
  executeSavedSearch,
  type SavedSearchCriteria,
} from '@/lib/saved-search';

// ============================================================
// Input Schemas
// ============================================================

const searchCriteriaSchema = z.object({
  // Text query
  query: z.string().optional(),

  // Fund filters
  fundType: z.nativeEnum(FundType).optional(),
  strategy: z.string().optional(),
  minAum: z.number().optional(),
  maxAum: z.number().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),

  // Performance filters
  minYtdReturn: z.number().optional(),
  maxYtdReturn: z.number().optional(),
  minOneYearReturn: z.number().optional(),
  maxOneYearReturn: z.number().optional(),
  minSharpeRatio: z.number().optional(),

  // Date filters
  minInceptionDate: z.string().optional(),
  maxInceptionDate: z.string().optional(),
});

// ============================================================
// Saved Search Router
// ============================================================

export const savedSearchRouter = router({
  /**
   * Create a new saved search
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        criteria: searchCriteriaSchema,
        alertEnabled: z.boolean().default(false),
        alertFrequency: z.nativeEnum(AlertFrequency).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, criteria, alertEnabled, alertFrequency } = input;
      const userId = ctx.user.sub;

      // Check for existing search with same name
      const existing = await ctx.prisma.savedSearch.findFirst({
        where: {
          userId,
          name: { equals: name, mode: 'insensitive' },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A saved search with this name already exists',
        });
      }

      // Limit number of saved searches per user
      const count = await ctx.prisma.savedSearch.count({
        where: { userId },
      });

      if (count >= 50) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Maximum saved searches limit reached (50)',
        });
      }

      // Run the search to get initial match count
      const results = await executeSavedSearch(criteria as SavedSearchCriteria);

      const savedSearch = await ctx.prisma.savedSearch.create({
        data: {
          userId,
          name,
          filters: criteria,
          query: criteria.query,
          alertEnabled,
          alertFrequency: alertFrequency || AlertFrequency.DAILY,
          lastMatchCount: results.length,
        },
      });

      return {
        ...savedSearch,
        initialMatchCount: results.length,
      };
    }),

  /**
   * List user's saved searches
   */
  list: protectedProcedure
    .input(
      z.object({
        includeMatchCount: z.boolean().default(false),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      const searches = await ctx.prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      // Optionally refresh match counts (can be slow for many searches)
      if (input?.includeMatchCount) {
        const withCounts = await Promise.all(
          searches.map(async (search) => {
            try {
              const results = await executeSavedSearch(
                search.filters as SavedSearchCriteria,
                100
              );
              return {
                ...search,
                currentMatchCount: results.length,
                hasNewMatches: results.length > (search.lastMatchCount || 0),
              };
            } catch {
              return {
                ...search,
                currentMatchCount: search.lastMatchCount,
                hasNewMatches: false,
              };
            }
          })
        );
        return withCounts;
      }

      return searches;
    }),

  /**
   * Get a single saved search by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const search = await ctx.prisma.savedSearch.findUnique({
        where: { id: input.id },
      });

      if (!search) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Saved search not found',
        });
      }

      if (search.userId !== ctx.user.sub) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      return search;
    }),

  /**
   * Update a saved search
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        criteria: searchCriteriaSchema.optional(),
        alertEnabled: z.boolean().optional(),
        alertFrequency: z.nativeEnum(AlertFrequency).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, criteria, alertEnabled, alertFrequency } = input;
      const userId = ctx.user.sub;

      // Verify ownership
      const existing = await ctx.prisma.savedSearch.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Saved search not found',
        });
      }

      if (existing.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      // Check for name conflict if name is being changed
      if (name && name !== existing.name) {
        const nameConflict = await ctx.prisma.savedSearch.findFirst({
          where: {
            userId,
            name: { equals: name, mode: 'insensitive' },
            id: { not: id },
          },
        });

        if (nameConflict) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A saved search with this name already exists',
          });
        }
      }

      // Build update data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (criteria !== undefined) {
        updateData.filters = criteria;
        updateData.query = criteria.query;
      }
      if (alertEnabled !== undefined) updateData.alertEnabled = alertEnabled;
      if (alertFrequency !== undefined) updateData.alertFrequency = alertFrequency;

      const updated = await ctx.prisma.savedSearch.update({
        where: { id },
        data: updateData,
      });

      return updated;
    }),

  /**
   * Delete a saved search
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      const search = await ctx.prisma.savedSearch.findUnique({
        where: { id: input.id },
      });

      if (!search) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Saved search not found',
        });
      }

      if (search.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      await ctx.prisma.savedSearch.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Run a saved search and return results
   */
  runSearch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id, limit } = input;
      const userId = ctx.user.sub;

      const search = await ctx.prisma.savedSearch.findUnique({
        where: { id },
      });

      if (!search) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Saved search not found',
        });
      }

      if (search.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      // Execute the search
      const startTime = Date.now();
      const results = await executeSavedSearch(
        search.filters as SavedSearchCriteria,
        limit
      );
      const latencyMs = Date.now() - startTime;

      // Update last run info
      const previousCount = search.lastMatchCount || 0;
      await ctx.prisma.savedSearch.update({
        where: { id },
        data: {
          lastAlertAt: new Date(),
          lastMatchCount: results.length,
        },
      });

      return {
        results,
        totalCount: results.length,
        previousCount,
        hasNewMatches: results.length > previousCount,
        newMatchCount: Math.max(0, results.length - previousCount),
        latencyMs,
        search: {
          id: search.id,
          name: search.name,
        },
      };
    }),

  /**
   * Toggle alerts for a saved search
   */
  toggleAlert: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        enabled: z.boolean().optional(), // If not provided, toggles current state
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, enabled } = input;
      const userId = ctx.user.sub;

      const search = await ctx.prisma.savedSearch.findUnique({
        where: { id },
      });

      if (!search) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Saved search not found',
        });
      }

      if (search.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const newState = enabled !== undefined ? enabled : !search.alertEnabled;

      const updated = await ctx.prisma.savedSearch.update({
        where: { id },
        data: { alertEnabled: newState },
      });

      return {
        id: updated.id,
        alertEnabled: updated.alertEnabled,
      };
    }),

  /**
   * Duplicate a saved search
   */
  duplicate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        newName: z.string().min(1).max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, newName } = input;
      const userId = ctx.user.sub;

      const original = await ctx.prisma.savedSearch.findUnique({
        where: { id },
      });

      if (!original) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Saved search not found',
        });
      }

      if (original.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      // Generate unique name
      let finalName = newName || `${original.name} (copy)`;
      let counter = 1;
      const maxAttempts = 100; // Safety limit
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const exists = await ctx.prisma.savedSearch.findFirst({
          where: {
            userId,
            name: { equals: finalName, mode: 'insensitive' },
          },
        });
        if (!exists) break;
        counter++;
        finalName = newName
          ? `${newName} (${counter})`
          : `${original.name} (copy ${counter})`;
      }

      const duplicate = await ctx.prisma.savedSearch.create({
        data: {
          userId,
          name: finalName,
          filters: original.filters ?? {},
          query: original.query,
          alertEnabled: false, // Don't copy alert settings
          alertFrequency: original.alertFrequency,
        },
      });

      return duplicate;
    }),
});
