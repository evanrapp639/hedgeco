// User router - Profile and account operations

import { z } from 'zod';
import { router, protectedProcedure, investorProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  /**
   * Get current user's profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.sub },
      include: {
        profile: true,
        serviceProvider: {
          select: {
            id: true,
            companyName: true,
            slug: true,
            category: true,
            tier: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: !!user.emailVerified,
      profile: user.profile,
      serviceProvider: user.serviceProvider,
      createdAt: user.createdAt,
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        displayName: z.string().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        phone: z.string().optional(),
        linkedIn: z.string().url().optional().or(z.literal('')),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        timezone: z.string().optional(),
        emailNotifications: z.boolean().optional(),
        marketingEmails: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Filter out empty strings and undefined values
      const cleanInput = Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined && v !== '')
      );

      const profile = await ctx.prisma.profile.update({
        where: { userId: ctx.user.sub },
        data: cleanInput,
      });

      return profile;
    }),

  /**
   * Get user's watchlist
   */
  getWatchlist: investorProcedure.query(async ({ ctx }) => {
    const watchlist = await ctx.prisma.watchlist.findMany({
      where: { userId: ctx.user.sub },
      include: {
        fund: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            strategy: true,
            aum: true,
            statistics: {
              select: {
                ytdReturn: true,
                oneYearReturn: true,
              },
            },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return watchlist;
  }),

  /**
   * Add fund to watchlist
   */
  addToWatchlist: investorProcedure
    .input(
      z.object({
        fundId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already in watchlist
      const existing = await ctx.prisma.watchlist.findUnique({
        where: {
          userId_fundId: {
            userId: ctx.user.sub,
            fundId: input.fundId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Fund is already in your watchlist',
        });
      }

      const entry = await ctx.prisma.watchlist.create({
        data: {
          userId: ctx.user.sub,
          fundId: input.fundId,
          notes: input.notes,
        },
        include: {
          fund: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });

      // Log activity
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'SAVE',
          entityType: 'FUND',
          entityId: input.fundId,
        },
      });

      return entry;
    }),

  /**
   * Remove fund from watchlist
   */
  removeFromWatchlist: investorProcedure
    .input(z.object({ fundId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.watchlist.delete({
        where: {
          userId_fundId: {
            userId: ctx.user.sub,
            fundId: input.fundId,
          },
        },
      });

      return { success: true };
    }),

  /**
   * Get user's saved searches
   */
  getSavedSearches: investorProcedure.query(async ({ ctx }) => {
    const searches = await ctx.prisma.savedSearch.findMany({
      where: { userId: ctx.user.sub },
      orderBy: { updatedAt: 'desc' },
    });

    return searches;
  }),

  /**
   * Save a search
   */
  saveSearch: investorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        query: z.string().optional(),
        filters: z.record(z.string(), z.unknown()),
        alertEnabled: z.boolean().default(false),
        alertFrequency: z.enum(['IMMEDIATELY', 'DAILY', 'WEEKLY']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const search = await ctx.prisma.savedSearch.create({
        data: {
          userId: ctx.user.sub,
          name: input.name,
          query: input.query,
          filters: input.filters as object,
          alertEnabled: input.alertEnabled,
          alertFrequency: input.alertFrequency,
        },
      });

      return search;
    }),

  /**
   * Delete a saved search
   */
  deleteSavedSearch: investorProcedure
    .input(z.object({ searchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const search = await ctx.prisma.savedSearch.findUnique({
        where: { id: input.searchId },
      });

      if (!search || search.userId !== ctx.user.sub) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Search not found',
        });
      }

      await ctx.prisma.savedSearch.delete({
        where: { id: input.searchId },
      });

      return { success: true };
    }),

  /**
   * Get user's recent activity
   */
  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const activities = await ctx.prisma.userActivity.findMany({
        where: { userId: ctx.user.sub },
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      });

      return activities;
    }),
});
