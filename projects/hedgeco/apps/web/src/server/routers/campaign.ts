// Campaign router - Email campaign management

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { CampaignStatus, Prisma } from '@prisma/client';

export const campaignRouter = router({
  /**
   * Create a new email campaign
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        subject: z.string().min(1).max(200),
        content: z.string().min(1),
        templateId: z.string().optional(),
        audienceFilter: z
          .object({
            roles: z.array(z.string()).optional(),
            accredited: z.boolean().optional(),
            investorTypes: z.array(z.string()).optional(),
            fundIds: z.array(z.string()).optional(),
            tags: z.array(z.string()).optional(),
            subscriptionPlans: z.array(z.string()).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.emailCampaign.create({
        data: {
          userId: ctx.user.sub,
          name: input.name,
          subject: input.subject,
          content: input.content,
          templateId: input.templateId,
          audienceFilter: input.audienceFilter as Prisma.InputJsonValue,
          status: CampaignStatus.DRAFT,
        },
      });

      return campaign;
    }),

  /**
   * List campaigns with optional status filter
   */
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(CampaignStatus).optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.sub;
      const { status, page = 1, limit = 20 } = input || {};
      const skip = (page - 1) * limit;

      const where: Prisma.EmailCampaignWhereInput = {
        userId,
        ...(status && { status }),
      };

      const [campaigns, total] = await Promise.all([
        ctx.prisma.emailCampaign.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.emailCampaign.count({ where }),
      ]);

      return {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Get a specific campaign
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.emailCampaign.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.sub,
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      return campaign;
    }),

  /**
   * Update campaign details
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().min(1).max(100).optional(),
          subject: z.string().min(1).max(200).optional(),
          content: z.string().min(1).optional(),
          templateId: z.string().nullable().optional(),
          audienceFilter: z
            .object({
              roles: z.array(z.string()).optional(),
              accredited: z.boolean().optional(),
              investorTypes: z.array(z.string()).optional(),
              fundIds: z.array(z.string()).optional(),
              tags: z.array(z.string()).optional(),
              subscriptionPlans: z.array(z.string()).optional(),
            })
            .optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify ownership and status
      const existing = await ctx.prisma.emailCampaign.findFirst({
        where: { id, userId: ctx.user.sub },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      if (existing.status !== CampaignStatus.DRAFT) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only edit draft campaigns',
        });
      }

      const campaign = await ctx.prisma.emailCampaign.update({
        where: { id },
        data: {
          ...data,
          audienceFilter: data.audienceFilter as Prisma.InputJsonValue,
        },
      });

      return campaign;
    }),

  /**
   * Delete a campaign (only drafts)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.emailCampaign.findFirst({
        where: { id: input.id, userId: ctx.user.sub },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      if (campaign.status !== CampaignStatus.DRAFT) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only delete draft campaigns',
        });
      }

      await ctx.prisma.emailCampaign.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Schedule a campaign for future sending
   */
  schedule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        scheduledFor: z.string().datetime(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, scheduledFor } = input;
      const scheduledDate = new Date(scheduledFor);

      // Verify ownership and status
      const campaign = await ctx.prisma.emailCampaign.findFirst({
        where: { id, userId: ctx.user.sub },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      if (campaign.status !== CampaignStatus.DRAFT) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only schedule draft campaigns',
        });
      }

      if (scheduledDate <= new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Scheduled time must be in the future',
        });
      }

      const updated = await ctx.prisma.emailCampaign.update({
        where: { id },
        data: {
          status: CampaignStatus.SCHEDULED,
          scheduledFor: scheduledDate,
        },
      });

      // Queue the scheduled send job
      await ctx.prisma.jobQueue.create({
        data: {
          queue: 'campaigns',
          jobType: 'SEND_CAMPAIGN',
          payload: { campaignId: id },
          scheduledAt: scheduledDate,
        },
      });

      return updated;
    }),

  /**
   * Send a campaign immediately
   */
  send: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.emailCampaign.findFirst({
        where: { id: input.id, userId: ctx.user.sub },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      if (
        campaign.status !== CampaignStatus.DRAFT &&
        campaign.status !== CampaignStatus.SCHEDULED
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Campaign cannot be sent in current status',
        });
      }

      // Update status to sending
      const updated = await ctx.prisma.emailCampaign.update({
        where: { id: input.id },
        data: {
          status: CampaignStatus.SENDING,
        },
      });

      // Queue immediate send job
      await ctx.prisma.jobQueue.create({
        data: {
          queue: 'campaigns',
          jobType: 'SEND_CAMPAIGN',
          payload: { campaignId: input.id },
          priority: 10, // High priority
        },
      });

      return updated;
    }),

  /**
   * Cancel a scheduled campaign
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.emailCampaign.findFirst({
        where: { id: input.id, userId: ctx.user.sub },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      if (campaign.status !== CampaignStatus.SCHEDULED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only cancel scheduled campaigns',
        });
      }

      const updated = await ctx.prisma.emailCampaign.update({
        where: { id: input.id },
        data: {
          status: CampaignStatus.CANCELLED,
          scheduledFor: null,
        },
      });

      // Cancel the scheduled job
      await ctx.prisma.jobQueue.updateMany({
        where: {
          queue: 'campaigns',
          jobType: 'SEND_CAMPAIGN',
          status: 'PENDING',
          payload: {
            path: ['campaignId'],
            equals: input.id,
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      return updated;
    }),

  /**
   * Get campaign statistics
   */
  getStats: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.emailCampaign.findFirst({
        where: { id: input.id, userId: ctx.user.sub },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      // Parse stored stats or return defaults
      const stats = (campaign.stats as Record<string, unknown>) || {};

      return {
        campaignId: campaign.id,
        status: campaign.status,
        sentAt: campaign.sentAt,
        recipients: (stats.recipients as number) || 0,
        delivered: (stats.delivered as number) || 0,
        opened: (stats.opened as number) || 0,
        clicked: (stats.clicked as number) || 0,
        bounced: (stats.bounced as number) || 0,
        unsubscribed: (stats.unsubscribed as number) || 0,
        openRate:
          stats.recipients && (stats.recipients as number) > 0
            ? ((stats.opened as number) || 0) / (stats.recipients as number)
            : 0,
        clickRate:
          stats.opened && (stats.opened as number) > 0
            ? ((stats.clicked as number) || 0) / (stats.opened as number)
            : 0,
      };
    }),

  /**
   * Preview email content (with template rendering)
   */
  preview: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.emailCampaign.findFirst({
        where: { id: input.id, userId: ctx.user.sub },
      });

      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }

      // Count target audience
      const audienceFilter = campaign.audienceFilter as Record<string, unknown> | null;
      let audienceCount = 0;

      if (audienceFilter) {
        const where: Prisma.UserWhereInput = {
          active: true,
        };
        if (audienceFilter.roles) {
          where.role = { in: audienceFilter.roles as string[] } as Prisma.EnumUserRoleFilter<"User">;
        }
        if (audienceFilter.accredited !== undefined) {
          where.profile = { accredited: audienceFilter.accredited as boolean };
        }
        audienceCount = await ctx.prisma.user.count({ where });
      } else {
        // No filter = all active users with email notifications
        audienceCount = await ctx.prisma.user.count({
          where: {
            active: true,
            profile: { emailNotifications: true },
          },
        });
      }

      return {
        subject: campaign.subject,
        content: campaign.content,
        audienceCount,
        previewHtml: renderEmailPreview(campaign.subject, campaign.content),
      };
    }),
});

// Simple email preview renderer
function renderEmailPreview(subject: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; line-height: 1.6; }
    .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>HedgeCo.Net</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>You received this email because you're subscribed to HedgeCo.Net updates.</p>
    <p><a href="#">Unsubscribe</a> | <a href="#">Manage Preferences</a></p>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
