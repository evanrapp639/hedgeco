// AI Router - AI-powered features: recommendations, chat, summaries
// Uses OpenAI for LLM capabilities and vector search for context

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { FundStatus } from '@prisma/client';
import OpenAI from 'openai';
import {
  generateEmbedding,
  searchFundsByVector,
  buildFundEmbeddingText,
} from '@/lib/embeddings';

// ============================================================
// OpenAI Client
// ============================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHAT_MODEL = 'gpt-4o';
const SUMMARY_MODEL = 'gpt-4o-mini';

// ============================================================
// Types
// ============================================================

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

interface RecommendationCandidate {
  id: string;
  name: string;
  type: string;
  strategy: string | null;
  similarity: number;
  recencyScore: number;
  diversityScore: number;
  sizeMatch: number;
  collaborativeScore: number;
  finalScore: number;
}

// ============================================================
// Recommendation Configuration
// ============================================================

const RECOMMENDATION_CONFIG = {
  // Time decay: how much older views are discounted (exponential decay)
  timeDecayHalfLifeDays: 30, // Views lose half their weight after 30 days
  
  // Diversification: minimum strategy diversity ratio
  minStrategyDiversity: 0.4, // At least 40% different strategies
  maxSameStrategy: 3, // Max 3 funds from same strategy
  
  // Investment size matching
  sizeMatchWeight: 0.15,
  
  // Weights for final score
  weights: {
    semantic: 0.4,
    recency: 0.15,
    diversity: 0.2,
    sizeMatch: 0.1,
    collaborative: 0.15,
  },
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Calculate time decay score for an activity
 * More recent = higher score (0-1)
 */
function calculateTimeDecay(activityDate: Date): number {
  const daysSince = (Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24);
  const halfLife = RECOMMENDATION_CONFIG.timeDecayHalfLifeDays;
  return Math.pow(0.5, daysSince / halfLife);
}

/**
 * Calculate investment size match score
 * Returns 0-1 based on how well fund min investment matches user's typical size
 */
function calculateSizeMatch(
  fundMinInvestment: number | null,
  userTypicalSize: number | null
): number {
  if (!fundMinInvestment || !userTypicalSize) return 0.5; // Neutral if no data
  
  const ratio = fundMinInvestment / userTypicalSize;
  
  // Perfect match if fund minimum is 10-50% of user's typical investment
  if (ratio >= 0.1 && ratio <= 0.5) return 1.0;
  // Good match if 5-10% or 50-100%
  if (ratio >= 0.05 && ratio < 0.1) return 0.8;
  if (ratio > 0.5 && ratio <= 1.0) return 0.7;
  // Acceptable if 1-200%
  if (ratio > 1.0 && ratio <= 2.0) return 0.4;
  // Poor match if way over
  if (ratio > 2.0) return 0.1;
  // Very small minimum is always okay
  return 0.6;
}

/**
 * Diversify recommendations to avoid strategy concentration
 */
function diversifyRecommendations(
  candidates: RecommendationCandidate[],
  limit: number
): RecommendationCandidate[] {
  const result: RecommendationCandidate[] = [];
  const strategyCounts = new Map<string, number>();
  
  // Sort by final score first
  const sorted = [...candidates].sort((a, b) => b.finalScore - a.finalScore);
  
  for (const candidate of sorted) {
    if (result.length >= limit) break;
    
    const strategy = candidate.strategy || 'Unknown';
    const currentCount = strategyCounts.get(strategy) || 0;
    
    // Skip if we already have max from this strategy (unless we need to fill)
    if (currentCount >= RECOMMENDATION_CONFIG.maxSameStrategy) {
      // Check if we have enough diversity
      const uniqueStrategies = strategyCounts.size;
      const targetDiversity = Math.ceil(limit * RECOMMENDATION_CONFIG.minStrategyDiversity);
      
      if (uniqueStrategies < targetDiversity) {
        continue; // Skip this one, need more diversity
      }
    }
    
    result.push(candidate);
    strategyCounts.set(strategy, currentCount + 1);
  }
  
  // If we couldn't fill due to diversity constraints, relax and fill remaining
  if (result.length < limit) {
    const remaining = sorted.filter((c) => !result.includes(c));
    for (const candidate of remaining) {
      if (result.length >= limit) break;
      result.push(candidate);
    }
  }
  
  return result;
}

/**
 * Get collaborative filtering hints based on what similar users viewed
 */
async function getCollaborativeHints(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any,
  userId: string,
  viewedFundIds: string[]
): Promise<Map<string, number>> {
  const hints = new Map<string, number>();
  
  if (viewedFundIds.length === 0) return hints;
  
  // Find other users who viewed the same funds
  const similarUsers = await prisma.$queryRaw<Array<{ userId: string; overlap: bigint }>>`
    SELECT "userId", COUNT(*) as overlap
    FROM "UserActivity"
    WHERE 
      "entityType" = 'FUND'
      AND action = 'VIEW'
      AND "entityId" IN (${prisma.$queryRaw`${viewedFundIds.join("','")}`})
      AND "userId" != ${userId}
    GROUP BY "userId"
    HAVING COUNT(*) >= 2
    ORDER BY overlap DESC
    LIMIT 50
  `;
  
  if (similarUsers.length === 0) return hints;
  
  const similarUserIds = similarUsers.map((u: { userId: string }) => u.userId);
  
  // Get funds those users also viewed (but current user hasn't)
  const collaborativeFunds = await prisma.$queryRaw<Array<{ entityId: string; score: bigint }>>`
    SELECT "entityId", COUNT(*) as score
    FROM "UserActivity"
    WHERE 
      "entityType" = 'FUND'
      AND action = 'VIEW'
      AND "userId" IN (${prisma.$queryRaw`${similarUserIds.join("','")}`})
      AND "entityId" NOT IN (${prisma.$queryRaw`${viewedFundIds.join("','")}`})
    GROUP BY "entityId"
    ORDER BY score DESC
    LIMIT 100
  `;
  
  // Normalize scores
  const maxScore = collaborativeFunds.length > 0 
    ? Number(collaborativeFunds[0].score) 
    : 1;
  
  for (const fund of collaborativeFunds) {
    hints.set(fund.entityId, Number(fund.score) / maxScore);
  }
  
  return hints;
}

// ============================================================
// AI Router
// ============================================================

export const aiRouter = router({
  /**
   * Get personalized fund recommendations for the user
   * Enhanced with diversification, size matching, time decay, and collaborative filtering
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        excludeViewed: z.boolean().default(false),
        investmentSize: z.number().optional(), // User's intended investment size
        diversify: z.boolean().default(true), // Whether to enforce diversification
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, excludeViewed, investmentSize, diversify } = input;

      // 1. Get user's recent activity with timestamps for time decay
      const recentViews = await ctx.prisma.userActivity.findMany({
        where: {
          userId: ctx.user.sub,
          action: 'VIEW',
          entityType: 'FUND',
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Get more for better analysis
        select: { entityId: true, createdAt: true },
      });

      const viewedFundIds = recentViews
        .map((v) => v.entityId)
        .filter((id): id is string => id !== null);

      // Calculate time-weighted view scores
      const viewScores = new Map<string, number>();
      for (const view of recentViews) {
        if (!view.entityId) continue;
        const decay = calculateTimeDecay(view.createdAt);
        const current = viewScores.get(view.entityId) || 0;
        viewScores.set(view.entityId, current + decay);
      }

      // 2. Get user's saved searches
      const savedSearches = await ctx.prisma.savedSearch.findMany({
        where: { userId: ctx.user.sub },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { query: true, filters: true },
      });

      // 3. Get user's watchlist with fund details
      const watchlist = await ctx.prisma.watchlist.findMany({
        where: { userId: ctx.user.sub },
        include: {
          fund: {
            select: { strategy: true, type: true, minInvestment: true },
          },
        },
      });

      // 4. Get collaborative filtering hints
      const collaborativeHints = await getCollaborativeHints(
        ctx.prisma,
        ctx.user.sub,
        viewedFundIds
      );

      // 5. Determine user's typical investment size
      let userTypicalSize = investmentSize;
      if (!userTypicalSize) {
        // Try to infer from profile or viewed funds
        const profile = await ctx.prisma.profile.findUnique({
          where: { userId: ctx.user.sub },
          select: { preferences: true },
        });
        const prefs = profile?.preferences as { investmentSize?: number } | null;
        userTypicalSize = prefs?.investmentSize;
      }

      // 6. Build preference profile from data
      const strategies = new Set<string>();
      const fundTypes = new Set<string>();
      const strategyWeights = new Map<string, number>();

      // From watchlist (highest weight)
      for (const w of watchlist) {
        if (w.fund.strategy) {
          strategies.add(w.fund.strategy);
          strategyWeights.set(
            w.fund.strategy,
            (strategyWeights.get(w.fund.strategy) || 0) + 2
          );
        }
        fundTypes.add(w.fund.type);
      }

      // From viewed funds (with time decay)
      if (viewedFundIds.length > 0) {
        const viewedFunds = await ctx.prisma.fund.findMany({
          where: { id: { in: viewedFundIds } },
          select: { id: true, strategy: true, type: true },
        });
        
        for (const fund of viewedFunds) {
          if (fund.strategy) {
            strategies.add(fund.strategy);
            const weight = viewScores.get(fund.id) || 0;
            strategyWeights.set(
              fund.strategy,
              (strategyWeights.get(fund.strategy) || 0) + weight
            );
          }
          fundTypes.add(fund.type);
        }
      }

      // From saved searches
      for (const s of savedSearches) {
        if (s.query) strategies.add(s.query);
        const filters = s.filters as { fundType?: string; strategy?: string };
        if (filters?.fundType) fundTypes.add(filters.fundType);
        if (filters?.strategy) strategies.add(filters.strategy);
      }

      // 7. Build preference embedding text
      let preferenceText = 'Investor looking for: ';
      if (strategies.size > 0) {
        // Weight strategies by preference strength
        const sortedStrategies = Array.from(strategyWeights.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([s]) => s);
        preferenceText += `Strategies: ${sortedStrategies.join(', ')}. `;
      }
      if (fundTypes.size > 0) {
        preferenceText += `Fund types: ${Array.from(fundTypes).join(', ')}. `;
      }

      // Fallback if no preferences found
      if (strategies.size === 0 && fundTypes.size === 0) {
        preferenceText = 'Looking for top performing hedge funds and alternative investments';
      }

      // 8. Generate embedding for preferences
      const { embedding } = await generateEmbedding(preferenceText);

      // 9. Search for matching funds (get extra for filtering)
      const excludeIds = excludeViewed ? viewedFundIds : [];
      const rawResults = await searchFundsByVector(embedding, {
        limit: limit * 4, // Get more for diversification filtering
        threshold: 0.35,
        excludeIds,
      });

      // 10. Fetch fund details for scoring
      const candidateIds = rawResults.map((r) => r.id);
      const candidateFunds = await ctx.prisma.fund.findMany({
        where: { id: { in: candidateIds } },
        select: {
          id: true,
          name: true,
          type: true,
          strategy: true,
          minInvestment: true,
        },
      });
      
      const fundDetailsMap = new Map(candidateFunds.map((f) => [f.id, f]));

      // 11. Calculate composite scores for each candidate
      const scoredCandidates: RecommendationCandidate[] = rawResults.map((r) => {
        const fund = fundDetailsMap.get(r.id);
        const strategy = fund?.strategy || null;
        
        // Semantic score (from vector search)
        const semanticScore = r.similarity;
        
        // Recency score (time-decayed preference for recently viewed similar strategies)
        let recencyScore = 0.5;
        if (strategy && strategyWeights.has(strategy)) {
          recencyScore = Math.min(1, strategyWeights.get(strategy)! / 3);
        }
        
        // Diversity score (prefer strategies user hasn't seen much)
        let diversityScore = 0.7;
        if (strategy) {
          const strategyViewCount = strategyWeights.get(strategy) || 0;
          diversityScore = 1 - Math.min(0.7, strategyViewCount / 5);
        }
        
        // Size match score
        const sizeMatch = calculateSizeMatch(
          fund?.minInvestment ? Number(fund.minInvestment) : null,
          userTypicalSize || null
        );
        
        // Collaborative filtering score
        const collaborativeScore = collaborativeHints.get(r.id) || 0;
        
        // Calculate final score
        const w = RECOMMENDATION_CONFIG.weights;
        const finalScore =
          w.semantic * semanticScore +
          w.recency * recencyScore +
          w.diversity * diversityScore +
          w.sizeMatch * sizeMatch +
          w.collaborative * collaborativeScore;
        
        return {
          id: r.id,
          name: fund?.name || '',
          type: fund?.type || '',
          strategy,
          similarity: semanticScore,
          recencyScore,
          diversityScore,
          sizeMatch,
          collaborativeScore,
          finalScore,
        };
      });

      // 12. Apply diversification if enabled
      const finalCandidates = diversify
        ? diversifyRecommendations(scoredCandidates, limit)
        : scoredCandidates.sort((a, b) => b.finalScore - a.finalScore).slice(0, limit);

      // 13. Fetch full fund details for final recommendations
      const finalIds = finalCandidates.map((c) => c.id);
      const funds = await ctx.prisma.fund.findMany({
        where: { id: { in: finalIds } },
        include: {
          statistics: {
            select: {
              ytdReturn: true,
              oneYearReturn: true,
              sharpeRatio: true,
              maxDrawdown: true,
            },
          },
        },
      });

      // Merge scores with fund data, maintaining order
      const fundMap = new Map(funds.map((f) => [f.id, f]));
      const enrichedRecs = finalCandidates
        .map((c) => {
          const fund = fundMap.get(c.id);
          if (!fund) return null;
          return {
            ...fund,
            relevanceScore: c.finalScore,
            scores: {
              semantic: c.similarity,
              recency: c.recencyScore,
              diversity: c.diversityScore,
              sizeMatch: c.sizeMatch,
              collaborative: c.collaborativeScore,
            },
          };
        })
        .filter((r) => r !== null);

      // Calculate strategy distribution for transparency
      const strategyDistribution: Record<string, number> = {};
      for (const rec of enrichedRecs) {
        const strat = rec.strategy || 'Other';
        strategyDistribution[strat] = (strategyDistribution[strat] || 0) + 1;
      }

      return {
        recommendations: enrichedRecs,
        basedOn: {
          viewedFunds: viewedFundIds.length,
          savedSearches: savedSearches.length,
          watchlistItems: watchlist.length,
          preferenceText,
          collaborativeUsers: collaborativeHints.size > 0,
        },
        diversity: {
          uniqueStrategies: Object.keys(strategyDistribution).length,
          distribution: strategyDistribution,
        },
      };
    }),

  /**
   * Conversational interface for fund queries
   * Uses RAG (Retrieval Augmented Generation) with fund embeddings
   */
  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(chatMessageSchema).min(1),
        includeFundContext: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { messages, includeFundContext } = input;

      // Get the latest user message
      const lastUserMessage = messages
        .filter((m) => m.role === 'user')
        .pop();

      if (!lastUserMessage) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No user message found',
        });
      }

      let context = '';

      // If including fund context, search for relevant funds
      if (includeFundContext) {
        try {
          const { embedding } = await generateEmbedding(lastUserMessage.content);
          const relevantFunds = await searchFundsByVector(embedding, {
            limit: 5,
            threshold: 0.5,
          });

          if (relevantFunds.length > 0) {
            // Fetch full fund details for context
            const fundIds = relevantFunds.map((f) => f.id);
            const funds = await ctx.prisma.fund.findMany({
              where: { id: { in: fundIds } },
              include: { statistics: true },
            });

            context = '\n\nRelevant funds from our database:\n';
            funds.forEach((fund, i) => {
              context += `\n${i + 1}. ${fund.name} (${fund.type})\n`;
              context += `   Strategy: ${fund.strategy || 'N/A'}\n`;
              if (fund.statistics) {
                context += `   YTD Return: ${fund.statistics.ytdReturn ? (Number(fund.statistics.ytdReturn) * 100).toFixed(1) + '%' : 'N/A'}\n`;
                context += `   Sharpe Ratio: ${fund.statistics.sharpeRatio || 'N/A'}\n`;
              }
              if (fund.description) {
                context += `   Description: ${fund.description.slice(0, 200)}...\n`;
              }
            });
          }
        } catch (error) {
          console.error('Error fetching fund context:', error);
          // Continue without context
        }
      }

      // Build the system prompt
      const systemPrompt = `You are Velma, an AI assistant for HedgeCo.Net, a platform for hedge fund and alternative investment discovery. 

Your role is to help investors:
- Find funds that match their criteria
- Understand fund strategies and performance
- Compare different investment options
- Answer questions about the alternative investment industry

Be helpful, accurate, and professional. If you don't know something, say so.
${context ? `\n\nCONTEXT FROM DATABASE:${context}` : ''}

When discussing specific funds, reference the data provided. If the user asks about funds not in the context, suggest they use the search feature.`;

      // Prepare messages for OpenAI
      const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];

      // Call OpenAI
      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const assistantMessage = completion.choices[0]?.message?.content;

      if (!assistantMessage) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate response',
        });
      }

      // Log the chat interaction for analytics
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'SEARCH',
          entityType: 'SEARCH',
          metadata: {
            type: 'ai_chat',
            query: lastUserMessage.content.slice(0, 200),
            tokensUsed: completion.usage?.total_tokens,
          },
        },
      });

      return {
        message: assistantMessage,
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
      };
    }),

  /**
   * Generate an AI summary for a specific fund
   * Provides a concise, investor-focused overview
   */
  summarizeFund: publicProcedure
    .input(
      z.object({
        fundId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { fundId } = input;

      // Fetch the fund with all details
      const fund = await ctx.prisma.fund.findUnique({
        where: {
          id: fundId,
          status: FundStatus.APPROVED,
          visible: true,
        },
        include: {
          statistics: true,
          returns: {
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            take: 12, // Last 12 months
          },
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      // Build context for the summary
      const fundContext = buildFundEmbeddingText(fund);

      // Recent performance narrative
      let performanceNarrative = '';
      if (fund.returns.length > 0) {
        const recentReturns = fund.returns.slice(0, 6);
        const positiveMonths = recentReturns.filter((r) => Number(r.netReturn) > 0).length;
        performanceNarrative = `Recent performance: ${positiveMonths}/${recentReturns.length} positive months in the last 6 months.`;
      }

      const systemPrompt = `You are a financial analyst writing concise fund summaries for qualified investors. 
Write a 3-4 paragraph summary that covers:
1. Fund strategy and approach
2. Performance highlights and risk characteristics
3. Who this fund might be suitable for

Be factual, professional, and avoid promotional language. Use the data provided.`;

      const userPrompt = `Please summarize this fund for potential investors:

${fundContext}

${performanceNarrative}`;

      const completion = await openai.chat.completions.create({
        model: SUMMARY_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const summary = completion.choices[0]?.message?.content;

      if (!summary) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate summary',
        });
      }

      return {
        fundId: fund.id,
        fundName: fund.name,
        summary,
        generatedAt: new Date().toISOString(),
        tokensUsed: completion.usage?.total_tokens,
      };
    }),

  /**
   * Ask a question about a specific fund
   * Uses RAG with the fund's documents and data
   */
  askAboutFund: protectedProcedure
    .input(
      z.object({
        fundId: z.string(),
        question: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { fundId, question } = input;

      // Fetch the fund
      const fund = await ctx.prisma.fund.findUnique({
        where: {
          id: fundId,
          status: FundStatus.APPROVED,
          visible: true,
        },
        include: {
          statistics: true,
          manager: {
            select: {
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
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      const fundContext = buildFundEmbeddingText(fund);
      const managerInfo = fund.manager?.profile
        ? `Manager: ${fund.manager.profile.firstName} ${fund.manager.profile.lastName}${fund.manager.profile.company ? ` at ${fund.manager.profile.company}` : ''}`
        : '';

      const systemPrompt = `You are a helpful assistant answering questions about investment funds.
Only answer based on the information provided. If the information isn't available, say so clearly.
Be concise and professional.`;

      const userPrompt = `Fund Information:
${fundContext}
${managerInfo}

Question: ${question}`;

      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 400,
      });

      const answer = completion.choices[0]?.message?.content;

      if (!answer) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate answer',
        });
      }

      // Log the interaction
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'SEARCH',
          entityType: 'FUND',
          entityId: fundId,
          metadata: {
            type: 'fund_question',
            question: question.slice(0, 200),
          },
        },
      });

      return {
        fundId,
        question,
        answer,
        tokensUsed: completion.usage?.total_tokens,
      };
    }),
});
