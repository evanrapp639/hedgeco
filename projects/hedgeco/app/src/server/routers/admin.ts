// Admin router - Platform administration operations

import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { UserRole, FundStatus, AccreditedStatus } from '@prisma/client';
import { sendAccreditedApprovalEmail, sendAccreditedRejectionEmail } from '@/lib/email';

export const adminRouter = router({
  /**
   * Get platform statistics
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      pendingUsers,
      pendingApprovalUsers,
      totalFunds,
      pendingFunds,
      totalProviders,
      recentActivity,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.user.count({ where: { emailVerified: null } }),
      ctx.prisma.user.count({ where: { accreditedStatus: 'PENDING' } }), // Users awaiting accredited approval
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
        pendingApproval: pendingApprovalUsers, // Users awaiting admin approval
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
        accreditedStatus: z.nativeEnum(AccreditedStatus).optional(), // Filter by accredited status
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        sortBy: z.enum(['createdAt', 'email', 'lastLoginAt']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, role, status, accreditedStatus, page, limit, sortBy, sortOrder } = input;
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

      // Filter by accredited investor status (PENDING, APPROVED, REJECTED)
      if (accreditedStatus) {
        where.accreditedStatus = accreditedStatus;
      }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            role: true,
            accreditedStatus: true, // Accredited investor status
            accreditedReason: true,
            accreditedChangedAt: true,
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

  // ============================================================
  // USER APPROVAL WORKFLOW
  // ============================================================

  /**
   * Get users pending accredited investor approval
   * These are users who have verified their email but need admin approval for accredited status
   * Can filter by user type (role): INVESTOR, MANAGER, SERVICE_PROVIDER
   */
  getPendingAccreditedUsers: adminProcedure
    .input(
      z.object({
        emailVerifiedOnly: z.boolean().default(true), // Only show users who verified email
        role: z.nativeEnum(UserRole).optional(), // Filter by user type
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        sortBy: z.enum(['createdAt', 'email', 'role']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { emailVerifiedOnly, role, page, limit, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { 
        accreditedStatus: 'PENDING',
      };
      
      // Optionally filter to only show users who have completed email verification
      if (emailVerifiedOnly) {
        where.emailVerified = { not: null };
      }

      // Filter by role/user type
      if (role) {
        where.role = role;
      }

      const [users, total, unverifiedCount, countsByRole] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                company: true,
                title: true,
                phone: true,
                avatarUrl: true,
                investorType: true,
              },
            },
            accounts: {
              select: {
                provider: true,
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        ctx.prisma.user.count({ where }),
        // Count users pending accreditation who haven't verified email yet
        ctx.prisma.user.count({ 
          where: { 
            accreditedStatus: 'PENDING',
            emailVerified: null,
          } 
        }),
        // Count pending users by role (for tab badges)
        ctx.prisma.user.groupBy({
          by: ['role'],
          where: { 
            accreditedStatus: 'PENDING',
            emailVerified: { not: null },
          },
          _count: true,
        }),
      ]);

      // Transform to include OAuth provider info and verification status
      const usersWithDetails = users.map(user => ({
        ...user,
        isOAuthUser: user.accounts.length > 0,
        oauthProviders: user.accounts.map(a => a.provider),
        isEmailVerified: !!user.emailVerified,
      }));

      // Transform counts by role into an object
      const pendingByRole = countsByRole.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {} as Record<string, number>);

      return {
        users: usersWithDetails,
        unverifiedCount, // Users still waiting to verify email
        pendingByRole, // { INVESTOR: 5, MANAGER: 2, SERVICE_PROVIDER: 1, ... }
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Approve a user's accredited investor status
   * User must have verified their email first (Step 1)
   */
  approveAccreditedStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: { profile: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if email is verified (Step 1 must be completed)
      if (!user.emailVerified) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User has not verified their email yet. Email verification is required before accreditation approval.',
        });
      }

      if (user.accreditedStatus !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `User is not pending accreditation. Current status: ${user.accreditedStatus}`,
        });
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          accreditedStatus: 'APPROVED',
          accreditedReason: input.notes,
          accreditedChangedAt: new Date(),
          accreditedChangedBy: ctx.user.sub,
        },
        select: {
          id: true,
          email: true,
          accreditedStatus: true,
          emailVerified: true,
          profile: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.sub,
          action: 'UPDATE',
          entityType: 'USER',
          entityId: input.userId,
          newValues: { accreditedStatus: 'APPROVED' },
          metadata: { notes: input.notes, action: 'APPROVE_ACCREDITED_STATUS' },
        },
      });

      // Create notification for user
      await ctx.prisma.notification.create({
        data: {
          userId: input.userId,
          type: 'SYSTEM',
          title: 'Account Approved!',
          message: 'Your accredited investor status has been approved. You now have full access to fund details.',
          link: '/dashboard',
        },
      });

      // Send approval email notification to user
      const userName = user.profile 
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user.email;
      await sendAccreditedApprovalEmail({ email: user.email, name: userName });

      return {
        success: true,
        user: updatedUser,
        message: `User ${updatedUser.email} has been approved as an accredited investor`,
      };
    }),

  /**
   * Reject a user's accredited investor status
   */
  rejectAccreditedStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().min(1, 'Rejection reason is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (user.accreditedStatus !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `User is not pending accreditation. Current status: ${user.accreditedStatus}`,
        });
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          accreditedStatus: 'REJECTED',
          accreditedReason: input.reason,
          accreditedChangedAt: new Date(),
          accreditedChangedBy: ctx.user.sub,
        },
        select: {
          id: true,
          email: true,
          accreditedStatus: true,
        },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.sub,
          action: 'UPDATE',
          entityType: 'USER',
          entityId: input.userId,
          newValues: { accreditedStatus: 'REJECTED' },
          metadata: { reason: input.reason, action: 'REJECT_ACCREDITED_STATUS' },
        },
      });

      // Create notification for user
      await ctx.prisma.notification.create({
        data: {
          userId: input.userId,
          type: 'SYSTEM',
          title: 'Account Review Update',
          message: 'Your accredited investor application was not approved. Please contact support for more information.',
          link: '/support',
        },
      });

      // Send rejection email notification to user
      const userProfile = await ctx.prisma.profile.findUnique({
        where: { userId: input.userId },
      });
      const userName = userProfile 
        ? `${userProfile.firstName} ${userProfile.lastName}`
        : user.email;
      await sendAccreditedRejectionEmail({ email: user.email, name: userName }, input.reason);

      return {
        success: true,
        user: updatedUser,
        message: `User ${updatedUser.email}'s accreditation request has been rejected`,
      };
    }),

  /**
   * Bulk approve accredited investor status for users
   * Only approves users who have verified their email
   */
  bulkApproveAccreditedStatus: adminProcedure
    .input(
      z.object({
        userIds: z.array(z.string()).min(1),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userIds, notes } = input;

      // Verify all users exist, are pending, and have verified email
      const users = await ctx.prisma.user.findMany({
        where: {
          id: { in: userIds },
          accreditedStatus: 'PENDING',
          emailVerified: { not: null }, // Must have verified email
        },
        select: { id: true, email: true },
      });

      if (users.length !== userIds.length) {
        const foundIds = users.map(u => u.id);
        const notFound = userIds.filter(id => !foundIds.includes(id));
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Some users not found, not pending, or haven't verified email: ${notFound.join(', ')}`,
        });
      }

      // Bulk update
      await ctx.prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: {
          accreditedStatus: 'APPROVED',
          accreditedReason: notes,
          accreditedChangedAt: new Date(),
          accreditedChangedBy: ctx.user.sub,
        },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.sub,
          action: 'UPDATE',
          entityType: 'USER',
          entityId: userIds.join(','),
          newValues: { accreditedStatus: 'APPROVED', count: userIds.length },
          metadata: { notes, action: 'BULK_APPROVE_ACCREDITED_STATUS' },
        },
      });

      return {
        success: true,
        approvedCount: users.length,
        approvedEmails: users.map(u => u.email),
        message: `${users.length} users have been approved as accredited investors`,
      };
    }),

  /**
   * Update user's accredited status (for re-review or status change)
   */
  updateAccreditedStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        accreditedStatus: z.nativeEnum(AccreditedStatus),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Prevent changing own status
      if (input.userId === ctx.user.sub) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot change your own accreditation status',
        });
      }

      const oldStatus = user.accreditedStatus;
      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          accreditedStatus: input.accreditedStatus,
          accreditedReason: input.reason,
          accreditedChangedAt: new Date(),
          accreditedChangedBy: ctx.user.sub,
        },
        select: {
          id: true,
          email: true,
          accreditedStatus: true,
          emailVerified: true,
        },
      });

      // Log the action
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.sub,
          action: 'UPDATE',
          entityType: 'USER',
          entityId: input.userId,
          oldValues: { accreditedStatus: oldStatus },
          newValues: { accreditedStatus: input.accreditedStatus },
          metadata: { reason: input.reason, action: 'UPDATE_ACCREDITED_STATUS' },
        },
      });

      return {
        success: true,
        user: updatedUser,
        message: `User accreditation status changed from ${oldStatus} to ${input.accreditedStatus}`,
      };
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
