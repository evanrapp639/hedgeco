// CRM router - Contact and deal management

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { CrmStage, Prisma } from '@prisma/client';

export const crmRouter = router({
  /**
   * List contacts with filtering and pagination
   */
  listContacts: protectedProcedure
    .input(
      z.object({
        stage: z.nativeEnum(CrmStage).optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        sortBy: z.enum(['name', 'createdAt', 'lastContactedAt', 'stage']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { stage, search, tags, page, limit, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;
      const userId = ctx.user.sub;

      const where: Prisma.CrmContactWhereInput = {
        userId,
        ...(stage && { stage }),
        ...(tags?.length && { tags: { hasSome: tags } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      const [contacts, total] = await Promise.all([
        ctx.prisma.crmContact.findMany({
          where,
          include: {
            deals: {
              select: {
                id: true,
                name: true,
                value: true,
                stage: true,
              },
            },
            _count: { select: { deals: true } },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        ctx.prisma.crmContact.count({ where }),
      ]);

      return {
        contacts: contacts.map((c) => ({
          ...c,
          dealCount: c._count.deals,
          totalDealValue: c.deals.reduce(
            (sum: number, d) => sum + (d.value?.toNumber() || 0),
            0
          ),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Get single contact with full deal history
   */
  getContact: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contact = await ctx.prisma.crmContact.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.sub,
        },
        include: {
          deals: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      return contact;
    }),

  /**
   * Create new contact
   */
  createContact: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        email: z.string().email(),
        company: z.string().max(200).optional(),
        title: z.string().max(200).optional(),
        phone: z.string().max(50).optional(),
        notes: z.string().max(5000).optional(),
        tags: z.array(z.string()).default([]),
        stage: z.nativeEnum(CrmStage).default('LEAD'),
        source: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.prisma.crmContact.create({
        data: {
          userId: ctx.user.sub,
          ...input,
        },
      });

      return contact;
    }),

  /**
   * Update contact
   */
  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        email: z.string().email().optional(),
        company: z.string().max(200).optional().nullable(),
        title: z.string().max(200).optional().nullable(),
        phone: z.string().max(50).optional().nullable(),
        notes: z.string().max(5000).optional().nullable(),
        tags: z.array(z.string()).optional(),
        stage: z.nativeEnum(CrmStage).optional(),
        source: z.string().max(100).optional().nullable(),
        lastContactedAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const userId = ctx.user.sub;

      // Verify ownership
      const existing = await ctx.prisma.crmContact.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const contact = await ctx.prisma.crmContact.update({
        where: { id },
        data,
      });

      return contact;
    }),

  /**
   * Delete contact
   */
  deleteContact: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      // Verify ownership
      const existing = await ctx.prisma.crmContact.findFirst({
        where: { id: input.id, userId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      await ctx.prisma.crmContact.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * List deals (pipeline view)
   */
  listDeals: protectedProcedure
    .input(
      z.object({
        stage: z.nativeEnum(CrmStage).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { stage, page, limit } = input;
      const skip = (page - 1) * limit;
      const userId = ctx.user.sub;

      const where: Prisma.CrmDealWhereInput = {
        contact: { userId },
        ...(stage && { stage }),
      };

      const [deals, total] = await Promise.all([
        ctx.prisma.crmDeal.findMany({
          where,
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              },
            },
          },
          orderBy: [{ stage: 'asc' }, { expectedCloseDate: 'asc' }],
          skip,
          take: limit,
        }),
        ctx.prisma.crmDeal.count({ where }),
      ]);

      // Group by stage for pipeline view
      const pipeline = await ctx.prisma.crmDeal.groupBy({
        by: ['stage'],
        where: { contact: { userId } },
        _count: true,
        _sum: { value: true },
      });

      return {
        deals,
        pipeline: pipeline.map((p) => ({
          stage: p.stage,
          count: p._count,
          totalValue: p._sum.value?.toNumber() || 0,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Create deal
   */
  createDeal: protectedProcedure
    .input(
      z.object({
        contactId: z.string(),
        name: z.string().min(1).max(200),
        value: z.number().min(0).optional(),
        stage: z.nativeEnum(CrmStage).default('LEAD'),
        probability: z.number().min(0).max(100).default(0),
        expectedCloseDate: z.date().optional(),
        notes: z.string().max(5000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      // Verify contact ownership
      const contact = await ctx.prisma.crmContact.findFirst({
        where: { id: input.contactId, userId },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const deal = await ctx.prisma.crmDeal.create({
        data: input,
      });

      return deal;
    }),

  /**
   * Update deal stage (for drag-drop pipeline)
   */
  updateDealStage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        stage: z.nativeEnum(CrmStage),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      // Verify deal belongs to user's contact
      const deal = await ctx.prisma.crmDeal.findFirst({
        where: {
          id: input.id,
          contact: { userId },
        },
      });

      if (!deal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }

      // Auto-update probability based on stage
      const stageProbabilities: Record<CrmStage, number> = {
        LEAD: 10,
        QUALIFIED: 25,
        MEETING: 40,
        PROPOSAL: 60,
        NEGOTIATION: 80,
        WON: 100,
        LOST: 0,
      };

      const updated = await ctx.prisma.crmDeal.update({
        where: { id: input.id },
        data: {
          stage: input.stage,
          probability: stageProbabilities[input.stage],
        },
      });

      return updated;
    }),

  /**
   * Update full deal
   */
  updateDeal: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        value: z.number().min(0).optional().nullable(),
        stage: z.nativeEnum(CrmStage).optional(),
        probability: z.number().min(0).max(100).optional(),
        expectedCloseDate: z.date().optional().nullable(),
        notes: z.string().max(5000).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const userId = ctx.user.sub;

      // Verify ownership
      const deal = await ctx.prisma.crmDeal.findFirst({
        where: {
          id,
          contact: { userId },
        },
      });

      if (!deal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }

      const updated = await ctx.prisma.crmDeal.update({
        where: { id },
        data,
      });

      return updated;
    }),

  /**
   * Delete deal
   */
  deleteDeal: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      // Verify ownership
      const deal = await ctx.prisma.crmDeal.findFirst({
        where: {
          id: input.id,
          contact: { userId },
        },
      });

      if (!deal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }

      await ctx.prisma.crmDeal.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get pipeline summary metrics
   */
  getPipelineSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.sub;

    const pipeline = await ctx.prisma.crmDeal.groupBy({
      by: ['stage'],
      where: { contact: { userId } },
      _count: true,
      _sum: { value: true },
      _avg: { probability: true },
    });

    // Weighted pipeline value
    const deals = await ctx.prisma.crmDeal.findMany({
      where: { contact: { userId } },
      select: { value: true, probability: true },
    });

    const weightedValue = deals.reduce((sum: number, d) => {
      return sum + (d.value?.toNumber() || 0) * ((d.probability || 0) / 100);
    }, 0);

    // Deals closing soon (next 30 days)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const closingSoon = await ctx.prisma.crmDeal.count({
      where: {
        contact: { userId },
        expectedCloseDate: { lte: thirtyDaysFromNow },
        stage: { notIn: ['WON', 'LOST'] },
      },
    });

    return {
      stages: pipeline.map((p) => ({
        stage: p.stage,
        count: p._count,
        totalValue: p._sum.value?.toNumber() || 0,
        avgProbability: p._avg.probability || 0,
      })),
      totalDeals: deals.length,
      totalValue: deals.reduce((sum: number, d) => sum + (d.value?.toNumber() || 0), 0),
      weightedValue,
      closingSoon,
    };
  }),

  /**
   * Get all unique tags for autocomplete
   */
  getTags: protectedProcedure.query(async ({ ctx }) => {
    const contacts = await ctx.prisma.crmContact.findMany({
      where: { userId: ctx.user.sub },
      select: { tags: true },
    });

    const allTags = contacts.flatMap((c) => c.tags);
    const uniqueTags = Array.from(new Set(allTags)).sort();

    return { tags: uniqueTags };
  }),
});
