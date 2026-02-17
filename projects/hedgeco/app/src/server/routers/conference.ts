// Conference router - Industry events and conferences

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ConferenceStatus, Prisma } from '@prisma/client';

export const conferenceRouter = router({
  /**
   * List conferences with filters and pagination
   */
  list: publicProcedure
    .input(
      z.object({
        upcoming: z.boolean().optional(),
        past: z.boolean().optional(),
        featured: z.boolean().optional(),
        virtual: z.boolean().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { upcoming, past, featured, virtual, city, country, cursor, limit } = input;
      const now = new Date();

      // Build where clause
      let statusFilter: Prisma.ConferenceWhereInput = {};
      
      if (upcoming === true && past !== true) {
        statusFilter = {
          startDate: { gte: now },
          status: { in: [ConferenceStatus.UPCOMING, ConferenceStatus.ONGOING] },
        };
      } else if (past === true && upcoming !== true) {
        statusFilter = {
          OR: [
            { endDate: { lt: now } },
            { AND: [{ endDate: null }, { startDate: { lt: now } }] },
          ],
          status: ConferenceStatus.COMPLETED,
        };
      }

      const where: Prisma.ConferenceWhereInput = {
        visible: true,
        status: { not: ConferenceStatus.CANCELLED },
        ...statusFilter,
        ...(featured && { featured }),
        ...(virtual !== undefined && { virtual }),
        ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
        ...(country && { country }),
      };

      const conferences = await ctx.prisma.conference.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: upcoming ? { startDate: 'asc' } : { startDate: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          venue: true,
          city: true,
          state: true,
          country: true,
          virtual: true,
          startDate: true,
          endDate: true,
          timezone: true,
          ticketCost: true,
          earlyBirdCost: true,
          earlyBirdDeadline: true,
          organizer: true,
          status: true,
          featured: true,
        },
      });

      let nextCursor: string | undefined = undefined;
      if (conferences.length > limit) {
        const nextItem = conferences.pop();
        nextCursor = nextItem!.id;
      }

      return {
        conferences,
        nextCursor,
      };
    }),

  /**
   * Get conference by slug with full details
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const conference = await ctx.prisma.conference.findUnique({
        where: {
          slug: input.slug,
          visible: true,
        },
      });

      if (!conference) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conference not found',
        });
      }

      return conference;
    }),

  /**
   * Get featured/upcoming conferences for homepage
   */
  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(3) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();

      const conferences = await ctx.prisma.conference.findMany({
        where: {
          visible: true,
          status: { in: [ConferenceStatus.UPCOMING, ConferenceStatus.ONGOING] },
          startDate: { gte: now },
          featured: true,
        },
        take: input.limit,
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          country: true,
          virtual: true,
          startDate: true,
          endDate: true,
        },
      });

      return conferences;
    }),

  /**
   * Get next upcoming conferences (not necessarily featured)
   */
  getUpcoming: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const now = new Date();

      const conferences = await ctx.prisma.conference.findMany({
        where: {
          visible: true,
          status: { in: [ConferenceStatus.UPCOMING, ConferenceStatus.ONGOING] },
          startDate: { gte: now },
        },
        take: input.limit,
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          state: true,
          country: true,
          virtual: true,
          startDate: true,
          endDate: true,
          ticketCost: true,
          organizer: true,
        },
      });

      return conferences;
    }),

  /**
   * Get conference locations for filters
   */
  getLocations: publicProcedure.query(async ({ ctx }) => {
    const locations = await ctx.prisma.conference.groupBy({
      by: ['city', 'country'],
      where: {
        visible: true,
        city: { not: null },
      },
      _count: true,
      orderBy: { _count: { city: 'desc' } },
    });

    return locations
      .filter((l) => l.city)
      .map((l) => ({
        city: l.city!,
        country: l.country,
        count: l._count,
      }));
  }),

  /**
   * RSVP/Register interest for a conference
   * Note: This could integrate with external registration systems
   * For now, we'll track interest internally
   */
  rsvp: protectedProcedure
    .input(
      z.object({
        conferenceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conference = await ctx.prisma.conference.findUnique({
        where: { id: input.conferenceId },
      });

      if (!conference) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conference not found',
        });
      }

      // Log activity as RSVP
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'SAVE',
          entityType: 'CONFERENCE',
          entityId: input.conferenceId,
          metadata: { type: 'rsvp' },
        },
      });

      return {
        success: true,
        registrationUrl: conference.registrationUrl,
        message: conference.registrationUrl
          ? 'Interest registered. Click the link to complete registration.'
          : 'Interest registered successfully.',
      };
    }),

  /**
   * Check if user has RSVP'd to a conference
   */
  hasRsvp: protectedProcedure
    .input(z.object({ conferenceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.prisma.userActivity.findFirst({
        where: {
          userId: ctx.user.sub,
          entityType: 'CONFERENCE',
          entityId: input.conferenceId,
          action: 'SAVE',
          metadata: {
            path: ['type'],
            equals: 'rsvp',
          },
        },
      });

      return { hasRsvp: !!activity };
    }),

  /**
   * Get attendees/RSVPs for a conference (organizers/admins only)
   */
  getAttendees: adminProcedure
    .input(
      z.object({
        conferenceId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { conferenceId, cursor, limit } = input;

      const activities = await ctx.prisma.userActivity.findMany({
        where: {
          entityType: 'CONFERENCE',
          entityId: conferenceId,
          action: 'SAVE',
          metadata: {
            path: ['type'],
            equals: 'rsvp',
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  company: true,
                  title: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (activities.length > limit) {
        const nextItem = activities.pop();
        nextCursor = nextItem!.id;
      }

      return {
        attendees: activities.map((a) => ({
          userId: a.user.id,
          email: a.user.email,
          role: a.user.role,
          name: a.user.profile
            ? `${a.user.profile.firstName} ${a.user.profile.lastName}`
            : a.user.email,
          company: a.user.profile?.company,
          title: a.user.profile?.title,
          rsvpDate: a.createdAt,
        })),
        nextCursor,
      };
    }),

  /**
   * Create conference (admin only)
   */
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        venue: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        virtual: z.boolean().default(false),
        virtualUrl: z.string().url().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        timezone: z.string().default('America/New_York'),
        registrationUrl: z.string().url().optional(),
        ticketCost: z.number().optional(),
        earlyBirdCost: z.number().optional(),
        earlyBirdDeadline: z.date().optional(),
        organizer: z.string().optional(),
        organizerEmail: z.string().email().optional(),
        organizerPhone: z.string().optional(),
        organizerUrl: z.string().url().optional(),
        agenda: z.any().optional(),
        speakers: z.any().optional(),
        sponsors: z.any().optional(),
        featured: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate slug
      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const existing = await ctx.prisma.conference.findUnique({
        where: { slug },
      });

      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      const conference = await ctx.prisma.conference.create({
        data: {
          ...input,
          slug: finalSlug,
          status: ConferenceStatus.UPCOMING,
        },
      });

      return conference;
    }),

  /**
   * Update conference (admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        conferenceId: z.string(),
        data: z.object({
          name: z.string().min(1).optional(),
          description: z.string().optional().nullable(),
          venue: z.string().optional().nullable(),
          address: z.string().optional().nullable(),
          city: z.string().optional().nullable(),
          state: z.string().optional().nullable(),
          country: z.string().optional().nullable(),
          virtual: z.boolean().optional(),
          virtualUrl: z.string().url().optional().nullable(),
          startDate: z.date().optional(),
          endDate: z.date().optional().nullable(),
          timezone: z.string().optional(),
          registrationUrl: z.string().url().optional().nullable(),
          ticketCost: z.number().optional().nullable(),
          earlyBirdCost: z.number().optional().nullable(),
          earlyBirdDeadline: z.date().optional().nullable(),
          organizer: z.string().optional().nullable(),
          organizerEmail: z.string().email().optional().nullable(),
          organizerPhone: z.string().optional().nullable(),
          organizerUrl: z.string().url().optional().nullable(),
          agenda: z.any().optional(),
          speakers: z.any().optional(),
          sponsors: z.any().optional(),
          status: z.nativeEnum(ConferenceStatus).optional(),
          visible: z.boolean().optional(),
          featured: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conference = await ctx.prisma.conference.findUnique({
        where: { id: input.conferenceId },
      });

      if (!conference) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conference not found',
        });
      }

      const updated = await ctx.prisma.conference.update({
        where: { id: input.conferenceId },
        data: input.data,
      });

      return updated;
    }),

  /**
   * Delete conference (admin only, soft via status)
   */
  cancel: adminProcedure
    .input(z.object({ conferenceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.conference.update({
        where: { id: input.conferenceId },
        data: {
          status: ConferenceStatus.CANCELLED,
          visible: false,
        },
      });

      return updated;
    }),
});
