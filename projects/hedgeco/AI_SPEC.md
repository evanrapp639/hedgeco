# HedgeCo.Net v2 — AI/ML Specification

> **Author:** Oracle 🧠 (AI/ML Lead)  
> **Version:** 1.0  
> **Last Updated:** 2026-02-12

---

## Executive Summary

This document defines the AI-native architecture for HedgeCo.Net v2. Our goal: transform fund discovery from keyword search to intelligent conversation. Every feature described here serves the core mission—matching accredited investors with the right alternative investment opportunities.

**Key AI Capabilities:**
- Natural language fund search ("find me long/short equity with 15%+ returns")
- Personalized fund recommendations based on behavior and preferences
- Conversational AI assistant for fund discovery and due diligence
- Automated fund summary generation with market context
- Intelligent investor-manager matching
- AI-powered due diligence analysis

---

## Table of Contents

1. [Natural Language Search](#1-natural-language-search)
2. [Embeddings Strategy](#2-embeddings-strategy)
3. [Recommendation Engine](#3-recommendation-engine)
4. [AI Chat Interface](#4-ai-chat-interface)
5. [Fund Summary Generation](#5-fund-summary-generation)
6. [Smart Matching](#6-smart-matching)
7. [Due Diligence Assistant](#7-due-diligence-assistant)
8. [RAG Architecture](#8-rag-architecture)
9. [Infrastructure & Cost](#9-infrastructure--cost)

---

## 1. Natural Language Search

### Overview

Convert free-form queries like *"find me long/short equity funds with 15%+ returns and less than $100M AUM"* into structured database queries, while also performing semantic search for conceptually similar results.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Natural Language Search                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Query: "Find crypto funds beating Bitcoin last year"       │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  Query Analyzer │    │  Intent Detector │                     │
│  │  (GPT-4o)       │    │                  │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           │                      │                               │
│           ▼                      ▼                               │
│  ┌─────────────────────────────────────────┐                    │
│  │        Function Calling Layer            │                    │
│  │   - extract_search_filters()             │                    │
│  │   - calculate_benchmark_threshold()      │                    │
│  └──────────────────┬──────────────────────┘                    │
│                     │                                            │
│       ┌─────────────┴─────────────┐                             │
│       ▼                           ▼                              │
│  ┌──────────┐              ┌──────────────┐                     │
│  │ SQL Query │              │ Vector Search │                    │
│  │ (Prisma)  │              │ (pgvector)    │                    │
│  └─────┬─────┘              └──────┬───────┘                    │
│        │                           │                             │
│        └───────────┬───────────────┘                            │
│                    ▼                                             │
│           ┌────────────────┐                                    │
│           │  Result Merger  │                                    │
│           │  & Ranker (RRF) │                                    │
│           └────────┬───────┘                                    │
│                    ▼                                             │
│           ┌────────────────┐                                    │
│           │  Ranked Results │                                    │
│           └────────────────┘                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Function Calling vs Fine-Tuning

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Function Calling** | No training needed, flexible schema, easy updates | Per-call cost, latency | ✅ **Start here** |
| **Fine-Tuned Model** | Faster, cheaper per call, specialized | Training cost, maintenance, schema changes need retraining | Later optimization |

**Decision: Use Function Calling (GPT-4o)**

Rationale:
1. Schema will evolve as we learn user patterns
2. No training data needed to start
3. Easy to add new filter types
4. Function definitions are self-documenting

### Function Definitions

```typescript
// src/ai/search/functions.ts

export const searchFunctions = [
  {
    name: "search_funds",
    description: "Search for alternative investment funds based on criteria",
    parameters: {
      type: "object",
      properties: {
        fund_type: {
          type: "string",
          enum: ["HEDGE_FUND", "PRIVATE_EQUITY", "VENTURE_CAPITAL", "REAL_ESTATE", "CRYPTO", "SPV"],
          description: "Type of fund to search for"
        },
        strategy: {
          type: "string",
          description: "Investment strategy (e.g., long_short_equity, global_macro, event_driven)"
        },
        sub_strategy: {
          type: "string",
          description: "More specific strategy classification"
        },
        min_aum: {
          type: "number",
          description: "Minimum AUM in USD"
        },
        max_aum: {
          type: "number",
          description: "Maximum AUM in USD"
        },
        min_return_ytd: {
          type: "number",
          description: "Minimum YTD return as decimal (0.15 = 15%)"
        },
        min_return_1y: {
          type: "number",
          description: "Minimum 1-year return as decimal"
        },
        min_return_3y_annualized: {
          type: "number",
          description: "Minimum 3-year annualized return"
        },
        min_return_since_inception: {
          type: "number",
          description: "Minimum annualized return since inception"
        },
        max_drawdown_limit: {
          type: "number",
          description: "Maximum acceptable drawdown (e.g., -0.20 for -20%)"
        },
        min_sharpe: {
          type: "number",
          description: "Minimum Sharpe ratio"
        },
        min_sortino: {
          type: "number",
          description: "Minimum Sortino ratio"
        },
        countries: {
          type: "array",
          items: { type: "string" },
          description: "Fund domicile countries"
        },
        min_investment_max: {
          type: "number",
          description: "Maximum acceptable minimum investment"
        },
        management_fee_max: {
          type: "number",
          description: "Maximum management fee as decimal"
        },
        performance_fee_max: {
          type: "number",
          description: "Maximum performance fee as decimal"
        },
        lockup_max_months: {
          type: "number",
          description: "Maximum lockup period in months"
        },
        benchmark: {
          type: "string",
          enum: ["SP500", "NASDAQ", "BITCOIN", "GOLD", "BONDS_AGG", "HFRX"],
          description: "Benchmark to compare against"
        },
        beat_benchmark_by: {
          type: "number",
          description: "Minimum outperformance vs benchmark as decimal"
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Keywords for semantic search"
        },
        sort_by: {
          type: "string",
          enum: ["relevance", "return_ytd", "return_1y", "sharpe", "aum", "inception_date"],
          default: "relevance"
        },
        limit: {
          type: "number",
          default: 20,
          description: "Number of results to return"
        }
      },
      required: []
    }
  },
  {
    name: "compare_funds",
    description: "Compare multiple funds side by side",
    parameters: {
      type: "object",
      properties: {
        fund_ids: {
          type: "array",
          items: { type: "string" },
          description: "Fund IDs to compare"
        },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Metrics to compare"
        }
      },
      required: ["fund_ids"]
    }
  },
  {
    name: "get_fund_details",
    description: "Get detailed information about a specific fund",
    parameters: {
      type: "object",
      properties: {
        fund_id: { type: "string" },
        include_returns: { type: "boolean", default: true },
        include_stats: { type: "boolean", default: true },
        include_similar: { type: "boolean", default: false }
      },
      required: ["fund_id"]
    }
  }
];
```

### Search Orchestrator

```typescript
// src/ai/search/orchestrator.ts

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { searchFunctions } from './functions';
import { buildPrismaQuery } from './query-builder';
import { vectorSearch } from './vector-search';
import { reciprocalRankFusion } from './ranking';

const openai = new OpenAI();

interface SearchRequest {
  query: string;
  userId?: string;
  conversationHistory?: Message[];
}

interface SearchResult {
  funds: Fund[];
  totalCount: number;
  appliedFilters: Record<string, any>;
  semanticMatches: Fund[];
  explanation: string;
}

export async function naturalLanguageSearch(req: SearchRequest): Promise<SearchResult> {
  const systemPrompt = `You are a hedge fund search assistant for HedgeCo.Net.
Convert user queries into structured search parameters.

Current date: ${new Date().toISOString().split('T')[0]}
Available fund types: HEDGE_FUND, PRIVATE_EQUITY, VENTURE_CAPITAL, REAL_ESTATE, CRYPTO, SPV

Strategy mappings:
- "long/short", "long short", "L/S equity" → strategy: "long_short_equity"
- "global macro" → strategy: "global_macro"
- "event driven", "merger arb" → strategy: "event_driven"
- "quant", "systematic" → strategy: "quantitative"
- "distressed", "credit" → strategy: "distressed_credit"
- "multi-strategy", "multi-strat" → strategy: "multi_strategy"

Return thresholds:
- "15% returns" typically means min_return_1y: 0.15
- "double digit returns" → min_return_1y: 0.10
- "outperforming X" → set benchmark and beat_benchmark_by

If the query is vague, ask clarifying questions using the ask_clarification function.
Always extract as much structure as possible, then use keywords for the rest.`;

  // Call GPT-4o with function calling
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...(req.conversationHistory || []),
      { role: 'user', content: req.query }
    ],
    functions: searchFunctions,
    function_call: 'auto',
    temperature: 0.1, // Low temp for consistent parsing
  });

  const message = response.choices[0].message;

  // Handle function call
  if (message.function_call) {
    const functionName = message.function_call.name;
    const args = JSON.parse(message.function_call.arguments);

    if (functionName === 'search_funds') {
      return executeSearch(args, req.userId);
    }
    // Handle other functions...
  }

  // No function call - probably a clarifying question
  return {
    funds: [],
    totalCount: 0,
    appliedFilters: {},
    semanticMatches: [],
    explanation: message.content || 'Could you clarify your search criteria?'
  };
}

async function executeSearch(
  filters: Record<string, any>,
  userId?: string
): Promise<SearchResult> {
  
  // 1. Build structured query
  const prismaQuery = buildPrismaQuery(filters);
  
  // 2. Execute SQL search
  const [structuredResults, totalCount] = await Promise.all([
    prisma.fund.findMany({
      ...prismaQuery,
      take: filters.limit || 20,
      include: {
        manager: { select: { id: true, profile: true } },
        returns: {
          orderBy: { year: 'desc', month: 'desc' },
          take: 36 // Last 3 years
        }
      }
    }),
    prisma.fund.count({ where: prismaQuery.where })
  ]);

  // 3. Execute semantic search if keywords present
  let semanticResults: Fund[] = [];
  if (filters.keywords?.length) {
    const queryEmbedding = await generateEmbedding(filters.keywords.join(' '));
    semanticResults = await vectorSearch(queryEmbedding, {
      fundType: filters.fund_type,
      limit: 20
    });
  }

  // 4. Merge results using Reciprocal Rank Fusion
  const mergedResults = reciprocalRankFusion([
    { results: structuredResults, weight: 0.7 },
    { results: semanticResults, weight: 0.3 }
  ]);

  // 5. Generate explanation
  const explanation = generateSearchExplanation(filters, totalCount);

  return {
    funds: mergedResults.slice(0, filters.limit || 20),
    totalCount,
    appliedFilters: filters,
    semanticMatches: semanticResults,
    explanation
  };
}
```

### Query Builder

```typescript
// src/ai/search/query-builder.ts

import { Prisma } from '@prisma/client';

export function buildPrismaQuery(filters: Record<string, any>): {
  where: Prisma.FundWhereInput;
  orderBy: Prisma.FundOrderByWithRelationInput[];
} {
  const where: Prisma.FundWhereInput = {
    status: 'APPROVED',
    visible: true,
  };

  // Fund type
  if (filters.fund_type) {
    where.type = filters.fund_type;
  }

  // Strategy
  if (filters.strategy) {
    where.strategy = { contains: filters.strategy, mode: 'insensitive' };
  }

  // AUM range
  if (filters.min_aum || filters.max_aum) {
    where.aum = {};
    if (filters.min_aum) where.aum.gte = filters.min_aum;
    if (filters.max_aum) where.aum.lte = filters.max_aum;
  }

  // Minimum investment
  if (filters.min_investment_max) {
    where.minInvestment = { lte: filters.min_investment_max };
  }

  // Fee limits
  if (filters.management_fee_max) {
    where.managementFee = { lte: filters.management_fee_max };
  }
  if (filters.performance_fee_max) {
    where.performanceFee = { lte: filters.performance_fee_max };
  }

  // Countries
  if (filters.countries?.length) {
    where.country = { in: filters.countries };
  }

  // Performance filters (requires join with calculated stats)
  // These are handled via a raw query or a stats view
  const performanceFilters = buildPerformanceFilters(filters);
  if (Object.keys(performanceFilters).length > 0) {
    where.stats = performanceFilters;
  }

  // Sorting
  const orderBy = buildOrderBy(filters.sort_by);

  return { where, orderBy };
}

function buildPerformanceFilters(filters: Record<string, any>) {
  const stats: any = {};

  if (filters.min_return_ytd) {
    stats.ytdReturn = { gte: filters.min_return_ytd };
  }
  if (filters.min_return_1y) {
    stats.return1Y = { gte: filters.min_return_1y };
  }
  if (filters.min_return_3y_annualized) {
    stats.return3YAnnualized = { gte: filters.min_return_3y_annualized };
  }
  if (filters.min_sharpe) {
    stats.sharpeRatio = { gte: filters.min_sharpe };
  }
  if (filters.min_sortino) {
    stats.sortinoRatio = { gte: filters.min_sortino };
  }
  if (filters.max_drawdown_limit) {
    stats.maxDrawdown = { gte: filters.max_drawdown_limit }; // drawdown is negative
  }

  return stats;
}

function buildOrderBy(sortBy?: string): Prisma.FundOrderByWithRelationInput[] {
  switch (sortBy) {
    case 'return_ytd':
      return [{ stats: { ytdReturn: 'desc' } }];
    case 'return_1y':
      return [{ stats: { return1Y: 'desc' } }];
    case 'sharpe':
      return [{ stats: { sharpeRatio: 'desc' } }];
    case 'aum':
      return [{ aum: 'desc' }];
    case 'inception_date':
      return [{ inception: 'desc' }];
    default:
      // Relevance - handled by RRF ranking
      return [{ updatedAt: 'desc' }];
  }
}
```

### Example Queries & Outputs

| User Query | Extracted Filters |
|------------|-------------------|
| "Find me long/short equity funds with 15%+ returns" | `{ fund_type: "HEDGE_FUND", strategy: "long_short_equity", min_return_1y: 0.15 }` |
| "Crypto funds beating Bitcoin last year" | `{ fund_type: "CRYPTO", benchmark: "BITCOIN", beat_benchmark_by: 0.0 }` |
| "Low-fee global macro under $500M AUM" | `{ strategy: "global_macro", max_aum: 500000000, management_fee_max: 0.015 }` |
| "Emerging managers with strong Sharpe" | `{ max_aum: 100000000, min_sharpe: 1.5 }` |
| "Private equity in healthcare" | `{ fund_type: "PRIVATE_EQUITY", keywords: ["healthcare", "medical", "biotech"] }` |

---

## 2. Embeddings Strategy

### What to Embed

```
┌────────────────────────────────────────────────────────────────┐
│                    Embedding Targets                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FUND EMBEDDINGS                                                │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ • Name + Description (text)                            │     │
│  │ • Strategy narrative                                   │     │
│  │ • Investment philosophy                                │     │
│  │ • Target sectors/themes                                │     │
│  │ • Risk profile description                             │     │
│  │ • Geographic focus                                     │     │
│  │ • Structured data as natural language:                 │     │
│  │   "Hedge fund, Long/Short Equity, $150M AUM,           │     │
│  │    15.2% YTD return, Sharpe 1.8, US-focused"          │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                 │
│  USER EMBEDDINGS (Investor Profiles)                           │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ • Stated preferences (text)                            │     │
│  │ • Investment criteria description                      │     │
│  │ • Risk tolerance narrative                             │     │
│  │ • Aggregated search history (anonymized)               │     │
│  │ • Viewed/contacted fund themes                         │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                 │
│  DOCUMENT EMBEDDINGS (DDQ, Reports)                            │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ • Chunked documents (512-1024 tokens each)             │     │
│  │ • Chunk metadata: source, page, section                │     │
│  │ • Summary embeddings for quick retrieval               │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Model Selection

| Model | Dimensions | Cost | Performance | Recommendation |
|-------|------------|------|-------------|----------------|
| `text-embedding-3-large` | 3072 | $0.13/1M tokens | Best quality | ✅ Fund profiles, DDQs |
| `text-embedding-3-small` | 1536 | $0.02/1M tokens | Good | User activity, high-volume |
| `text-embedding-ada-002` | 1536 | $0.10/1M tokens | Legacy | Don't use |

**Decision:** 
- **Funds & Documents:** `text-embedding-3-large` (quality matters for search)
- **User Activity:** `text-embedding-3-small` (high volume, cost-sensitive)

### Embedding Pipeline

```typescript
// src/ai/embeddings/pipeline.ts

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { chunk } from 'lodash';

const openai = new OpenAI();

// Fund embedding text template
function buildFundEmbeddingText(fund: Fund & { returns: FundReturn[], stats: FundStats }): string {
  const lines = [
    `Fund: ${fund.name}`,
    `Type: ${fund.type.replace('_', ' ').toLowerCase()}`,
    fund.strategy && `Strategy: ${fund.strategy.replace('_', ' ')}`,
    fund.subStrategy && `Sub-strategy: ${fund.subStrategy}`,
    fund.description && `Description: ${fund.description}`,
    fund.aum && `AUM: $${formatAUM(fund.aum)}`,
    fund.stats?.return1Y && `1-Year Return: ${(fund.stats.return1Y * 100).toFixed(1)}%`,
    fund.stats?.sharpeRatio && `Sharpe Ratio: ${fund.stats.sharpeRatio.toFixed(2)}`,
    fund.stats?.maxDrawdown && `Max Drawdown: ${(fund.stats.maxDrawdown * 100).toFixed(1)}%`,
    fund.country && `Domicile: ${fund.country}`,
    fund.minInvestment && `Minimum Investment: $${formatAUM(fund.minInvestment)}`,
    fund.managementFee && `Management Fee: ${(fund.managementFee * 100).toFixed(1)}%`,
    fund.performanceFee && `Performance Fee: ${(fund.performanceFee * 100).toFixed(0)}%`,
    fund.lockup && `Lockup Period: ${fund.lockup}`,
    fund.redemption && `Redemption Terms: ${fund.redemption}`,
  ].filter(Boolean);

  return lines.join('\n');
}

// Generate embedding
async function generateEmbedding(
  text: string, 
  model: 'text-embedding-3-large' | 'text-embedding-3-small' = 'text-embedding-3-large'
): Promise<number[]> {
  const response = await openai.embeddings.create({
    model,
    input: text,
  });
  return response.data[0].embedding;
}

// Batch embedding generation
async function generateEmbeddingsBatch(
  texts: string[],
  model: 'text-embedding-3-large' | 'text-embedding-3-small' = 'text-embedding-3-large'
): Promise<number[][]> {
  const batches = chunk(texts, 100); // API limit
  const allEmbeddings: number[][] = [];

  for (const batch of batches) {
    const response = await openai.embeddings.create({
      model,
      input: batch,
    });
    allEmbeddings.push(...response.data.map(d => d.embedding));
  }

  return allEmbeddings;
}

// Update fund embeddings
export async function updateFundEmbeddings(fundIds?: string[]) {
  const where = fundIds ? { id: { in: fundIds } } : { status: 'APPROVED' };
  
  const funds = await prisma.fund.findMany({
    where,
    include: {
      returns: { orderBy: { year: 'desc', month: 'desc' }, take: 36 },
      stats: true,
    }
  });

  console.log(`Generating embeddings for ${funds.length} funds...`);

  const texts = funds.map(buildFundEmbeddingText);
  const embeddings = await generateEmbeddingsBatch(texts);

  // Update in batches
  for (let i = 0; i < funds.length; i++) {
    await prisma.$executeRaw`
      UPDATE "Fund" 
      SET embedding = ${embeddings[i]}::vector
      WHERE id = ${funds[i].id}
    `;
  }

  console.log(`Updated ${funds.length} fund embeddings`);
}

// Scheduled job: Refresh all embeddings
export async function refreshAllEmbeddings() {
  // Funds
  await updateFundEmbeddings();
  
  // Service Providers (similar pattern)
  await updateServiceProviderEmbeddings();
  
  // User profiles (if preferences changed)
  await updateUserProfileEmbeddings();
}
```

### pgvector Setup

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to Fund table
ALTER TABLE "Fund" ADD COLUMN embedding vector(3072);

-- Create index for fast similarity search
CREATE INDEX fund_embedding_idx ON "Fund" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For smaller tables, use exact search (HNSW)
CREATE INDEX fund_embedding_hnsw_idx ON "Fund"
USING hnsw (embedding vector_cosine_ops);

-- Similarity search function
CREATE OR REPLACE FUNCTION search_similar_funds(
  query_embedding vector(3072),
  fund_type text DEFAULT NULL,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id text,
  name text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    1 - (f.embedding <=> query_embedding) as similarity
  FROM "Fund" f
  WHERE f.status = 'APPROVED'
    AND f.visible = true
    AND (fund_type IS NULL OR f.type = fund_type)
    AND f.embedding IS NOT NULL
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

### Refresh Strategy

| Trigger | Action | Latency |
|---------|--------|---------|
| Fund created/updated | Regenerate fund embedding | Async (< 5s) |
| Monthly returns added | Regenerate fund embedding | Async (< 5s) |
| User preferences changed | Regenerate user embedding | Async (< 5s) |
| Document uploaded | Chunk & embed | Background job |
| Weekly scheduled | Full refresh (stats changes) | Nightly batch |

```typescript
// src/jobs/embedding-refresh.ts

import { Queue, Worker } from 'bullmq';

const embeddingQueue = new Queue('embeddings');

// Add job on fund update
export async function queueFundEmbeddingRefresh(fundId: string) {
  await embeddingQueue.add('refresh-fund', { fundId }, {
    delay: 1000, // Debounce rapid updates
    removeOnComplete: true,
  });
}

// Worker
const worker = new Worker('embeddings', async (job) => {
  switch (job.name) {
    case 'refresh-fund':
      await updateFundEmbeddings([job.data.fundId]);
      break;
    case 'refresh-all':
      await refreshAllEmbeddings();
      break;
  }
});

// Schedule nightly full refresh
await embeddingQueue.add('refresh-all', {}, {
  repeat: { cron: '0 3 * * *' } // 3 AM daily
});
```

---

## 3. Recommendation Engine

### Architecture: Hybrid Collaborative + Content-Based

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Recommendation Engine                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────┐     ┌─────────────────┐                       │
│   │  User Activity   │     │  User Profile    │                       │
│   │  - Views         │     │  - Preferences   │                       │
│   │  - Searches      │     │  - Risk tolerance│                       │
│   │  - Contacts      │     │  - AUM range     │                       │
│   │  - Saves         │     │  - Strategies    │                       │
│   └────────┬────────┘     └────────┬────────┘                       │
│            │                        │                                │
│            ▼                        ▼                                │
│   ┌────────────────────────────────────────────┐                    │
│   │           Candidate Generation              │                    │
│   ├────────────────────────────────────────────┤                    │
│   │                                             │                    │
│   │  1. Content-Based Filtering                 │                    │
│   │     - Similar to viewed funds (embeddings)  │                    │
│   │     - Matches stated preferences            │                    │
│   │                                             │                    │
│   │  2. Collaborative Filtering                 │                    │
│   │     - Similar users' interactions           │                    │
│   │     - "Investors like you also viewed..."   │                    │
│   │                                             │                    │
│   │  3. Popularity Signals                      │                    │
│   │     - Trending funds (recent views)         │                    │
│   │     - New funds (discovery boost)           │                    │
│   │                                             │                    │
│   └────────────────────┬───────────────────────┘                    │
│                        │                                             │
│                        ▼                                             │
│   ┌────────────────────────────────────────────┐                    │
│   │              Scoring & Ranking              │                    │
│   ├────────────────────────────────────────────┤                    │
│   │                                             │                    │
│   │  score = w1 * content_similarity            │                    │
│   │        + w2 * collaborative_score           │                    │
│   │        + w3 * popularity_score              │                    │
│   │        + w4 * freshness_boost               │                    │
│   │        + w5 * quality_score                 │                    │
│   │                                             │                    │
│   │  Personalized weights based on user type    │                    │
│   │                                             │                    │
│   └────────────────────┬───────────────────────┘                    │
│                        │                                             │
│                        ▼                                             │
│   ┌────────────────────────────────────────────┐                    │
│   │          Filtering & Business Rules         │                    │
│   ├────────────────────────────────────────────┤                    │
│   │  - Remove already viewed (unless re-engage) │                    │
│   │  - Apply accreditation requirements         │                    │
│   │  - Diversity (don't show 10 similar funds)  │                    │
│   │  - Boost premium listings (monetization)    │                    │
│   └────────────────────┬───────────────────────┘                    │
│                        │                                             │
│                        ▼                                             │
│              ┌──────────────────┐                                   │
│              │  Ranked Results   │                                   │
│              │  + Explanations   │                                   │
│              └──────────────────┘                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/ai/recommendations/engine.ts

import { prisma } from '@/lib/prisma';
import { vectorSearch } from '@/ai/embeddings/search';

interface RecommendationResult {
  fund: Fund;
  score: number;
  reasons: string[];
  source: 'content' | 'collaborative' | 'trending' | 'new';
}

export async function getRecommendations(
  userId: string,
  options: {
    limit?: number;
    excludeFundIds?: string[];
    fundType?: string;
  } = {}
): Promise<RecommendationResult[]> {
  const limit = options.limit || 20;
  
  // 1. Get user data
  const [profile, recentActivity, savedSearches] = await Promise.all([
    getUserProfile(userId),
    getRecentActivity(userId, 30), // Last 30 days
    getSavedSearches(userId),
  ]);

  // 2. Generate candidates from multiple sources
  const [contentBased, collaborative, trending, newFunds] = await Promise.all([
    getContentBasedCandidates(userId, recentActivity, profile, limit * 2),
    getCollaborativeCandidates(userId, recentActivity, limit * 2),
    getTrendingFunds(options.fundType, limit),
    getNewFunds(options.fundType, limit),
  ]);

  // 3. Merge and deduplicate
  const candidateMap = new Map<string, RecommendationResult>();
  
  for (const fund of contentBased) {
    candidateMap.set(fund.id, {
      fund,
      score: fund._similarity || 0,
      reasons: fund._reasons || [],
      source: 'content',
    });
  }

  for (const fund of collaborative) {
    if (candidateMap.has(fund.id)) {
      const existing = candidateMap.get(fund.id)!;
      existing.score += fund._score * 0.8; // Boost if in multiple sources
      existing.reasons.push(...(fund._reasons || []));
    } else {
      candidateMap.set(fund.id, {
        fund,
        score: fund._score || 0,
        reasons: fund._reasons || [],
        source: 'collaborative',
      });
    }
  }

  // Add trending and new with lower base scores
  for (const fund of trending) {
    if (!candidateMap.has(fund.id)) {
      candidateMap.set(fund.id, {
        fund,
        score: 0.3,
        reasons: ['Trending this week'],
        source: 'trending',
      });
    }
  }

  for (const fund of newFunds) {
    if (!candidateMap.has(fund.id)) {
      candidateMap.set(fund.id, {
        fund,
        score: 0.25,
        reasons: ['Recently added'],
        source: 'new',
      });
    }
  }

  // 4. Filter
  let candidates = Array.from(candidateMap.values())
    .filter(c => !options.excludeFundIds?.includes(c.fund.id))
    .filter(c => !recentActivity.viewedFundIds.includes(c.fund.id) || c.score > 0.8);

  // 5. Apply diversity - don't show too many similar funds
  candidates = applyDiversity(candidates);

  // 6. Sort by score and return top N
  candidates.sort((a, b) => b.score - a.score);
  
  return candidates.slice(0, limit);
}

// Content-based: Find funds similar to what user has viewed/liked
async function getContentBasedCandidates(
  userId: string,
  activity: UserActivity,
  profile: UserProfile,
  limit: number
): Promise<Fund[]> {
  const candidates: Fund[] = [];
  
  // Similar to recently viewed funds
  if (activity.viewedFundIds.length > 0) {
    // Get embeddings of viewed funds and find similar
    const viewedFunds = await prisma.fund.findMany({
      where: { id: { in: activity.viewedFundIds.slice(0, 5) } },
      select: { embedding: true }
    });

    // Average embedding of viewed funds
    const avgEmbedding = averageVectors(viewedFunds.map(f => f.embedding));
    
    const similar = await vectorSearch(avgEmbedding, {
      limit,
      excludeIds: activity.viewedFundIds,
    });

    candidates.push(...similar.map(f => ({
      ...f,
      _similarity: f._score,
      _reasons: ['Similar to funds you\'ve viewed']
    })));
  }

  // Match stated preferences
  if (profile.preferences) {
    const preferenceText = buildPreferenceText(profile.preferences);
    const prefEmbedding = await generateEmbedding(preferenceText);
    
    const matches = await vectorSearch(prefEmbedding, {
      limit: limit / 2,
      excludeIds: candidates.map(c => c.id),
    });

    candidates.push(...matches.map(f => ({
      ...f,
      _similarity: f._score * 0.9,
      _reasons: ['Matches your investment preferences']
    })));
  }

  return candidates;
}

// Collaborative: Find what similar users interacted with
async function getCollaborativeCandidates(
  userId: string,
  activity: UserActivity,
  limit: number
): Promise<Fund[]> {
  // Find users with similar activity patterns
  const similarUsers = await findSimilarUsers(userId, activity);
  
  if (similarUsers.length === 0) return [];

  // Get funds that similar users viewed/contacted but this user hasn't
  const similarUserFunds = await prisma.userActivity.groupBy({
    by: ['entityId'],
    where: {
      userId: { in: similarUsers.map(u => u.id) },
      entityType: 'FUND',
      action: { in: ['VIEW', 'CONTACT', 'SAVE'] },
      entityId: { notIn: activity.viewedFundIds },
    },
    _count: { entityId: true },
    orderBy: { _count: { entityId: 'desc' } },
    take: limit,
  });

  const fundIds = similarUserFunds.map(f => f.entityId!);
  const funds = await prisma.fund.findMany({
    where: { id: { in: fundIds } },
    include: { stats: true, manager: true },
  });

  return funds.map(f => ({
    ...f,
    _score: similarUserFunds.find(sf => sf.entityId === f.id)?._count.entityId || 0,
    _reasons: ['Investors with similar interests viewed this'],
  }));
}

// Find users with similar activity/preferences
async function findSimilarUsers(userId: string, activity: UserActivity): Promise<User[]> {
  // Users who viewed the same funds
  const usersWhoViewedSame = await prisma.userActivity.findMany({
    where: {
      entityId: { in: activity.viewedFundIds },
      entityType: 'FUND',
      userId: { not: userId },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  // Could also use user profile embeddings for similarity
  return await prisma.user.findMany({
    where: { id: { in: usersWhoViewedSame.map(u => u.userId) } },
    take: 50,
  });
}

// Diversity filter - ensure variety in recommendations
function applyDiversity(candidates: RecommendationResult[]): RecommendationResult[] {
  const result: RecommendationResult[] = [];
  const seenStrategies = new Map<string, number>();
  const maxPerStrategy = 3;

  for (const candidate of candidates) {
    const strategy = candidate.fund.strategy || 'other';
    const count = seenStrategies.get(strategy) || 0;
    
    if (count < maxPerStrategy) {
      result.push(candidate);
      seenStrategies.set(strategy, count + 1);
    }
  }

  return result;
}
```

### Recommendation Display

```typescript
// API Response example
{
  "recommendations": [
    {
      "fund": {
        "id": "clx123...",
        "name": "Quantum Alpha Long/Short",
        "type": "HEDGE_FUND",
        "strategy": "long_short_equity",
        "aum": 450000000,
        "stats": { "return1Y": 0.182, "sharpeRatio": 1.65 }
      },
      "score": 0.92,
      "reasons": [
        "Similar to Apex Capital you viewed last week",
        "Matches your preference for equity strategies"
      ],
      "source": "content"
    },
    {
      "fund": { ... },
      "score": 0.87,
      "reasons": ["Investors with similar portfolios contacted this fund"],
      "source": "collaborative"
    }
  ],
  "explanations": {
    "based_on": ["Your recent searches", "Funds you've viewed", "Your stated preferences"],
    "diversity_note": "Showing a mix of strategies to help you explore"
  }
}
```

---

## 4. AI Chat Interface

### Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI Chat Interface                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend (React)                             │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  Chat Window                                             │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐ │    │   │
│  │  │  │ 🤖 Welcome! I can help you discover funds,          │ │    │   │
│  │  │  │    compare options, and answer questions.           │ │    │   │
│  │  │  └─────────────────────────────────────────────────────┘ │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐ │    │   │
│  │  │  │ 👤 Find me crypto funds that beat BTC last year     │ │    │   │
│  │  │  └─────────────────────────────────────────────────────┘ │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐ │    │   │
│  │  │  │ 🤖 I found 3 crypto funds that outperformed         │ │    │   │
│  │  │  │    Bitcoin in 2025:                                  │ │    │   │
│  │  │  │    ┌──────────────────────────────────────────────┐ │ │    │   │
│  │  │  │    │  [Fund Card]  [Fund Card]  [Fund Card]       │ │ │    │   │
│  │  │  │    └──────────────────────────────────────────────┘ │ │    │   │
│  │  │  │    Would you like me to compare them?              │ │    │   │
│  │  │  └─────────────────────────────────────────────────────┘ │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐ │    │   │
│  │  │  │ [Quick Actions: Compare | Save Search | Alert Me]  │ │    │   │
│  │  │  └─────────────────────────────────────────────────────┘ │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Backend (API)                                │   │
│  │                                                                   │   │
│  │   User Message                                                    │   │
│  │        │                                                          │   │
│  │        ▼                                                          │   │
│  │   ┌──────────────┐                                               │   │
│  │   │ Conversation │ ◄── Load history, user context                │   │
│  │   │   Manager    │                                               │   │
│  │   └──────┬───────┘                                               │   │
│  │          │                                                        │   │
│  │          ▼                                                        │   │
│  │   ┌──────────────┐     ┌──────────────┐                         │   │
│  │   │  Tool Router │ ──► │ Function     │                         │   │
│  │   │  (GPT-4o)    │     │ Execution    │                         │   │
│  │   └──────────────┘     └──────────────┘                         │   │
│  │          │                    │                                   │   │
│  │          │              ┌─────┴─────┐                            │   │
│  │          │              ▼           ▼                            │   │
│  │          │        ┌─────────┐ ┌─────────┐                       │   │
│  │          │        │ Search  │ │   RAG   │                       │   │
│  │          │        │ Engine  │ │ Retrieval│                       │   │
│  │          │        └─────────┘ └─────────┘                       │   │
│  │          │                                                        │   │
│  │          ▼                                                        │   │
│  │   ┌──────────────┐                                               │   │
│  │   │  Response    │ ──► Streaming response with fund cards        │   │
│  │   │  Generator   │                                               │   │
│  │   └──────────────┘                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### System Prompt

```typescript
// src/ai/chat/prompts.ts

export const CHAT_SYSTEM_PROMPT = `You are the HedgeCo Assistant, an AI-powered fund discovery and due diligence helper for accredited investors.

## Your Capabilities
1. **Fund Search** - Find funds matching specific criteria (strategy, returns, AUM, fees, etc.)
2. **Fund Comparison** - Compare multiple funds side-by-side
3. **Fund Details** - Provide detailed information about specific funds
4. **Due Diligence** - Answer questions about fund strategies, risks, terms
5. **Market Context** - Explain performance in context of market conditions
6. **Recommendations** - Suggest funds based on user preferences

## Guidelines
- Be helpful, accurate, and concise
- Always cite specific data when discussing fund performance
- If you're unsure about something, say so
- Never make up fund data - only use what's retrieved
- Respect that users are accredited investors - don't be condescending
- When showing funds, use the display_funds function to render cards
- Proactively offer to compare funds or dive deeper

## Response Format
- Use natural conversational language
- When showing multiple funds, summarize key differences
- Offer relevant follow-up actions
- Keep responses focused and scannable

## Current Context
- Date: {{current_date}}
- User: {{user_name}} ({{user_type}})
- Preferences: {{user_preferences}}
- Recent activity: {{recent_activity}}

## Available Tools
You have access to:
- search_funds: Find funds by criteria
- get_fund_details: Get details for a specific fund  
- compare_funds: Compare multiple funds
- get_fund_documents: Retrieve DDQs, fact sheets
- calculate_metrics: Run performance calculations
- get_market_context: Get benchmark/market data for context`;
```

### Chat API Implementation

```typescript
// src/app/api/chat/route.ts

import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { chatFunctions, executeChatFunction } from '@/ai/chat/functions';
import { CHAT_SYSTEM_PROMPT } from '@/ai/chat/prompts';

const openai = new OpenAI();

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages, conversationId } = await req.json();

  // Load conversation history
  let history: Message[] = [];
  if (conversationId) {
    history = await loadConversationHistory(conversationId);
  }

  // Build system prompt with user context
  const userContext = await getUserContext(session.user.id);
  const systemPrompt = buildSystemPrompt(CHAT_SYSTEM_PROMPT, userContext);

  // Streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          ...messages
        ],
        functions: chatFunctions,
        function_call: 'auto',
        stream: true,
      });

      let functionCall: { name: string; arguments: string } | null = null;
      let contentBuffer = '';

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;

        // Handle function call
        if (delta?.function_call) {
          if (delta.function_call.name) {
            functionCall = { name: delta.function_call.name, arguments: '' };
          }
          if (delta.function_call.arguments) {
            functionCall!.arguments += delta.function_call.arguments;
          }
        }

        // Handle content
        if (delta?.content) {
          contentBuffer += delta.content;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'content', 
            content: delta.content 
          })}\n\n`));
        }

        // Check for finish
        if (chunk.choices[0]?.finish_reason === 'function_call' && functionCall) {
          // Execute the function
          const result = await executeChatFunction(
            functionCall.name,
            JSON.parse(functionCall.arguments),
            session.user.id
          );

          // Send function result as a special message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'function_result',
            function: functionCall.name,
            result 
          })}\n\n`));

          // Continue the conversation with function result
          const followUp = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              ...history,
              ...messages,
              { role: 'assistant', content: null, function_call: functionCall },
              { role: 'function', name: functionCall.name, content: JSON.stringify(result) }
            ],
            stream: true,
          });

          for await (const followUpChunk of followUp) {
            if (followUpChunk.choices[0]?.delta?.content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'content', 
                content: followUpChunk.choices[0].delta.content 
              })}\n\n`));
            }
          }
        }
      }

      // Save conversation
      await saveConversation(conversationId, session.user.id, messages, contentBuffer);

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Chat Functions

