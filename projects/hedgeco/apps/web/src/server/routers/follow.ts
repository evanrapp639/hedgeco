// Follow router - Social follow system for funds, managers, providers

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { FollowTargetType } from '@prisma/client';

export const followRouter = router({
  /**
   * Follow a fund, manager, or provider
   */
  follow: protectedProcedure
    .input(
      z.object({
        targetType: z.nativeEnum(FollowTargetType),
        targetId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { targetType, targetId } = input;

      // Validate target exists
      await validateTarget(ctx.prisma, targetType, targetId);

      // Can't follow yourself (for managers)
      if (targetType === 'MANAGER' && targetId === ctx.user.sub) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot follow yourself',
        });
      }

      // Create or update follow (upsert handles duplicate)
      const follow = await ctx.prisma.follow.upsert({
        where: {
          followerId_targetType_targetId: {
            followerId: ctx.user.sub,
            targetType,
            targetId,
          },
        },
        create: {
          followerId: ctx.user.sub,
          targetType,
          targetId,
        },
        update: {}, // No-op if already following
      });

      return { success: true, followId: follow.id };
    }),

  /**
   * Unfollow a target
   */
  unfollow: protectedProcedure
    .input(
      z.object({
        targetType: z.nativeEnum(FollowTargetType),
        targetId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { targetType, targetId } = input;

      const deleted = await ctx.prisma.follow.deleteMany({
        where: {
          followerId: ctx.user.sub,
          targetType,
          targetId,
        },
      });

      return { success: true, removed: deleted.count > 0 };
    }),

  /**
   * Check if user is following a target
   */
  isFollowing: protectedProcedure
    .input(
      z.object({
        targetType: z.nativeEnum(FollowTargetType),
        targetId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { targetType, targetId } = input;

      const follow = await ctx.prisma.follow.findUnique({
        where: {
          followerId_targetType_targetId: {
            followerId: ctx.user.sub,
            targetType,
            targetId,
          },
        },
      });

      return { isFollowing: !!follow };
    }),

  /**
   * Get followers of a target
   */
  getFollowers: protectedProcedure
    .input(
      z.object({
        targetType: z.nativeEnum(FollowTargetType),
        targetId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { targetType, targetId, limit, cursor } = input;

      const followers = await ctx.prisma.follow.findMany({
        where: {
          targetType,
          targetId,
        },
        include: {
          follower: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  avatarUrl: true,
                  company: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (followers.length > limit) {
        const next = followers.pop();
        nextCursor = next?.id;
      }

      return {
        followers: followers.map((f) => ({
          id: f.id,
          user: f.follower,
          followedAt: f.createdAt,
        })),
        nextCursor,
      };
    }),

  /**
   * Get user's following list
   */
  getFollowing: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(FollowTargetType).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { type, limit, cursor } = input;

      const follows = await ctx.prisma.follow.findMany({
        where: {
          followerId: ctx.user.sub,
          ...(type && { targetType: type }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (follows.length > limit) {
        const next = follows.pop();
        nextCursor = next?.id;
      }

      // Enrich with target details
      const enriched = await Promise.all(
        follows.map(async (f) => {
          const target = await getTargetDetails(ctx.prisma, f.targetType, f.targetId);
          return {
            id: f.id,
            targetType: f.targetType,
            targetId: f.targetId,
            target,
            followedAt: f.createdAt,
          };
        })
      );

      return { following: enriched, nextCursor };
    }),

  /**
   * Get follow counts for a target
   */
  getFollowCounts: protectedProcedure
    .input(
      z.object({
        targetType: z.nativeEnum(FollowTargetType),
        targetId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { targetType, targetId } = input;

      const count = await ctx.prisma.follow.count({
        where: { targetType, targetId },
      });

      // Check if current user is following
      const isFollowing = await ctx.prisma.follow.findUnique({
        where: {
          followerId_targetType_targetId: {
            followerId: ctx.user.sub,
            targetType,
            targetId,
          },
        },
      });

      return {
        followerCount: count,
        isFollowing: !!isFollowing,
      };
    }),
});

// Helper: Validate target exists
async function validateTarget(
  prisma: any,
  targetType: FollowTargetType,
  targetId: string
) {
  let exists = false;

  switch (targetType) {
    case 'FUND':
      exists = !!(await prisma.fund.findUnique({ where: { id: targetId } }));
      break;
    case 'MANAGER':
      exists = !!(await prisma.user.findFirst({
        where: { id: targetId, role: 'MANAGER' },
      }));
      break;
    case 'PROVIDER':
      exists = !!(await prisma.serviceProvider.findUnique({
        where: { id: targetId },
      }));
      break;
  }

  if (!exists) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `${targetType} not found`,
    });
  }
}

// Helper: Get target details for display
async function getTargetDetails(
  prisma: any,
  targetType: FollowTargetType,
  targetId: string
) {
  switch (targetType) {
    case 'FUND':
      return prisma.fund.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          strategy: true,
        },
      });
    case 'MANAGER':
      return prisma.user.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              displayName: true,
              company: true,
            },
          },
        },
      });
    case 'PROVIDER':
      return prisma.serviceProvider.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          companyName: true,
          slug: true,
          category: true,
        },
      });
    default:
      return null;
  }
}
