// AI Router - AI-powered features: recommendations, chat, summaries
// Uses OpenAI for LLM capabilities and vector search for context

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import OpenAI from 'openai';
import { FundStatus } from '@prisma/client';
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

// type ChatMessage = z.infer<typeof chatMessageSchema>;

// ============================================================
// AI Router
// ============================================================

export const aiRouter = router({
  /**
   * Get personalized fund recommendations for the user
   * Based on viewing history, saved searches, and profile preferences
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        excludeViewed: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, excludeViewed } = input;

      // 1. Get user's recent activity to understand preferences
      const recentViews = await ctx.prisma.userActivity.findMany({
        where: {
          userId: ctx.user.sub,
          action: 'VIEW',
          entityType: 'FUND',
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { entityId: true },
      });

      const viewedFundIds = recentViews
        .map((v) => v.entityId)
        .filter((id): id is string => id !== null);

      // 2. Get user's saved searches
      const savedSearches = await ctx.prisma.savedSearch.findMany({
        where: { userId: ctx.user.sub },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { query: true, filters: true },
      });

      // 3. Get user's watchlist
      const watchlist = await ctx.prisma.watchlist.findMany({
        where: { userId: ctx.user.sub },
        include: {
          fund: {
            select: { strategy: true, type: true },
          },
        },
      });

      // 4. Build a preference profile from this data
      const strategies = new Set<string>();
      const fundTypes = new Set<string>();

      // From watchlist
      watchlist.forEach((w) => {
        if (w.fund.strategy) strategies.add(w.fund.strategy);
        fundTypes.add(w.fund.type);
      });

      // From saved searches
      savedSearches.forEach((s) => {
        if (s.query) strategies.add(s.query);
        const filters = s.filters as { fundType?: string; strategy?: string };
        if (filters?.fundType) fundTypes.add(filters.fundType);
        if (filters?.strategy) strategies.add(filters.strategy);
      });

      // 5. Build preference embedding text
      let preferenceText = 'Investor looking for: ';
      if (strategies.size > 0) {
        preferenceText += `Strategies: ${Array.from(strategies).join(', ')}. `;
      }
      if (fundTypes.size > 0) {
        preferenceText += `Fund types: ${Array.from(fundTypes).join(', ')}. `;
      }

      // Fallback if no preferences found
      if (strategies.size === 0 && fundTypes.size === 0) {
        preferenceText = 'Looking for top performing hedge funds and alternative investments';
      }

      // 6. Generate embedding for preferences
      const { embedding } = await generateEmbedding(preferenceText);

      // 7. Search for matching funds
      const excludeIds = excludeViewed ? viewedFundIds : [];
      const recommendations = await searchFundsByVector(embedding, {
        limit: limit * 2, // Get extra for filtering
        threshold: 0.4,
        excludeIds,
      });

      // 8. Fetch full fund details
      const recIds = recommendations.slice(0, limit).map((r) => r.id);
      const funds = await ctx.prisma.fund.findMany({
        where: { id: { in: recIds } },
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

      // Merge similarity scores
      const fundMap = new Map(funds.map((f) => [f.id, f]));
      const enrichedRecs = recommendations
        .slice(0, limit)
        .map((r) => ({
          ...fundMap.get(r.id)!,
          relevanceScore: r.similarity,
        }))
        .filter((r) => r !== undefined);

      return {
        recommendations: enrichedRecs,
        basedOn: {
          viewedFunds: viewedFundIds.length,
          savedSearches: savedSearches.length,
          watchlistItems: watchlist.length,
          preferenceText,
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
