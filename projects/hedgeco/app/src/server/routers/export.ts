// Export router - Bulk data exports

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ReportFormat, ExecutionStatus, ExportType, Prisma, UserRole } from '@prisma/client';

export const exportRouter = router({
  /**
   * Export funds in bulk with filters
   */
  exportFunds: protectedProcedure
    .input(
      z.object({
        filters: z
          .object({
            types: z.array(z.string()).optional(),
            strategies: z.array(z.string()).optional(),
            minAum: z.number().optional(),
            maxAum: z.number().optional(),
            countries: z.array(z.string()).optional(),
            statuses: z.array(z.string()).optional(),
            inceptionDateFrom: z.string().optional(),
            inceptionDateTo: z.string().optional(),
          })
          .optional(),
        format: z.nativeEnum(ReportFormat).default(ReportFormat.CSV),
        columns: z
          .array(z.string())
          .optional()
          .default([
            'name',
            'type',
            'strategy',
            'aum',
            'managementFee',
            'performanceFee',
            'inceptionDate',
            'country',
          ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      // Create export job
      const exportJob = await ctx.prisma.exportJob.create({
        data: {
          userId,
          type: ExportType.FUNDS,
          filters: {
            ...input.filters,
            columns: input.columns,
          } as Prisma.InputJsonValue,
          format: input.format,
          status: ExecutionStatus.PENDING,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Queue export job
      await ctx.prisma.jobQueue.create({
        data: {
          queue: 'exports',
          jobType: 'BULK_EXPORT',
          payload: {
            exportJobId: exportJob.id,
            type: ExportType.FUNDS,
            filters: input.filters,
            format: input.format,
            columns: input.columns,
            userId,
          },
          priority: 5,
        },
      });

      return {
        exportId: exportJob.id,
        status: exportJob.status,
        message: 'Export started. You will be notified when it completes.',
      };
    }),

  /**
   * Export users (admin only)
   */
  exportUsers: adminProcedure
    .input(
      z.object({
        filters: z
          .object({
            roles: z.array(z.nativeEnum(UserRole)).optional(),
            active: z.boolean().optional(),
            accredited: z.boolean().optional(),
            createdAfter: z.string().optional(),
            createdBefore: z.string().optional(),
          })
          .optional(),
        format: z.nativeEnum(ReportFormat).default(ReportFormat.CSV),
        columns: z
          .array(z.string())
          .optional()
          .default(['email', 'firstName', 'lastName', 'role', 'company', 'createdAt']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      const exportJob = await ctx.prisma.exportJob.create({
        data: {
          userId,
          type: ExportType.USERS,
          filters: {
            ...input.filters,
            columns: input.columns,
          } as Prisma.InputJsonValue,
          format: input.format,
          status: ExecutionStatus.PENDING,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await ctx.prisma.jobQueue.create({
        data: {
          queue: 'exports',
          jobType: 'BULK_EXPORT',
          payload: {
            exportJobId: exportJob.id,
            type: ExportType.USERS,
            filters: input.filters,
            format: input.format,
            columns: input.columns,
            userId,
          },
          priority: 5,
        },
      });

      return {
        exportId: exportJob.id,
        status: exportJob.status,
        message: 'User export started. You will be notified when it completes.',
      };
    }),

  /**
   * Export analytics data
   */
  exportAnalytics: protectedProcedure
    .input(
      z.object({
        dateRange: z.object({
          start: z.string().datetime(),
          end: z.string().datetime(),
        }),
        metrics: z
          .array(z.string())
          .optional()
          .default(['views', 'searches', 'inquiries', 'downloads']),
        groupBy: z.enum(['day', 'week', 'month']).default('day'),
        format: z.nativeEnum(ReportFormat).default(ReportFormat.CSV),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      const exportJob = await ctx.prisma.exportJob.create({
        data: {
          userId,
          type: ExportType.ANALYTICS,
          filters: {
            dateRange: input.dateRange,
            metrics: input.metrics,
            groupBy: input.groupBy,
          } as Prisma.InputJsonValue,
          format: input.format,
          status: ExecutionStatus.PENDING,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await ctx.prisma.jobQueue.create({
        data: {
          queue: 'exports',
          jobType: 'BULK_EXPORT',
          payload: {
            exportJobId: exportJob.id,
            type: ExportType.ANALYTICS,
            dateRange: input.dateRange,
            metrics: input.metrics,
            groupBy: input.groupBy,
            format: input.format,
            userId,
          },
          priority: 5,
        },
      });

      return {
        exportId: exportJob.id,
        status: exportJob.status,
        message: 'Analytics export started.',
      };
    }),

  /**
   * Export CRM contacts
   */
  exportContacts: protectedProcedure
    .input(
      z.object({
        filters: z
          .object({
            stages: z.array(z.string()).optional(),
            tags: z.array(z.string()).optional(),
            source: z.string().optional(),
          })
          .optional(),
        format: z.nativeEnum(ReportFormat).default(ReportFormat.CSV),
        includeDeals: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      const exportJob = await ctx.prisma.exportJob.create({
        data: {
          userId,
          type: ExportType.CONTACTS,
          filters: {
            ...input.filters,
            includeDeals: input.includeDeals,
          } as Prisma.InputJsonValue,
          format: input.format,
          status: ExecutionStatus.PENDING,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await ctx.prisma.jobQueue.create({
        data: {
          queue: 'exports',
          jobType: 'BULK_EXPORT',
          payload: {
            exportJobId: exportJob.id,
            type: ExportType.CONTACTS,
            filters: input.filters,
            includeDeals: input.includeDeals,
            format: input.format,
            userId,
          },
          priority: 5,
        },
      });

      return {
        exportId: exportJob.id,
        status: exportJob.status,
        message: 'Contacts export started.',
      };
    }),

  /**
   * Get user's export history
   */
  getExportHistory: protectedProcedure
    .input(
      z
        .object({
          type: z.nativeEnum(ExportType).optional(),
          status: z.nativeEnum(ExecutionStatus).optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.sub;
      const { type, status, page = 1, limit = 20 } = input || {};
      const skip = (page - 1) * limit;

      const where: Prisma.ExportJobWhereInput = {
        userId,
        ...(type && { type }),
        ...(status && { status }),
      };

      const [exports, total] = await Promise.all([
        ctx.prisma.exportJob.findMany({
          where,
          orderBy: { startedAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.exportJob.count({ where }),
      ]);

      return {
        exports: exports.map((e) => ({
          ...e,
          isExpired: e.expiresAt && e.expiresAt < new Date(),
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
   * Get export job status
   */
  getExportStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const exportJob = await ctx.prisma.exportJob.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.sub,
        },
      });

      if (!exportJob) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export not found',
        });
      }

      return {
        id: exportJob.id,
        type: exportJob.type,
        status: exportJob.status,
        format: exportJob.format,
        rowCount: exportJob.rowCount,
        fileSize: exportJob.fileSize,
        error: exportJob.error,
        startedAt: exportJob.startedAt,
        completedAt: exportJob.completedAt,
        isExpired: exportJob.expiresAt && exportJob.expiresAt < new Date(),
        expiresAt: exportJob.expiresAt,
      };
    }),

  /**
   * Download an export file
   */
  downloadExport: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const exportJob = await ctx.prisma.exportJob.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.sub,
        },
      });

      if (!exportJob) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export not found',
        });
      }

      if (exportJob.status !== ExecutionStatus.COMPLETED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Export not ready for download',
        });
      }

      if (!exportJob.fileUrl) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export file not found',
        });
      }

      if (exportJob.expiresAt && exportJob.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export file has expired and is no longer available',
        });
      }

      // Generate filename
      const extension = exportJob.format.toLowerCase();
      const timestamp = exportJob.startedAt.toISOString().split('T')[0];
      const fileName = `${exportJob.type.toLowerCase()}-export-${timestamp}.${extension}`;

      return {
        url: exportJob.fileUrl,
        fileName,
        fileSize: exportJob.fileSize,
        rowCount: exportJob.rowCount,
      };
    }),

  /**
   * Delete an export (cleanup)
   */
  deleteExport: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const exportJob = await ctx.prisma.exportJob.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.sub,
        },
      });

      if (!exportJob) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export not found',
        });
      }

      // TODO: Also delete file from storage if exists

      await ctx.prisma.exportJob.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