```typescript
// src/ai/chat/functions.ts

export const chatFunctions = [
  {
    name: "search_funds",
    description: "Search for funds matching criteria. Returns fund cards to display.",
    parameters: {
      type: "object",
      properties: {
        // ... same as NL search
      }
    }
  },
  {
    name: "display_funds",
    description: "Display fund cards in the chat. Use after search or when user asks to see funds.",
    parameters: {
      type: "object",
      properties: {
        fund_ids: {
          type: "array",
          items: { type: "string" },
          description: "Fund IDs to display as cards"
        },
        layout: {
          type: "string",
          enum: ["cards", "list", "comparison"],
          description: "How to display the funds"
        }
      },
      required: ["fund_ids"]
    }
  },
  {
    name: "compare_funds",
    description: "Generate a comparison table for multiple funds",
    parameters: {
      type: "object",
      properties: {
        fund_ids: {
          type: "array",
          items: { type: "string" },
          description: "2-5 fund IDs to compare"
        },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Specific metrics to compare. Default: returns, sharpe, fees, aum"
        }
      },
      required: ["fund_ids"]
    }
  },
  {
    name: "get_fund_details",
    description: "Get detailed information about a specific fund",
    parameters: {
      type: "object",
      properties: {
        fund_id: { type: "string" },
        sections: {
          type: "array",
          items: { 
            type: "string",
            enum: ["overview", "performance", "terms", "team", "documents", "similar"]
          }
        }
      },
      required: ["fund_id"]
    }
  },
  {
    name: "save_search",
    description: "Save a search for the user with optional alerts",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        filters: { type: "object" },
        enable_alerts: { type: "boolean" }
      },
      required: ["name", "filters"]
    }
  },
  {
    name: "contact_fund",
    description: "Initiate contact with a fund manager",
    parameters: {
      type: "object",
      properties: {
        fund_id: { type: "string" },
        message: { type: "string" }
      },
      required: ["fund_id"]
    }
  }
];

export async function executeChatFunction(
  name: string,
  args: Record<string, any>,
  userId: string
): Promise<any> {
  switch (name) {
    case 'search_funds':
      const results = await naturalLanguageSearch({ 
        query: '', 
        userId,
        filters: args 
      });
      // Log activity
      await logActivity(userId, 'SEARCH', 'FUND', null, args);
      return {
        funds: results.funds.slice(0, 10),
        totalCount: results.totalCount,
        appliedFilters: results.appliedFilters
      };

    case 'display_funds':
      const funds = await prisma.fund.findMany({
        where: { id: { in: args.fund_ids } },
        include: { stats: true, manager: { include: { profile: true } } }
      });
      return { funds, layout: args.layout || 'cards' };

    case 'compare_funds':
      const comparison = await generateComparison(args.fund_ids, args.metrics);
      return comparison;

    case 'get_fund_details':
      const fund = await getFundWithDetails(args.fund_id, args.sections);
      await logActivity(userId, 'VIEW', 'FUND', args.fund_id);
      return fund;

    case 'save_search':
      const saved = await saveUserSearch(userId, args.name, args.filters, args.enable_alerts);
      return { success: true, searchId: saved.id };

    case 'contact_fund':
      // Queue the contact request
      await queueContactRequest(userId, args.fund_id, args.message);
      return { success: true, message: 'Contact request sent to fund manager' };

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}
```

