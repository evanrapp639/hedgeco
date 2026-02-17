// Admin router - Platform administration operations

import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { UserRole, FundStatus } from '@prisma/client';

export const adminRouter = router({
  /**
   * Get platform statistics
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      pendingUsers,
      totalFunds,
      pendingFunds,
      totalProviders,
      recentActivity,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.user.count({ where: { emailVerified: null } }),
      ctx.prisma.fund.count(),
      ctx.prisma.fund.count({ where: { status: 'PENDING_REVIEW' } }),
      ctx.prisma.serviceProvider.count(),
      ctx.prisma.userActivity.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Get user breakdown by role
    const usersByRole = await ctx.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // Get fund breakdown by status
    const fundsByStatus = await ctx.prisma.fund.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get new users this week
    const newUsersThisWeek = await ctx.prisma.user.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    // Get new funds this week
    const newFundsThisWeek = await ctx.prisma.fund.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    return {
      users: {
        total: totalUsers,
        pending: pendingUsers,
        newThisWeek: newUsersThisWeek,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      funds: {
        total: totalFunds,
        pending: pendingFunds,
        newThisWeek: newFundsThisWeek,
        byStatus: fundsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      providers: {
        total: totalProviders,
      },
      activity: {
        last24Hours: recentActivity,
      },
    };
  }),

  /**
   * Get users with filtering and pagination
   */
  getUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.nativeEnum(UserRole).optional(),
        status: z.enum(['active', 'pending', 'locked']).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        sortBy: z.enum(['createdAt', 'email', 'lastLoginAt']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, role, status, page, limit, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { profile: { firstName: { contains: search, mode: 'insensitive' } } },
          { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (status) {
        switch (status) {
          case 'active':
            where.active = true;
            where.locked = false;
            where.emailVerified = { not: null };
            break;
          case 'pending':
            where.emailVerified = null;
            break;
          case 'locked':
            where.locked = true;
            break;
        }
      }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            role: true,
            emailVerified: true,
            active: true,
            locked: true,
            lockedReason: true,
            lastLoginAt: true,
            createdAt: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                company: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Get single user details
   */
  getUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          profile: true,
          funds: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              createdAt: true,
            },
          },
          serviceProvider: {
            select: {
              id: true,
              companyName: true,
              slug: true,
              status: true,
            },
          },
          activities: {
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  /**
   * Update user role
   */
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent changing own role
      if (input.userId === ctx.user.sub) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot change your own role',
        });
      }

      // Only SUPER_ADMIN can create other admins
      if (
        (input.role === 'ADMIN' || input.role === 'SUPER_ADMIN') &&
        ctx.user.role !== 'SUPER_ADMIN'
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only super admins can assign admin roles',
        });
      }

      const user = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, email: true, role: true },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.sub,
          action: 'PERMISSION_CHANGE',
          entityType: 'USER',
          entityId: input.userId,
          newValues: { role: input.role },
        },
      });

      return user;
    }),

  /**
   * Suspend/activate user
   */
  updateUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        action: z.enum(['activate', 'suspend', 'lock']),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent changing own status
      if (input.userId === ctx.user.sub) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot change your own status',
        });
      }

      const updateData: Record<string, unknown> = {};

      switch (input.action) {
        case 'activate':
          updateData.active = true;
          updateData.locked = false;
          updateData.lockedReason = null;
          updateData.lockedAt = null;
          break;
        case 'suspend':
          updateData.active = false;
          break;
        case 'lock':
          updateData.locked = true;
          updateData.lockedAt = new Date();
          updateData.lockedReason = input.reason || 'Locked by admin';
          break;
      }

      const user = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: updateData,
        select: { id: true, email: true, active: true, locked: true },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.sub,
          action: 'UPDATE',
          entityType: 'USER',
          entityId: input.userId,
          metadata: { reason: input.reason },
        },
      });

      return user;
    }),

  /**
   * Delete user (soft delete by deactivating)
   */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent deleting own account
      if (input.userId === ctx.user.sub) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete your own account',
        });
      }

      // Check if user exists
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Soft delete - deactivate and lock
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          active: false,
          locked: true,
          lockedAt: new Date(),
          lockedReason: 'Account deleted by admin',
          email: `deleted_${Date.now()}_${user.email}`, // Prevent email reuse
        },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.sub,
          action: 'DELETE',
          entityType: 'USER',
          entityId: input.userId,
          oldValues: { email: user.email },
        },
      });

      return { success: true };
    }),

  /**
   * Get funds with filtering (for approval workflow)
   */
  getFunds: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.nativeEnum(FundStatus).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { manager: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (status) {
        where.status = status;
      }

      const [funds, total] = await Promise.all([
        ctx.prisma.fund.findMany({
          where,
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            strategy: true,
            status: true,
            aum: true,
            createdAt: true,
            updatedAt: true,
            manager: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    company: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.fund.count({ where }),
      ]);

      return {
        funds,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Get single fund for review
   */
  getFund: adminProcedure
    .input(z.object({ fundId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: input.fundId },
        include: {
          manager: {
            select: {
              id: true,
              email: true,
              profile: true,
            },
          },
          statistics: true,
          documents: {
            take: 10,
            orderBy: { uploadedAt: 'desc' },
          },
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      return fund;
    }),

  /**
   * Approve fund
   */
  approveFund: adminProcedure
    .input(
      z.object({
        fundId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: input.fundId },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      if (fund.status !== 'PENDING_REVIEW') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Fund is not pending review',
        });
      }

      const updatedFund = await ctx.prisma.fund.update({
        where: { id: input.fundId },
        data: {
          status: 'APPROVED',
          visible: true,
          approvedAt: new Date(),
          approvedBy: ctx.user.sub,
        },
        select: { id: true, name: true, status: true },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.sub,
          action: 'UPDATE',
          entityType: 'FUND',
          entityId: input.fundId,
          metadata: { notes: input.notes },
        },
      });

      return updatedFund;
    }),

  /**
   * Reject fund
   */
  rejectFund: adminProcedure
    .input(
      z.object({
        fundId: z.string(),
        reason: z.string().min(1, 'Rejection reason is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: input.fundId },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      const updatedFund = await ctx.prisma.fund.update({
        where: { id: input.fundId },
        data: {
          status: 'REJECTED',
          visible: false,
        },
        select: { id: true, name: true, status: true },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.sub,
          action: 'UPDATE',
          entityType: 'FUND',
          entityId: input.fundId,
          metadata: { reason: input.reason },
        },
      });

      return updatedFund;
    }),

  /**
   * Update fund status
   */
  updateFundStatus: adminProcedure
    .input(
      z.object({
        fundId: z.string(),
        status: z.nativeEnum(FundStatus),
        visible: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fund = await ctx.prisma.fund.update({
        where: { id: input.fundId },
        data: {
          status: input.status,
          visible: input.visible,
        },
        select: { id: true, name: true, status: true, visible: true },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.sub,
          action: 'UPDATE',
          entityType: 'FUND',
          entityId: input.fundId,
          newValues: { status: input.status, visible: input.visible },
        },
      });

      return fund;
    }),

  /**
   * Get activity log
   */
  getActivityLog: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, action, entityType, limit, page } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (entityType) where.entityType = entityType;

      const [logs, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                email: true,
                profile: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.auditLog.count({ where }),
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Get recent platform activity
   */
  getRecentActivity: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const activities = await ctx.prisma.userActivity.findMany({
        take: input.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              profile: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      });

      return activities;
    }),
});
