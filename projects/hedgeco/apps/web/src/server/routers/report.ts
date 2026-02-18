// Report router - Scheduled reports management

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { ReportType, ReportFormat, ExecutionStatus, Prisma } from '@prisma/client';

// Simple cron validation regex (basic format check)
const CRON_REGEX = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;

// Validate cron expression (basic validation)
function isValidCron(expression: string): boolean {
  // Accept standard 5-field cron or common presets
  const presets = ['@hourly', '@daily', '@weekly', '@monthly', '@yearly', '@annually'];
  if (presets.includes(expression)) return true;
  return CRON_REGEX.test(expression);
}

// Calculate next run time from cron expression (simplified)
function getNextRunTime(cronExpression: string): Date {
  const now = new Date();
  // For now, return a simple next hour calculation
  // In production, use a proper cron library
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

export const reportRouter = router({
  /**
   * Create a new scheduled report
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: z.nativeEnum(ReportType),
        schedule: z.string().refine(isValidCron, {
          message: 'Invalid cron expression',
        }),
        recipients: z.array(z.string().email()).min(1),
        filters: z
          .object({
            fundIds: z.array(z.string()).optional(),
            fundTypes: z.array(z.string()).optional(),
            dateRange: z
              .object({
                start: z.string().optional(),
                end: z.string().optional(),
              })
              .optional(),
            includeCharts: z.boolean().optional(),
            compareBenchmark: z.boolean().optional(),
          })
          .optional(),
        format: z.nativeEnum(ReportFormat).default(ReportFormat.PDF),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.sub;

      // Calculate next run time
      const nextRunAt = getNextRunTime(input.schedule);

      const report = await ctx.prisma.scheduledReport.create({
        data: {
          userId,
          name: input.name,
          type: input.type,
          schedule: input.schedule,
          recipients: input.recipients,
          filters: input.filters as Prisma.InputJsonValue,
          format: input.format,
          nextRunAt,
          enabled: true,
        },
      });

      return report;
    }),

  /**
   * List user's scheduled reports
   */
  list: protectedProcedure
    .input(
      z
        .object({
          enabled: z.boolean().optional(),
          type: z.nativeEnum(ReportType).optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.sub;
      const { enabled, type, page = 1, limit = 20 } = input || {};
      const skip = (page - 1) * limit;

      const where: Prisma.ScheduledReportWhereInput = {
        userId,
        ...(enabled !== undefined && { enabled }),
        ...(type && { type }),
      };

      const [reports, total] = await Promise.all([
        ctx.prisma.scheduledReport.findMany({
          where,
          include: {
            _count: { select: { executions: true } },
            executions: {
              take: 1,
              orderBy: { startedAt: 'desc' },
              select: {
                id: true,
                status: true,
                startedAt: true,
                completedAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.scheduledReport.count({ where }),
      ]);

      return {
        reports: reports.map((r) => ({
          ...r,
          executionCount: r._count.executions,
          lastExecution: r.executions[0] || null,
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
   * Get a specific report
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const report = await ctx.prisma.scheduledReport.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.sub,
        },
        include: {
          executions: {
            take: 10,
            orderBy: { startedAt: 'desc' },
          },
        },
      });

      if (!report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }

      return report;
    }),

  /**
   * Update report settings
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().min(1).max(100).optional(),
          schedule: z
            .string()
            .refine(isValidCron, { message: 'Invalid cron expression' })
            .optional(),
          recipients: z.array(z.string().email()).min(1).optional(),
          filters: z
            .object({
              fundIds: z.array(z.string()).optional(),
              fundTypes: z.array(z.string()).optional(),
              dateRange: z
                .object({
                  start: z.string().optional(),
                  end: z.string().optional(),
                })
                .optional(),
              includeCharts: z.boolean().optional(),
              compareBenchmark: z.boolean().optional(),
            })
            .optional(),
          format: z.nativeEnum(ReportFormat).optional(),
          enabled: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify ownership
      const existing = await ctx.prisma.scheduledReport.findFirst({
        where: { id, userId: ctx.user.sub },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }

      // Calculate new next run time if schedule changed
      let nextRunAt = existing.nextRunAt;
      if (data.schedule) {
        nextRunAt = getNextRunTime(data.schedule);
      }

      const report = await ctx.prisma.scheduledReport.update({
        where: { id },
        data: {
          ...data,
          filters: data.filters as Prisma.InputJsonValue,
          nextRunAt,
        },
      });

      return report;
    }),

  /**
   * Delete a scheduled report
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const report = await ctx.prisma.scheduledReport.findFirst({
        where: { id: input.id, userId: ctx.user.sub },
      });

      if (!report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }

      await ctx.prisma.scheduledReport.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Execute a report immediately
   */
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const report = await ctx.prisma.scheduledReport.findFirst({
        where: { id: input.id, userId: ctx.user.sub },
      });

      if (!report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }

      // Create execution record
      const execution = await ctx.prisma.reportExecution.create({
        data: {
          reportId: report.id,
          status: ExecutionStatus.PENDING,
        },
      });

      // Queue the report generation job
      await ctx.prisma.jobQueue.create({
        data: {
          queue: 'reports',
          jobType: 'GENERATE_REPORT',
          payload: {
            executionId: execution.id,
            reportId: report.id,
            type: report.type,
            format: report.format,
            filters: report.filters,
            recipients: report.recipients,
          },
          priority: 10, // High priority for manual execution
        },
      });

      return execution;
    }),

  /**
   * Get execution history for a report
   */
  getExecutions: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id, page, limit } = input;
      const skip = (page - 1) * limit;

      // Verify ownership
      const report = await ctx.prisma.scheduledReport.findFirst({
        where: { id, userId: ctx.user.sub },
      });

      if (!report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }

      const [executions, total] = await Promise.all([
        ctx.prisma.reportExecution.findMany({
          where: { reportId: id },
          orderBy: { startedAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.reportExecution.count({ where: { reportId: id } }),
      ]);

      return {
        executions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Download an execution result
   */
  downloadExecution: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const execution = await ctx.prisma.reportExecution.findFirst({
        where: { id: input.executionId },
        include: {
          report: {
            select: { userId: true, name: true, format: true },
          },
        },
      });

      if (!execution || execution.report.userId !== ctx.user.sub) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Execution not found',
        });
      }

      if (execution.status !== ExecutionStatus.COMPLETED || !execution.fileUrl) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Report not ready for download',
        });
      }

      // Return signed URL or file info
      return {
        url: execution.fileUrl,
        fileName: `${execution.report.name}-${execution.startedAt.toISOString().split('T')[0]}.${execution.report.format.toLowerCase()}`,
        fileSize: execution.fileSize,
      };
    }),
});