### Frontend Chat Component

```tsx
// src/components/chat/ChatInterface.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { FundCard } from '@/components/funds/FundCard';
import { ComparisonTable } from '@/components/funds/ComparisonTable';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    functionResults 
  } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-xl">🤖</span>
          HedgeCo Assistant
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <ChatMessage key={i} message={message} />
        ))}
        
        {/* Render function results (fund cards, comparisons) */}
        {functionResults.map((result, i) => (
          <FunctionResultDisplay key={i} result={result} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse delay-75">●</span>
            <span className="animate-pulse delay-150">●</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about funds, compare options, or search..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        
        {/* Quick suggestions */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {['Find hedge funds', 'Compare top performers', 'New crypto funds'].map(q => (
            <button
              key={q}
              type="button"
              onClick={() => setInput(q)}
              className="text-xs px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              {q}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}

function FunctionResultDisplay({ result }: { result: FunctionResult }) {
  switch (result.function) {
    case 'display_funds':
    case 'search_funds':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.result.funds.map((fund: Fund) => (
            <FundCard key={fund.id} fund={fund} compact />
          ))}
        </div>
      );
    
    case 'compare_funds':
      return <ComparisonTable data={result.result} />;
    
    default:
      return null;
  }
}
```

---

## 5. Fund Summary Generation

