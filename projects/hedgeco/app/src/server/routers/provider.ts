// Service Provider router - CRUD and search operations for service providers

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ProviderStatus, ProviderTier, Prisma } from '@prisma/client';

// Provider categories based on hedge fund industry
const PROVIDER_CATEGORIES = [
  'Prime Brokerage',
  'Fund Administration',
  'Legal Services',
  'Audit & Accounting',
  'Compliance',
  'Technology',
  'Data & Analytics',
  'Risk Management',
  'Marketing & IR',
  'Recruiting',
  'Office Space',
  'Insurance',
  'Custody',
  'Trading Systems',
  'Research',
  'Consulting',
] as const;

export const providerRouter = router({
  /**
   * List providers with filters and pagination
   */
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        tier: z.nativeEnum(ProviderTier).optional(),
        featured: z.boolean().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { category, city, state, country, tier, featured, cursor, limit } = input;

      const where: Prisma.ServiceProviderWhereInput = {
        status: ProviderStatus.APPROVED,
        visible: true,
        ...(category && { category }),
        ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
        ...(state && { state }),
        ...(country && { country }),
        ...(tier && { tier }),
        ...(featured && { featured }),
      };

      const providers = await ctx.prisma.serviceProvider.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [
          { featured: 'desc' },
          { tier: 'desc' },
          { companyName: 'asc' },
        ],
        select: {
          id: true,
          companyName: true,
          slug: true,
          category: true,
          subcategories: true,
          tagline: true,
          city: true,
          state: true,
          country: true,
          tier: true,
          featured: true,
          website: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (providers.length > limit) {
        const nextItem = providers.pop();
        nextCursor = nextItem!.id;
      }

      return {
        providers,
        nextCursor,
      };
    }),

  /**
   * Get provider by slug - public details
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const provider = await ctx.prisma.serviceProvider.findUnique({
        where: {
          slug: input.slug,
          status: ProviderStatus.APPROVED,
          visible: true,
        },
        include: {
          testimonials: {
            where: { approved: true },
            select: {
              id: true,
              authorName: true,
              authorTitle: true,
              authorCompany: true,
              content: true,
              rating: true,
            },
          },
          user: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service provider not found',
        });
      }

      // Increment view count
      await ctx.prisma.serviceProvider.update({
        where: { id: provider.id },
        data: { viewCount: { increment: 1 } },
      });

      return provider;
    }),

  /**
   * Get featured providers for homepage/sidebar
   */
  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(6) }))
    .query(async ({ ctx, input }) => {
      const providers = await ctx.prisma.serviceProvider.findMany({
        where: {
          status: ProviderStatus.APPROVED,
          visible: true,
          featured: true,
        },
        take: input.limit,
        orderBy: [
          { tier: 'desc' },
          { viewCount: 'desc' },
        ],
        select: {
          id: true,
          companyName: true,
          slug: true,
          category: true,
          tagline: true,
          tier: true,
        },
      });

      return providers;
    }),

  /**
   * Search providers by text query
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        category: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, category, limit } = input;

      const providers = await ctx.prisma.serviceProvider.findMany({
        where: {
          status: ProviderStatus.APPROVED,
          visible: true,
          ...(category && { category }),
          OR: [
            { companyName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tagline: { contains: query, mode: 'insensitive' } },
            { subcategories: { has: query } },
          ],
        },
        take: limit,
        orderBy: [
          { featured: 'desc' },
          { tier: 'desc' },
        ],
        select: {
          id: true,
          companyName: true,
          slug: true,
          category: true,
          subcategories: true,
          tagline: true,
          city: true,
          state: true,
          country: true,
          tier: true,
          featured: true,
        },
      });

      return providers;
    }),

  /**
   * Get list of provider categories with counts
   */
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const counts = await ctx.prisma.serviceProvider.groupBy({
      by: ['category'],
      where: {
        status: ProviderStatus.APPROVED,
        visible: true,
      },
      _count: true,
    });

    // Include all categories, even those with 0 providers
    const categoryMap = new Map(counts.map((c) => [c.category, c._count]));
    
    return PROVIDER_CATEGORIES.map((cat) => ({
      category: cat,
      count: categoryMap.get(cat) || 0,
    }));
  }),

  /**
   * Create provider profile (for service provider accounts)
   */
  create: protectedProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        category: z.string(),
        subcategories: z.array(z.string()).optional(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        website: z.string().url().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().default('US'),
        linkedIn: z.string().optional(),
        twitter: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a provider profile
      const existing = await ctx.prisma.serviceProvider.findUnique({
        where: { userId: ctx.user.sub },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have a service provider profile',
        });
      }

      // Generate slug
      const slug = input.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const existingSlug = await ctx.prisma.serviceProvider.findUnique({
        where: { slug },
      });

      const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

      const provider = await ctx.prisma.serviceProvider.create({
        data: {
          ...input,
          slug: finalSlug,
          userId: ctx.user.sub,
          status: ProviderStatus.PENDING,
          tier: ProviderTier.BASIC,
        },
      });

      // Update user role to SERVICE_PROVIDER
      await ctx.prisma.user.update({
        where: { id: ctx.user.sub },
        data: { role: 'SERVICE_PROVIDER' },
      });

      return provider;
    }),

  /**
   * Update provider profile (own profile only)
   */
  update: protectedProcedure
    .input(
      z.object({
        data: z.object({
          companyName: z.string().min(1).optional(),
          category: z.string().optional(),
          subcategories: z.array(z.string()).optional(),
          tagline: z.string().optional(),
          description: z.string().optional(),
          website: z.string().url().optional().nullable(),
          phone: z.string().optional().nullable(),
          email: z.string().email().optional().nullable(),
          address: z.string().optional().nullable(),
          city: z.string().optional().nullable(),
          state: z.string().optional().nullable(),
          postalCode: z.string().optional().nullable(),
          country: z.string().optional(),
          linkedIn: z.string().optional().nullable(),
          twitter: z.string().optional().nullable(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.prisma.serviceProvider.findUnique({
        where: { userId: ctx.user.sub },
      });

      if (!provider) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Provider profile not found',
        });
      }

      const updated = await ctx.prisma.serviceProvider.update({
        where: { id: provider.id },
        data: input.data,
      });

      return updated;
    }),

  /**
   * Get own provider profile
   */
  getOwn: protectedProcedure.query(async ({ ctx }) => {
    const provider = await ctx.prisma.serviceProvider.findUnique({
      where: { userId: ctx.user.sub },
      include: {
        testimonials: true,
      },
    });

    if (!provider) {
      return null;
    }

    return provider;
  }),

  /**
   * Record contact click (for analytics)
   */
  recordContact: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.serviceProvider.update({
        where: { id: input.providerId },
        data: { contactCount: { increment: 1 } },
      });

      // Log activity
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'CONTACT',
          entityType: 'PROVIDER',
          entityId: input.providerId,
        },
      });

      return { success: true };
    }),

  /**
   * Admin: Approve/reject provider
   */
  setStatus: adminProcedure
    .input(
      z.object({
        providerId: z.string(),
        status: z.nativeEnum(ProviderStatus),
        visible: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.serviceProvider.update({
        where: { id: input.providerId },
        data: {
          status: input.status,
          ...(input.visible !== undefined && { visible: input.visible }),
        },
      });

      return updated;
    }),
});