### Overview

Automatically generate natural language fund profiles from structured data, enriched with market context and peer comparisons.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Fund Summary Generation                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input Sources                                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ Fund Data  │ │  Returns   │ │   Stats    │ │  Manager   │   │
│  │ (basic)    │ │  (monthly) │ │ (computed) │ │  (profile) │   │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘   │
│        │              │              │              │            │
│        └──────────────┴──────────────┴──────────────┘            │
│                              │                                   │
│                              ▼                                   │
│                   ┌────────────────────┐                        │
│                   │  Context Enricher   │                        │
│                   │  - Market benchmarks│                        │
│                   │  - Peer comparison  │                        │
│                   │  - News mentions    │                        │
│                   └──────────┬─────────┘                        │
│                              │                                   │
│                              ▼                                   │
│                   ┌────────────────────┐                        │
│                   │  Prompt Builder     │                        │
│                   │  (Template + Data)  │                        │
│                   └──────────┬─────────┘                        │
│                              │                                   │
│                              ▼                                   │
│                   ┌────────────────────┐                        │
│                   │     GPT-4o         │                        │
│                   │  Generation        │                        │
│                   └──────────┬─────────┘                        │
│                              │                                   │
│                              ▼                                   │
│  Output Sections                                                 │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │  Executive │ │  Strategy  │ │ Performance│ │   Risk &   │   │
│  │  Summary   │ │  Overview  │ │  Analysis  │ │   Terms    │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Prompt Template

```typescript
// src/ai/summaries/prompts.ts

export const FUND_SUMMARY_PROMPT = `Generate a professional fund summary for accredited investors.

## Fund Data
Name: {{fund_name}}
Type: {{fund_type}}
Strategy: {{strategy}}
Sub-strategy: {{sub_strategy}}
Description: {{description}}
AUM: {{aum}}
Inception Date: {{inception_date}}
Domicile: {{country}}

## Manager
Firm: {{manager_firm}}
Key Personnel: {{key_personnel}}

## Terms
Minimum Investment: {{min_investment}}
Management Fee: {{management_fee}}
Performance Fee: {{performance_fee}}
Lockup: {{lockup}}
Redemption: {{redemption}}
High Water Mark: {{hwm}}

## Performance (Monthly Returns)
{{returns_table}}

## Calculated Statistics
- YTD Return: {{ytd}}
- 1-Year Return: {{return_1y}}
- 3-Year Annualized: {{return_3y}}
- Since Inception (Annualized): {{return_inception}}
- Sharpe Ratio: {{sharpe}}
- Sortino Ratio: {{sortino}}
- Max Drawdown: {{max_drawdown}}
- Volatility: {{volatility}}

## Market Context
- S&P 500 YTD: {{sp500_ytd}}
- Strategy Benchmark ({{benchmark_name}}) YTD: {{benchmark_ytd}}
- Peer Average ({{peer_count}} funds): {{peer_avg_return}}

## Recent News Mentions
{{news_mentions}}

---

Generate a summary with these sections:

### Executive Summary (2-3 sentences)
Hook the reader with the fund's key differentiator and headline performance.

### Investment Strategy
Explain the strategy in plain English. What does the fund actually do? What's the edge?

### Performance Analysis
Contextualize returns vs benchmarks and peers. Highlight consistency, drawdowns, risk-adjusted returns.
Be specific with numbers but explain what they mean.

### Risk Considerations
Honest assessment of risks: strategy risks, concentration, liquidity, market sensitivity.

### Terms & Fit
Who is this fund suitable for? Summarize fees/terms and what type of investor should consider it.

---

Guidelines:
- Write for sophisticated investors (don't oversimplify)
- Be balanced - highlight both strengths and risks
- Use specific numbers, not vague language
- Compare to relevant benchmarks
- Keep total length under 500 words
- Use professional but accessible tone`;
```

### Implementation

```typescript
// src/ai/summaries/generator.ts

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { FUND_SUMMARY_PROMPT } from './prompts';
import { getMarketContext } from './market-context';
import { getNewsForFund } from './news';

const openai = new OpenAI();

interface FundSummary {
  executiveSummary: string;
  investmentStrategy: string;
  performanceAnalysis: string;
  riskConsiderations: string;
  termsAndFit: string;
  generatedAt: Date;
  dataAsOf: Date;
}

export async function generateFundSummary(fundId: string): Promise<FundSummary> {
  // 1. Fetch all fund data
  const fund = await prisma.fund.findUnique({
    where: { id: fundId },
    include: {
      manager: { include: { profile: true } },
      returns: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 60 },
      stats: true,
    }
  });

  if (!fund) throw new Error('Fund not found');

  // 2. Get market context
  const marketContext = await getMarketContext({
    strategy: fund.strategy,
    fundType: fund.type,
  });

  // 3. Get peer comparison
  const peerStats = await getPeerStats(fund.strategy, fund.type);

  // 4. Get news mentions
  const news = await getNewsForFund(fund.name, fund.manager?.profile?.company);

  // 5. Build the prompt
  const prompt = buildPrompt(FUND_SUMMARY_PROMPT, {
    fund_name: fund.name,
    fund_type: formatFundType(fund.type),
    strategy: fund.strategy,
    sub_strategy: fund.subStrategy,
    description: fund.description || 'Not provided',
    aum: formatCurrency(fund.aum),
    inception_date: formatDate(fund.inception),
    country: fund.country,
    
    manager_firm: fund.manager?.profile?.company || 'Not disclosed',
    key_personnel: fund.manager?.profile?.firstName + ' ' + fund.manager?.profile?.lastName,
    
    min_investment: formatCurrency(fund.minInvestment),
    management_fee: formatPercent(fund.managementFee),
    performance_fee: formatPercent(fund.performanceFee),
    lockup: fund.lockup || 'None',
    redemption: fund.redemption || 'Not specified',
    hwm: 'Yes', // Assume standard
    
    returns_table: formatReturnsTable(fund.returns),
    
    ytd: formatPercent(fund.stats?.ytdReturn),
    return_1y: formatPercent(fund.stats?.return1Y),
    return_3y: formatPercent(fund.stats?.return3YAnnualized),
    return_inception: formatPercent(fund.stats?.returnSinceInception),
    sharpe: fund.stats?.sharpeRatio?.toFixed(2),
    sortino: fund.stats?.sortinoRatio?.toFixed(2),
    max_drawdown: formatPercent(fund.stats?.maxDrawdown),
    volatility: formatPercent(fund.stats?.volatility),
    
    sp500_ytd: formatPercent(marketContext.sp500Ytd),
    benchmark_name: marketContext.benchmarkName,
    benchmark_ytd: formatPercent(marketContext.benchmarkYtd),
    peer_count: peerStats.count,
    peer_avg_return: formatPercent(peerStats.avgReturn),
    
    news_mentions: news.slice(0, 3).map(n => `- ${n.title} (${n.source})`).join('\n') || 'No recent mentions',
  });

  // 6. Generate with GPT-4o
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '';

  // 7. Parse sections
  const sections = parseSummary(content);

  // 8. Cache the summary
  await prisma.fundSummary.upsert({
    where: { fundId },
    create: {
      fundId,
      ...sections,
      generatedAt: new Date(),
      dataAsOf: new Date(),
    },
    update: {
      ...sections,
      generatedAt: new Date(),
      dataAsOf: new Date(),
    }
  });

  return {
    ...sections,
    generatedAt: new Date(),
    dataAsOf: new Date(),
  };
}

function parseSummary(content: string): Omit<FundSummary, 'generatedAt' | 'dataAsOf'> {
  const sections = {
    executiveSummary: '',
    investmentStrategy: '',
    performanceAnalysis: '',
    riskConsiderations: '',
    termsAndFit: '',
  };

  // Simple regex-based parsing
  const execMatch = content.match(/### Executive Summary\n([\s\S]*?)(?=###|$)/);
  if (execMatch) sections.executiveSummary = execMatch[1].trim();

  const stratMatch = content.match(/### Investment Strategy\n([\s\S]*?)(?=###|$)/);
  if (stratMatch) sections.investmentStrategy = stratMatch[1].trim();

  const perfMatch = content.match(/### Performance Analysis\n([\s\S]*?)(?=###|$)/);
  if (perfMatch) sections.performanceAnalysis = perfMatch[1].trim();

  const riskMatch = content.match(/### Risk Considerations\n([\s\S]*?)(?=###|$)/);
  if (riskMatch) sections.riskConsiderations = riskMatch[1].trim();

  const termsMatch = content.match(/### Terms & Fit\n([\s\S]*?)(?=###|$)/);
  if (termsMatch) sections.termsAndFit = termsMatch[1].trim();

  return sections;
}

function formatReturnsTable(returns: FundReturn[]): string {
  // Group by year
  const byYear = returns.reduce((acc, r) => {
    if (!acc[r.year]) acc[r.year] = {};
    acc[r.year][r.month] = r.netReturn;
    return acc;
  }, {} as Record<number, Record<number, number>>);

  const years = Object.keys(byYear).sort().reverse().slice(0, 3);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let table = 'Year | ' + months.join(' | ') + ' | YTD\n';
  table += '---|' + months.map(() => '---').join('|') + '|---\n';

  for (const year of years) {
    const yearData = byYear[parseInt(year)];
    let ytd = 1;
    const row = [year];
    for (let m = 1; m <= 12; m++) {
      const ret = yearData[m];
      if (ret !== undefined) {
        row.push((ret * 100).toFixed(1) + '%');
        ytd *= (1 + ret);
      } else {
        row.push('-');
      }
    }
    row.push(((ytd - 1) * 100).toFixed(1) + '%');
    table += row.join(' | ') + '\n';
  }

  return table;
}
```

### Example Output

```markdown
### Executive Summary
Quantum Alpha Long/Short has delivered exceptional risk-adjusted returns, posting 18.2% YTD while maintaining a Sharpe ratio of 1.65 — well above both the S&P 500 and its long/short equity peers. The fund's disciplined approach to position sizing has kept drawdowns under 8% even in volatile markets.

### Investment Strategy
Quantum Alpha employs a fundamental long/short equity strategy focused on mid-cap US equities. The fund identifies undervalued companies with improving fundamentals for long positions while shorting overvalued names showing deteriorating metrics. Net exposure typically ranges from 30-60% long, providing meaningful upside capture while limiting downside. The strategy emphasizes sector rotation based on economic cycle positioning.

### Performance Analysis
The fund's 18.2% YTD return significantly outpaces the S&P 500 (+8.5%) and the HFRX Equity Hedge Index (+6.2%). More impressive is the consistency: monthly returns have been positive in 9 of 11 months, with the single negative month limited to -1.2%. The 1.65 Sharpe ratio ranks in the top decile of long/short equity funds. Over 3 years, the fund has compounded at 14.8% annually versus 10.2% for peers — a 460 basis point advantage driven by superior stock selection on both long and short books.

### Risk Considerations
Concentration risk is moderate with top 10 positions representing ~40% of gross exposure. The fund's mid-cap focus creates some liquidity constraints that could impact larger redemptions. Short exposure (typically 40-50% gross) introduces borrowing costs and short-squeeze risk. Strategy performance tends to lag in strong bull markets when shorts act as a drag. Leverage is modest at 1.2-1.5x gross.

### Terms & Fit
With a $500K minimum and 1.5/20 fee structure, Quantum Alpha is positioned for institutional investors and family offices seeking equity exposure with downside protection. The 12-month soft lockup and quarterly redemptions with 45-day notice require medium-term commitment. Best suited for investors wanting equity beta with meaningful alpha generation and who can tolerate underperformance during momentum-driven rallies.
```

---

## 6. Smart Matching

### Overview

Intelligently match investors with fund managers based on stated criteria, implicit preferences, and behavioral signals.

### Matching Dimensions

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Matching Dimensions                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INVESTOR CRITERIA              FUND CHARACTERISTICS                   │
│  ════════════════              ═══════════════════                     │
│                                                                         │
│  Explicit Preferences:          Fund Profile:                          │
│  ┌────────────────────┐        ┌────────────────────┐                 │
│  │ • Fund types        │  ←──→ │ • Type             │                 │
│  │ • Strategies        │  ←──→ │ • Strategy         │                 │
│  │ • Geography         │  ←──→ │ • Domicile         │                 │
│  │ • AUM range         │  ←──→ │ • AUM              │                 │
│  │ • Min return target │  ←──→ │ • Historical returns│                 │
│  │ • Max fees          │  ←──→ │ • Fee structure    │                 │
│  │ • Liquidity needs   │  ←──→ │ • Redemption terms │                 │
│  └────────────────────┘        └────────────────────┘                 │
│                                                                         │
│  Risk Profile:                  Risk Metrics:                          │
│  ┌────────────────────┐        ┌────────────────────┐                 │
│  │ • Risk tolerance    │  ←──→ │ • Volatility       │                 │
│  │ • Max drawdown      │  ←──→ │ • Max drawdown     │                 │
│  │ • Correlation pref  │  ←──→ │ • Beta to S&P      │                 │
│  └────────────────────┘        └────────────────────┘                 │
│                                                                         │
│  Behavioral Signals:            Manager Quality:                        │
│  ┌────────────────────┐        ┌────────────────────┐                 │
│  │ • Viewed funds      │  ←──→ │ • Track record     │                 │
│  │ • Search patterns   │  ←──→ │ • AUM growth       │                 │
│  │ • Time on pages     │  ←──→ │ • Responsiveness   │                 │
│  │ • Contact history   │  ←──→ │ • Documentation    │                 │
│  └────────────────────┘        └────────────────────┘                 │
│                                                                         │
│                    ┌───────────────────┐                               │
│                    │   MATCH SCORE     │                               │
│                    │   0-100 + reasons │                               │
│                    └───────────────────┘                               │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/ai/matching/engine.ts

import { prisma } from '@/lib/prisma';
import { vectorSearch } from '@/ai/embeddings/search';

interface MatchResult {
  fund: Fund;
  score: number;
  breakdown: {
    criteria: number;      // How well fund meets stated criteria
    behavioral: number;    // Based on viewing patterns
    semantic: number;      // Embedding similarity
    quality: number;       // Fund quality score
  };
  reasons: string[];
  concerns: string[];
}

interface InvestorProfile {
  id: string;
  preferences: {
    fundTypes?: string[];
    strategies?: string[];
    countries?: string[];
    aumRange?: { min?: number; max?: number };
    returnTarget?: number;
    maxFees?: { management?: number; performance?: number };
    liquidity?: 'daily' | 'monthly' | 'quarterly' | 'annual' | 'lockup_ok';
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
    maxDrawdown?: number;
  };
  activity: {
    viewedFunds: string[];
    contactedFunds: string[];
    savedFunds: string[];
    searchQueries: string[];
  };
  embedding?: number[];
}

export async function findMatches(
  investorId: string,
  options: {
    limit?: number;
    excludeContacted?: boolean;
    boostNew?: boolean;
  } = {}
): Promise<MatchResult[]> {
  const limit = options.limit || 20;

  // 1. Get investor profile
  const investor = await getInvestorProfile(investorId);

  // 2. Get candidate funds (pre-filter for efficiency)
  const candidates = await getCandidateFunds(investor, limit * 3);

  // 3. Score each candidate
  const scored: MatchResult[] = [];
  
  for (const fund of candidates) {
    const result = await scoreFund(fund, investor);
    scored.push(result);
  }

  // 4. Sort by score
  scored.sort((a, b) => b.score - a.score);

  // 5. Apply exclusions
  let final = scored;
  if (options.excludeContacted) {
    final = final.filter(r => !investor.activity.contactedFunds.includes(r.fund.id));
  }

  return final.slice(0, limit);
}

async function scoreFund(fund: Fund & { stats: FundStats }, investor: InvestorProfile): Promise<MatchResult> {
  const breakdown = {
    criteria: 0,
    behavioral: 0,
    semantic: 0,
    quality: 0,
  };
  const reasons: string[] = [];
  const concerns: string[] = [];

  const prefs = investor.preferences;

  // --- CRITERIA MATCH (40% weight) ---
  let criteriaPoints = 0;
  let criteriaMax = 0;

  // Fund type match
  criteriaMax += 10;
  if (!prefs.fundTypes?.length || prefs.fundTypes.includes(fund.type)) {
    criteriaPoints += 10;
    if (prefs.fundTypes?.includes(fund.type)) {
      reasons.push(`Matches your preferred fund type: ${formatFundType(fund.type)}`);
    }
  }

  // Strategy match
  criteriaMax += 10;
  if (!prefs.strategies?.length || prefs.strategies.some(s => fund.strategy?.includes(s))) {
    criteriaPoints += 10;
    if (prefs.strategies?.some(s => fund.strategy?.includes(s))) {
      reasons.push(`Matches your interest in ${fund.strategy} strategies`);
    }
  }

  // AUM range
  criteriaMax += 10;
  if (prefs.aumRange) {
    const aum = Number(fund.aum);
    const inRange = (!prefs.aumRange.min || aum >= prefs.aumRange.min) &&
                    (!prefs.aumRange.max || aum <= prefs.aumRange.max);
    if (inRange) {
      criteriaPoints += 10;
      reasons.push(`AUM (${formatCurrency(fund.aum)}) within your target range`);
    } else {
      concerns.push(`AUM outside your preferred range`);
    }
  } else {
    criteriaPoints += 10;
  }

  // Return target
  criteriaMax += 15;
  if (prefs.returnTarget && fund.stats?.return1Y) {
    if (fund.stats.return1Y >= prefs.returnTarget) {
      criteriaPoints += 15;
      reasons.push(`1Y return (${formatPercent(fund.stats.return1Y)}) exceeds your ${formatPercent(prefs.returnTarget)} target`);
    } else {
      criteriaPoints += Math.max(0, 15 * (fund.stats.return1Y / prefs.returnTarget));
      concerns.push(`1Y return below your target`);
    }
  } else {
    criteriaPoints += 10;
  }

  // Fee limits
  criteriaMax += 10;
  if (prefs.maxFees) {
    let feeOk = true;
    if (prefs.maxFees.management && fund.managementFee && Number(fund.managementFee) > prefs.maxFees.management) {
      feeOk = false;
      concerns.push(`Management fee (${formatPercent(fund.managementFee)}) above your max`);
    }
    if (prefs.maxFees.performance && fund.performanceFee && Number(fund.performanceFee) > prefs.maxFees.performance) {
      feeOk = false;
      concerns.push(`Performance fee (${formatPercent(fund.performanceFee)}) above your max`);
    }
    if (feeOk) {
      criteriaPoints += 10;
      reasons.push(`Fee structure within your limits`);
    }
  } else {
    criteriaPoints += 10;
  }

  // Risk tolerance
  criteriaMax += 10;
  if (prefs.riskTolerance && fund.stats?.volatility) {
    const volThresholds = { conservative: 0.1, moderate: 0.2, aggressive: 0.35 };
    const maxVol = volThresholds[prefs.riskTolerance];
    if (fund.stats.volatility <= maxVol) {
      criteriaPoints += 10;
      reasons.push(`Volatility (${formatPercent(fund.stats.volatility)}) appropriate for your risk profile`);
    } else {
      criteriaPoints += Math.max(0, 10 * (maxVol / fund.stats.volatility));
      concerns.push(`Higher volatility than your typical preference`);
    }
  } else {
    criteriaPoints += 8;
  }

  // Max drawdown
  criteriaMax += 10;
  if (prefs.maxDrawdown && fund.stats?.maxDrawdown) {
    if (Math.abs(fund.stats.maxDrawdown) <= Math.abs(prefs.maxDrawdown)) {
      criteriaPoints += 10;
      reasons.push(`Max drawdown (${formatPercent(fund.stats.maxDrawdown)}) within your limit`);
    } else {
      concerns.push(`Historical drawdown exceeded your limit`);
    }
  } else {
    criteriaPoints += 8;
  }

  breakdown.criteria = (criteriaPoints / criteriaMax) * 40;

  // --- BEHAVIORAL MATCH (25% weight) ---
  let behavioralScore = 0;

  // Similar to viewed funds
  if (investor.activity.viewedFunds.length > 0) {
    const viewedSimilarity = await calculateSimilarityToSet(fund.id, investor.activity.viewedFunds);
    behavioralScore += viewedSimilarity * 15;
    if (viewedSimilarity > 0.7) {
      reasons.push(`Similar to funds you've shown interest in`);
    }
  }

  // Matches search patterns
  if (investor.activity.searchQueries.length > 0) {
    const queryMatch = await matchesSearchPatterns(fund, investor.activity.searchQueries);
    behavioralScore += queryMatch * 10;
    if (queryMatch > 0.5) {
      reasons.push(`Aligns with your recent searches`);
    }
  }

  breakdown.behavioral = behavioralScore;

  // --- SEMANTIC SIMILARITY (20% weight) ---
  if (investor.embedding && fund.embedding) {
    const similarity = cosineSimilarity(investor.embedding, fund.embedding);
    breakdown.semantic = similarity * 20;
    if (similarity > 0.8) {
      reasons.push(`Strong semantic match to your profile`);
    }
  } else {
    breakdown.semantic = 10; // Neutral
  }

  // --- QUALITY SCORE (15% weight) ---
  let qualityScore = 0;
  
  // Track record length
  const trackRecordYears = fund.inception ? 
    (new Date().getTime() - new Date(fund.inception).getTime()) / (365 * 24 * 60 * 60 * 1000) : 0;
  if (trackRecordYears >= 3) qualityScore += 5;
  else if (trackRecordYears >= 1) qualityScore += 3;
  
  // Sharpe ratio
  if (fund.stats?.sharpeRatio && fund.stats.sharpeRatio > 1) qualityScore += 4;
  else if (fund.stats?.sharpeRatio && fund.stats.sharpeRatio > 0.5) qualityScore += 2;
  
  // Has documentation
  const hasDocs = await fundHasDocuments(fund.id);
  if (hasDocs) qualityScore += 3;
  
  // Manager responsiveness (if we track it)
  // qualityScore += managerResponsiveness * 3;
  
  breakdown.quality = qualityScore;

  const totalScore = breakdown.criteria + breakdown.behavioral + breakdown.semantic + breakdown.quality;

  return {
    fund,
    score: totalScore,
    breakdown,
    reasons,
    concerns,
  };
}

// Helper: Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

### Match Presentation

```typescript
// API Response example
{
  "matches": [
    {
      "fund": {
        "id": "clx789...",
        "name": "Meridian Global Macro",
        "type": "HEDGE_FUND",
        "strategy": "global_macro",
        "aum": 780000000,
        "stats": { "return1Y": 0.156, "sharpeRatio": 1.42 }
      },
      "score": 87,
      "breakdown": {
        "criteria": 35,
        "behavioral": 22,
        "semantic": 18,
        "quality": 12
      },
      "reasons": [
        "Matches your interest in global macro strategies",
        "AUM ($780M) within your target range",
        "1Y return (15.6%) exceeds your 12% target",
        "Fee structure within your limits",
        "Similar to Bridgewater All Weather you viewed"
      ],
      "concerns": [
        "Higher volatility than your typical preference"
      ]
    }
  ]
}
```

---

## 7. Due Diligence Assistant

### Overview

AI-powered assistant for analyzing DDQs, fact sheets, and other fund documents. Detects red flags, summarizes key information, and answers investor questions grounded in actual documents.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Due Diligence Assistant                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Document Ingestion                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │    DDQ      │ │ Fact Sheet  │ │  Offering   │ │   Audited   │       │
│  │  (40+ pgs)  │ │  (2-4 pgs)  │ │   Memo      │ │  Financials │       │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
│         │               │               │               │               │
│         └───────────────┴───────────────┴───────────────┘               │
│                                    │                                     │
│                                    ▼                                     │
│                         ┌──────────────────┐                            │
│                         │  Document Parser  │                            │
│                         │  (PDF → Text)     │                            │
│                         └────────┬─────────┘                            │
│                                  │                                       │
│                                  ▼                                       │
│                         ┌──────────────────┐                            │
│                         │   Chunking &     │                            │
│                         │   Embedding      │                            │
│                         │  (512-1024 tok)  │                            │
│                         └────────┬─────────┘                            │
│                                  │                                       │
│                    ┌─────────────┴─────────────┐                        │
│                    ▼                           ▼                         │
│           ┌────────────────┐         ┌────────────────┐                │
│           │  Vector Store   │         │  Structured    │                │
│           │  (semantic)     │         │  Extraction    │                │
│           └────────────────┘         └────────────────┘                │
│                                               │                          │
│                                               ▼                          │
│                                      ┌────────────────┐                 │
│                                      │  Red Flag      │                 │
│                                      │  Detection     │                 │
│                                      └────────────────┘                 │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  Query Interface                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ User: "What's the lockup period and are there any side pockets?"│    │
│  └───────────────────────────────┬────────────────────────────────┘    │
│                                  │                                       │
│                                  ▼                                       │
│                         ┌──────────────────┐                            │
│                         │  RAG Retrieval   │                            │
│                         │  (relevant chunks)│                            │
│                         └────────┬─────────┘                            │
│                                  │                                       │
│                                  ▼                                       │
│                         ┌──────────────────┐                            │
│                         │  LLM Response    │                            │
│                         │  + Citations     │                            │
│                         └────────┬─────────┘                            │
│                                  │                                       │
│                                  ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ AI: "Based on the DDQ (Section 8.2), the fund has a 12-month   │    │
│  │     soft lockup with 90-day notice. Side pockets are permitted │    │
│  │     for illiquid positions per the Offering Memorandum (p.34)."│    │
│  │     [Sources: DDQ p.18, OM p.34]                               │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Document Processing

```typescript
// src/ai/dd/document-processor.ts

import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/ai/embeddings/pipeline';

interface DocumentChunk {
  id: string;
  fundId: string;
  documentId: string;
  documentType: 'DDQ' | 'FACT_SHEET' | 'OFFERING_MEMO' | 'AUDITED_FINANCIALS' | 'OTHER';
  content: string;
  metadata: {
    pageNumber?: number;
    section?: string;
    chunkIndex: number;
  };
  embedding: number[];
}

export async function processDocument(
  fundId: string,
  filePath: string,
  documentType: DocumentChunk['documentType']
): Promise<void> {
  // 1. Load PDF
  const loader = new PDFLoader(filePath, {
    splitPages: true,
  });
  const rawDocs = await loader.load();

  // 2. Chunk the document
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });
  const chunks = await splitter.splitDocuments(rawDocs);

  // 3. Create document record
  const document = await prisma.fundDocument.create({
    data: {
      fundId,
      type: documentType,
      fileName: filePath.split('/').pop(),
      uploadedAt: new Date(),
    }
  });

  // 4. Generate embeddings and store chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk.pageContent);

    await prisma.$executeRaw`
      INSERT INTO "DocumentChunk" (id, "fundId", "documentId", "documentType", content, metadata, embedding)
      VALUES (
        ${generateId()},
        ${fundId},
        ${document.id},
        ${documentType},
        ${chunk.pageContent},
        ${JSON.stringify({
          pageNumber: chunk.metadata.page,
          section: extractSection(chunk.pageContent),
          chunkIndex: i
        })}::jsonb,
        ${embedding}::vector
      )
    `;
  }

  // 5. Run red flag detection
  await detectRedFlags(fundId, document.id);

  console.log(`Processed ${chunks.length} chunks from ${documentType}`);
}

function extractSection(content: string): string | undefined {
  // Try to extract section headers
  const sectionMatch = content.match(/^(?:Section\s+)?(\d+(?:\.\d+)*)[.\s]+([A-Z][^.\n]+)/m);
  if (sectionMatch) {
    return `${sectionMatch[1]} ${sectionMatch[2]}`;
  }
  return undefined;
}
```

### Red Flag Detection

```typescript
// src/ai/dd/red-flags.ts

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI();

interface RedFlag {
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  source: string;
  recommendation: string;
}

const RED_FLAG_CATEGORIES = {
  CONCENTRATION: 'Portfolio Concentration',
  LIQUIDITY_MISMATCH: 'Liquidity Mismatch',
  VALUATION: 'Valuation Concerns',
  CONFLICTS: 'Conflicts of Interest',
  OPERATIONAL: 'Operational Risks',
  REGULATORY: 'Regulatory Issues',
  FEES: 'Fee Structure Concerns',
  TRACK_RECORD: 'Track Record Gaps',
  GOVERNANCE: 'Governance Issues',
  CUSTODY: 'Custody Arrangements',
};

export async function detectRedFlags(fundId: string, documentId: string): Promise<RedFlag[]> {
  // Get all chunks from this document
  const chunks = await prisma.documentChunk.findMany({
    where: { documentId },
    orderBy: { metadata: { path: ['chunkIndex'], sort: 'asc' } }
  });

  const fullText = chunks.map(c => c.content).join('\n\n');

  const prompt = `You are a hedge fund due diligence expert. Analyze this fund document and identify any red flags or concerns that an investor should be aware of.

## Categories to Check
${Object.entries(RED_FLAG_CATEGORIES).map(([key, name]) => `- ${name}`).join('\n')}

## Document Content
${fullText.slice(0, 30000)} // Truncate for token limits

---

Identify ALL potential red flags. For each, provide:
1. Category (from list above)
2. Severity (low/medium/high)
3. Specific description of the concern
4. Quote or reference from document
5. Recommended follow-up question or action

Be thorough but avoid false positives. Flag things a prudent investor would want to investigate further.

Output as JSON array:
[
  {
    "category": "...",
    "severity": "low|medium|high",
    "description": "...",
    "source": "Quote or page reference",
    "recommendation": "..."
  }
]`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = JSON.parse(response.choices[0].message.content || '{"flags":[]}');
  const flags: RedFlag[] = content.flags || content;

  // Store red flags
  for (const flag of flags) {
    await prisma.redFlag.create({
      data: {
        fundId,
        documentId,
        category: flag.category,
        severity: flag.severity,
        description: flag.description,
        source: flag.source,
        recommendation: flag.recommendation,
        status: 'OPEN',
      }
    });
  }

  return flags;
}
```

### DD Query Interface

```typescript
// src/ai/dd/query.ts

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/ai/embeddings/pipeline';

interface DDQueryResult {
  answer: string;
  sources: Array<{
    documentType: string;
    content: string;
    pageNumber?: number;
    section?: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
  relatedQuestions: string[];
}

export async function queryDDDocuments(
  fundId: string,
  question: string
): Promise<DDQueryResult> {
  // 1. Embed the question
  const questionEmbedding = await generateEmbedding(question);

  // 2. Find relevant chunks
  const relevantChunks = await prisma.$queryRaw<any[]>`
    SELECT 
      dc.content,
      dc."documentType",
      dc.metadata,
      1 - (dc.embedding <=> ${questionEmbedding}::vector) as similarity
    FROM "DocumentChunk" dc
    WHERE dc."fundId" = ${fundId}
    ORDER BY dc.embedding <=> ${questionEmbedding}::vector
    LIMIT 10
  `;

  // 3. Build context
  const context = relevantChunks.map((c, i) => 
    `[Source ${i + 1}: ${c.documentType}, Page ${c.metadata.pageNumber || 'N/A'}]\n${c.content}`
  ).join('\n\n---\n\n');

  // 4. Generate answer
  const systemPrompt = `You are a due diligence assistant helping investors analyze fund documents.
Answer questions accurately based ONLY on the provided document excerpts.
Always cite your sources using [Source N] notation.
If the documents don't contain enough information, say so clearly.
Never make up information not in the documents.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `## Question\n${question}\n\n## Document Excerpts\n${context}` }
    ],
    temperature: 0.2,
  });

  const answer = response.choices[0].message.content || '';

  // 5. Determine confidence
  const confidence = determineConfidence(relevantChunks, answer);

  // 6. Generate related questions
  const relatedQuestions = await generateRelatedQuestions(question, answer);

  return {
    answer,
    sources: relevantChunks.map(c => ({
      documentType: c.documentType,
      content: c.content.slice(0, 200) + '...',
      pageNumber: c.metadata.pageNumber,
      section: c.metadata.section,
    })),
    confidence,
    relatedQuestions,
  };
}

function determineConfidence(chunks: any[], answer: string): 'high' | 'medium' | 'low' {
  // High: Multiple relevant chunks with high similarity
  // Medium: Some relevant content found
  // Low: Limited or no direct content
  
  const avgSimilarity = chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length;
  const hasDirectAnswer = !answer.toLowerCase().includes("don't have") && 
                          !answer.toLowerCase().includes("not mentioned");

  if (avgSimilarity > 0.8 && hasDirectAnswer) return 'high';
  if (avgSimilarity > 0.6 && hasDirectAnswer) return 'medium';
  return 'low';
}

async function generateRelatedQuestions(question: string, answer: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Given this Q&A about a fund:\n\nQ: ${question}\nA: ${answer}\n\nSuggest 3 follow-up questions an investor might want to ask. Output as JSON array of strings.`
    }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = JSON.parse(response.choices[0].message.content || '{"questions":[]}');
  return content.questions || [];
}
```

### Common DD Questions

```typescript
// src/ai/dd/templates.ts

export const DD_QUESTION_TEMPLATES = {
  LIQUIDITY: [
    "What are the redemption terms and notice periods?",
    "Are there any gates or side pocket provisions?",
    "What's the lockup period for new investments?",
    "How liquid is the underlying portfolio?",
  ],
  FEES: [
    "What are all the fees and expenses charged to investors?",
    "Is there a high water mark?",
    "Are there any founder's shares or reduced fee arrangements?",
    "How are performance fees calculated?",
  ],
  RISK: [
    "What are the main risk factors?",
    "What's the maximum leverage used?",
    "How is counterparty risk managed?",
    "What hedging strategies are employed?",
  ],
  OPERATIONS: [
    "Who is the administrator and auditor?",
    "What's the NAV calculation frequency?",
    "Who has custody of the assets?",
    "What are the key person provisions?",
  ],
  LEGAL: [
    "Are there any pending legal matters or regulatory issues?",
    "What conflicts of interest exist?",
    "What's the fund structure (onshore/offshore)?",
    "What investor qualifications are required?",
  ],
};
```

---

## 8. RAG Architecture

### Overview

Retrieval-Augmented Generation (RAG) grounds all AI responses in actual fund data, ensuring accuracy and enabling citations.

### Full RAG Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RAG Architecture                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DATA SOURCES                                                                │
│  ═══════════                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Fund DB  │ │Documents │ │ Returns  │ │  News    │ │ Market   │          │
│  │ (Prisma) │ │ (PDFs)   │ │(Monthly) │ │(Articles)│ │(External)│          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │            │            │            │            │                  │
│       └────────────┴────────────┴────────────┴────────────┘                  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        INDEXING LAYER                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │   ┌────────────────┐    ┌────────────────┐    ┌────────────────┐   │   │
│  │   │  Text Chunking  │    │   Embedding    │    │  Metadata      │   │   │
│  │   │  (512-1024 tok) │    │  Generation    │    │  Extraction    │   │   │
│  │   └───────┬────────┘    └───────┬────────┘    └───────┬────────┘   │   │
│  │           │                     │                     │            │   │
│  │           └─────────────────────┴─────────────────────┘            │   │
│  │                                 │                                   │   │
│  │                                 ▼                                   │   │
│  │              ┌───────────────────────────────────┐                 │   │
│  │              │        Vector Database             │                 │   │
│  │              │   (pgvector / Pinecone)           │                 │   │
│  │              │                                    │                 │   │
│  │              │  ┌─────────┐  ┌─────────┐        │                 │   │
│  │              │  │ Funds   │  │Documents│        │                 │   │
│  │              │  │ Index   │  │ Index   │        │                 │   │
│  │              │  └─────────┘  └─────────┘        │                 │   │
│  │              │  ┌─────────┐  ┌─────────┐        │                 │   │
│  │              │  │  News   │  │  FAQ    │        │                 │   │
│  │              │  │  Index  │  │  Index  │        │                 │   │
│  │              │  └─────────┘  └─────────┘        │                 │   │
│  │              └───────────────────────────────────┘                 │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  QUERY PROCESSING                                                            │
│  ════════════════                                                            │
│                                                                              │
│  User Query: "How does Quantum Alpha's drawdown compare to peers?"          │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      RETRIEVAL LAYER                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  1. Query Analysis                                                   │   │
│  │     ┌────────────────────────────────────────────────────────────┐  │   │
│  │     │ • Entity extraction: "Quantum Alpha" (fund)                 │  │   │
│  │     │ • Metric: "drawdown"                                        │  │   │
│  │     │ • Comparison type: "peers"                                  │  │   │
│  │     │ • Intent: COMPARISON                                        │  │   │
│  │     └────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  2. Multi-Source Retrieval                                          │   │
│  │     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │   │
│  │     │ Fund Data      │ │ Strategy Peers │ │ Fund Documents │       │   │
│  │     │ (Quantum Alpha)│ │ (L/S Equity)   │ │ (DDQ, Fact)    │       │   │
│  │     └───────┬────────┘ └───────┬────────┘ └───────┬────────┘       │   │
│  │             │                  │                  │                 │   │
│  │             └──────────────────┴──────────────────┘                 │   │
│  │                               │                                     │   │
│  │  3. Context Assembly          ▼                                     │   │
│  │     ┌────────────────────────────────────────────────────────────┐  │   │
│  │     │ [Fund: Quantum Alpha]                                       │  │   │
│  │     │ Max Drawdown: -7.8% | Peer Avg: -12.3% | Peer Median: -10.1%│  │   │
│  │     │ ────────────────────────────────────                        │  │   │
│  │     │ [From DDQ, Section 5.2: Risk Management]                    │  │   │
│  │     │ "The fund employs systematic stop-losses at 2% per          │  │   │
│  │     │  position and 5% portfolio-level drawdown triggers..."      │  │   │
│  │     │ ────────────────────────────────────                        │  │   │
│  │     │ [Peer Comparison - 47 L/S Equity funds]                     │  │   │
│  │     │ Drawdown percentile: 92nd (lower is better)                 │  │   │
│  │     └────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      GENERATION LAYER                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  System Prompt:                                                      │   │
│  │  "Answer using ONLY the provided context. Cite sources. Be precise."│   │
│  │                                                                      │   │
│  │  Context: [Retrieved content above]                                  │   │
│  │                                                                      │   │
│  │  User: "How does Quantum Alpha's drawdown compare to peers?"        │   │
│  │                                                                      │   │
│  │                         ▼                                            │   │
│  │                    ┌─────────┐                                       │   │
│  │                    │ GPT-4o  │                                       │   │
│  │                    └────┬────┘                                       │   │
│  │                         │                                            │   │
│  │                         ▼                                            │   │
│  │  Response:                                                           │   │
│  │  "Quantum Alpha has maintained exceptional drawdown control,         │   │
│  │   with a maximum drawdown of -7.8% compared to the L/S equity        │   │
│  │   peer average of -12.3%. This ranks in the 92nd percentile          │   │
│  │   (lower drawdown = better).                                         │   │
│  │                                                                      │   │
│  │   According to the fund's DDQ, this is achieved through systematic   │   │
│  │   stop-losses at 2% per position and portfolio-level triggers at 5%. │   │
│  │                                                                      │   │
│  │   [Sources: Fund Stats, DDQ Section 5.2, Peer Analysis (n=47)]"     │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### RAG Implementation

```typescript
// src/ai/rag/pipeline.ts

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/ai/embeddings/pipeline';

const openai = new OpenAI();

interface RAGContext {
  fundData?: {
    fund: Fund;
    stats: FundStats;
    returns: FundReturn[];
  };
  documentChunks?: {
    content: string;
    source: string;
    similarity: number;
  }[];
  peerComparison?: {
    metric: string;
    fundValue: number;
    peerAvg: number;
    peerMedian: number;
    percentile: number;
    count: number;
  };
  marketContext?: {
    benchmarks: Record<string, number>;
    date: string;
  };
  newsArticles?: {
    title: string;
    source: string;
    date: string;
    snippet: string;
  }[];
}

interface RAGQuery {
  query: string;
  fundId?: string;
  includeDocuments?: boolean;
  includePeers?: boolean;
  includeNews?: boolean;
  conversationHistory?: Message[];
}

interface RAGResponse {
  answer: string;
  sources: {
    type: 'fund_data' | 'document' | 'peer_analysis' | 'market' | 'news';
    reference: string;
  }[];
  context: RAGContext;
}

export async function ragQuery(req: RAGQuery): Promise<RAGResponse> {
  const context: RAGContext = {};
  const sources: RAGResponse['sources'] = [];

  // 1. Analyze query to determine what to retrieve
  const queryAnalysis = await analyzeQuery(req.query);

  // 2. Retrieve from appropriate sources
  if (req.fundId) {
    // Fund data
    context.fundData = await getFundData(req.fundId);
    sources.push({ type: 'fund_data', reference: context.fundData.fund.name });

    // Documents (if relevant to query)
    if (req.includeDocuments && queryAnalysis.needsDocuments) {
      context.documentChunks = await retrieveRelevantChunks(req.fundId, req.query);
      context.documentChunks.forEach(chunk => {
        sources.push({ type: 'document', reference: chunk.source });
      });
    }

    // Peer comparison (if relevant)
    if (req.includePeers && queryAnalysis.needsPeerComparison) {
      const metric = queryAnalysis.comparisonMetric || 'return1Y';
      context.peerComparison = await getPeerComparison(
        req.fundId,
        context.fundData.fund.strategy!,
        metric
      );
      sources.push({ type: 'peer_analysis', reference: `${context.peerComparison.count} peers` });
    }
  }

  // Market context (if relevant)
  if (queryAnalysis.needsMarketContext) {
    context.marketContext = await getMarketContext();
    sources.push({ type: 'market', reference: 'Market benchmarks' });
  }

  // News (if relevant)
  if (req.includeNews && queryAnalysis.needsNews && req.fundId) {
    context.newsArticles = await getRelevantNews(context.fundData?.fund.name || '', req.query);
    if (context.newsArticles.length > 0) {
      sources.push({ type: 'news', reference: `${context.newsArticles.length} articles` });
    }
  }

  // 3. Build prompt with context
  const systemPrompt = buildRAGSystemPrompt();
  const userPrompt = buildRAGUserPrompt(req.query, context);

  // 4. Generate response
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...(req.conversationHistory || []),
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3, // Lower for factual accuracy
  });

  return {
    answer: response.choices[0].message.content || '',
    sources,
    context,
  };
}

async function analyzeQuery(query: string): Promise<{
  needsDocuments: boolean;
  needsPeerComparison: boolean;
  needsMarketContext: boolean;
  needsNews: boolean;
  comparisonMetric?: string;
}> {
  // Use LLM for complex analysis or rules for simple cases
  const lowerQuery = query.toLowerCase();

  return {
    needsDocuments: /terms|fees|lockup|redemption|structure|risk|ddq|document/.test(lowerQuery),
    needsPeerComparison: /peer|compare|vs|versus|relative|rank|percentile/.test(lowerQuery),
    needsMarketContext: /market|benchmark|s&p|nasdaq|index|context/.test(lowerQuery),
    needsNews: /news|recent|latest|announcement|article/.test(lowerQuery),
    comparisonMetric: extractMetric(lowerQuery),
  };
}

function extractMetric(query: string): string | undefined {
  if (/return|performance/.test(query)) return 'return1Y';
  if (/sharpe/.test(query)) return 'sharpeRatio';
  if (/sortino/.test(query)) return 'sortinoRatio';
  if (/drawdown/.test(query)) return 'maxDrawdown';
  if (/volatility/.test(query)) return 'volatility';
  if (/aum|size/.test(query)) return 'aum';
  return undefined;
}

async function retrieveRelevantChunks(
  fundId: string,
  query: string
): Promise<RAGContext['documentChunks']> {
  const queryEmbedding = await generateEmbedding(query);

  const chunks = await prisma.$queryRaw<any[]>`
    SELECT 
      dc.content,
      dc."documentType" || ' (Page ' || COALESCE(dc.metadata->>'pageNumber', 'N/A') || ')' as source,
      1 - (dc.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM "DocumentChunk" dc
    WHERE dc."fundId" = ${fundId}
    ORDER BY dc.embedding <=> ${queryEmbedding}::vector
    LIMIT 5
  `;

  return chunks.filter(c => c.similarity > 0.5); // Only include relevant chunks
}

async function getPeerComparison(
  fundId: string,
  strategy: string,
  metric: string
): Promise<RAGContext['peerComparison']> {
  // Get all funds in same strategy
  const peers = await prisma.fund.findMany({
    where: {
      strategy,
      status: 'APPROVED',
      id: { not: fundId },
    },
    include: { stats: true },
  });

  const fund = await prisma.fund.findUnique({
    where: { id: fundId },
    include: { stats: true },
  });

  if (!fund?.stats || peers.length === 0) {
    return {
      metric,
      fundValue: 0,
      peerAvg: 0,
      peerMedian: 0,
      percentile: 50,
      count: 0,
    };
  }

  const fundValue = (fund.stats as any)[metric] || 0;
  const peerValues = peers
    .map(p => (p.stats as any)?.[metric])
    .filter((v): v is number => v !== undefined && v !== null)
    .sort((a, b) => a - b);

  const peerAvg = peerValues.reduce((a, b) => a + b, 0) / peerValues.length;
  const peerMedian = peerValues[Math.floor(peerValues.length / 2)];

  // Calculate percentile (where fund ranks)
  const belowCount = peerValues.filter(v => v < fundValue).length;
  const percentile = Math.round((belowCount / peerValues.length) * 100);

  return {
    metric,
    fundValue,
    peerAvg,
    peerMedian,
    percentile,
    count: peerValues.length,
  };
}

function buildRAGSystemPrompt(): string {
  return `You are a hedge fund research assistant for HedgeCo.Net.

## Guidelines
1. Answer questions using ONLY the provided context
2. Always cite sources (e.g., "According to the DDQ...", "Fund data shows...")
3. Be precise with numbers - don't round excessively
4. If information is not in the context, say "This information is not available in the current documents"
5. Never make up fund data or statistics
6. Provide balanced analysis - mention both positives and concerns
7. Use professional financial terminology appropriate for accredited investors

## Citation Format
- Fund data: "Fund statistics show..."
- Documents: "[DDQ Section X]", "[Fact Sheet]"
- Peer analysis: "Compared to [N] peers..."
- Market context: "Relative to the S&P 500..."
- News: "According to [Source]..."`;
}

function buildRAGUserPrompt(query: string, context: RAGContext): string {
  let prompt = `## Question\n${query}\n\n## Context\n`;

  if (context.fundData) {
    const { fund, stats } = context.fundData;
    prompt += `### Fund: ${fund.name}\n`;
    prompt += `Type: ${fund.type} | Strategy: ${fund.strategy}\n`;
    prompt += `AUM: ${formatCurrency(fund.aum)} | Inception: ${formatDate(fund.inception)}\n`;
    if (stats) {
      prompt += `\n**Performance Metrics:**\n`;
      prompt += `- YTD Return: ${formatPercent(stats.ytdReturn)}\n`;
      prompt += `- 1Y Return: ${formatPercent(stats.return1Y)}\n`;
      prompt += `- Sharpe Ratio: ${stats.sharpeRatio?.toFixed(2)}\n`;
      prompt += `- Max Drawdown: ${formatPercent(stats.maxDrawdown)}\n`;
      prompt += `- Volatility: ${formatPercent(stats.volatility)}\n`;
    }
    prompt += '\n';
  }

  if (context.documentChunks?.length) {
    prompt += `### Document Excerpts\n`;
    context.documentChunks.forEach((chunk, i) => {
      prompt += `[Source ${i + 1}: ${chunk.source}]\n${chunk.content}\n\n`;
    });
  }

  if (context.peerComparison) {
    const pc = context.peerComparison;
    prompt += `### Peer Comparison (${pc.count} ${context.fundData?.fund.strategy} funds)\n`;
    prompt += `${pc.metric}: Fund ${formatMetric(pc.fundValue, pc.metric)} vs `;
    prompt += `Peer Avg ${formatMetric(pc.peerAvg, pc.metric)} vs `;
    prompt += `Peer Median ${formatMetric(pc.peerMedian, pc.metric)}\n`;
    prompt += `Fund Percentile: ${pc.percentile}th\n\n`;
  }

  if (context.marketContext) {
    prompt += `### Market Context (as of ${context.marketContext.date})\n`;
    for (const [name, value] of Object.entries(context.