# HedgeCo.Net — Embedding Pipeline Specification

> **Author:** Velma 🤓 (AI & Data Engineer)  
> **Version:** 1.0  
> **Sprint:** 1 (Research & Design)  
> **Last Updated:** 2026-02-16

---

## Executive Summary

*"Jinkies! The embeddings show a 0.92 similarity score!"*

This document specifies the vector embedding pipeline for HedgeCo.Net v2, enabling semantic search and AI-powered fund discovery. We'll use **pgvector** (PostgreSQL extension) for vector storage, **OpenAI's text-embedding-3 models** for generation, and a **hybrid search approach** combining structured filters with semantic similarity.

**Key Decisions:**
- **Storage:** pgvector in PostgreSQL (single database, no external vector DB)
- **Models:** text-embedding-3-large (3072d) for funds/docs, text-embedding-3-small (1536d) for high-volume user data
- **Index:** HNSW for exact search (<100K vectors), IVFFlat for scale
- **Refresh:** Event-driven + nightly batch reconciliation

---

## Table of Contents

1. [What Data to Embed](#1-what-data-to-embed)
2. [Embedding Model Selection](#2-embedding-model-selection)
3. [pgvector Setup & Storage](#3-pgvector-setup--storage)
4. [Query Approach for Semantic Search](#4-query-approach-for-semantic-search)
5. [Batch Update Strategy](#5-batch-update-strategy)
6. [Cost Estimation](#6-cost-estimation)
7. [Implementation Checklist](#7-implementation-checklist)

---

## 1. What Data to Embed

### 1.1 Fund Embeddings (Primary)

Each fund gets a **single composite embedding** generated from structured and unstructured data. This enables "find funds like X" and natural language search.

#### Embedding Text Template

```typescript
function buildFundEmbeddingText(fund: Fund): string {
  const lines = [
    // Identity
    `Fund Name: ${fund.name}`,
    `Fund Type: ${formatFundType(fund.type)}`,
    
    // Strategy (critical for semantic matching)
    `Investment Strategy: ${fund.strategy?.replace(/_/g, ' ')}`,
    fund.subStrategy && `Sub-Strategy: ${fund.subStrategy}`,
    
    // Description (rich semantic content)
    fund.description && `Description: ${fund.description}`,
    
    // Quantitative context (converted to natural language)
    fund.aum && `Assets Under Management: ${formatCurrency(fund.aum)}`,
    fund.stats?.return1Y && `One-Year Return: ${formatPercent(fund.stats.return1Y)}`,
    fund.stats?.return3YAnnualized && `Three-Year Annualized Return: ${formatPercent(fund.stats.return3YAnnualized)}`,
    fund.stats?.sharpeRatio && `Sharpe Ratio: ${fund.stats.sharpeRatio.toFixed(2)}`,
    fund.stats?.maxDrawdown && `Maximum Drawdown: ${formatPercent(fund.stats.maxDrawdown)}`,
    fund.stats?.volatility && `Annualized Volatility: ${formatPercent(fund.stats.volatility)}`,
    
    // Geographic focus
    fund.country && `Domicile: ${fund.country}`,
    fund.geographicFocus && `Geographic Focus: ${fund.geographicFocus}`,
    
    // Terms (for matching investor constraints)
    fund.minInvestment && `Minimum Investment: ${formatCurrency(fund.minInvestment)}`,
    fund.managementFee && `Management Fee: ${formatPercent(fund.managementFee)}`,
    fund.performanceFee && `Performance Fee: ${formatPercent(fund.performanceFee)}`,
    fund.lockup && `Lockup Period: ${fund.lockup}`,
    fund.redemption && `Redemption Terms: ${fund.redemption}`,
    
    // Risk characteristics
    fund.stats?.beta && `Beta to S&P 500: ${fund.stats.beta.toFixed(2)}`,
    fund.stats?.correlation && `Correlation to S&P 500: ${fund.stats.correlation.toFixed(2)}`,
  ];

  return lines.filter(Boolean).join('\n');
}
```

#### Example Output

```
Fund Name: Quantum Alpha Long/Short
Fund Type: Hedge Fund
Investment Strategy: Long Short Equity
Sub-Strategy: Technology Focus
Description: Fundamental long/short equity strategy focused on mid-cap US technology companies. 
The fund seeks to generate alpha through deep fundamental research, identifying undervalued 
companies with improving fundamentals for long positions while shorting overvalued names 
with deteriorating metrics.
Assets Under Management: $450,000,000
One-Year Return: 18.2%
Three-Year Annualized Return: 14.8%
Sharpe Ratio: 1.65
Maximum Drawdown: -7.8%
Annualized Volatility: 12.3%
Domicile: United States
Geographic Focus: North America
Minimum Investment: $500,000
Management Fee: 1.5%
Performance Fee: 20%
Lockup Period: 12 months soft lock
Redemption Terms: Quarterly with 45-day notice
Beta to S&P 500: 0.42
```

### 1.2 Service Provider Embeddings

```typescript
function buildServiceProviderEmbeddingText(provider: ServiceProvider): string {
  return [
    `Company: ${provider.companyName}`,
    `Service Category: ${provider.category}`,
    provider.subcategory && `Specialization: ${provider.subcategory}`,
    provider.description && `Description: ${provider.description}`,
    provider.country && `Location: ${provider.city}, ${provider.state}, ${provider.country}`,
    // Services offered, client types, etc.
  ].filter(Boolean).join('\n');
}
```

### 1.3 User Profile Embeddings (Investor Preferences)

For personalized recommendations, we embed investor preference profiles:

```typescript
function buildUserPreferenceEmbeddingText(profile: UserProfile): string {
  const prefs = profile.preferences;
  return [
    prefs.fundTypes?.length && `Interested in: ${prefs.fundTypes.join(', ')}`,
    prefs.strategies?.length && `Preferred strategies: ${prefs.strategies.join(', ')}`,
    prefs.riskTolerance && `Risk tolerance: ${prefs.riskTolerance}`,
    prefs.returnTarget && `Target return: ${formatPercent(prefs.returnTarget)}+`,
    prefs.aumRange && `AUM preference: ${formatCurrency(prefs.aumRange.min)} - ${formatCurrency(prefs.aumRange.max)}`,
    prefs.geographicFocus && `Geographic interest: ${prefs.geographicFocus}`,
    // Inferred from behavior
    profile.topViewedStrategies && `Frequently views: ${profile.topViewedStrategies.join(', ')}`,
  ].filter(Boolean).join('\n');
}
```

### 1.4 Document Embeddings (DDQ, Fact Sheets)

Documents are **chunked** before embedding (512-1024 tokens per chunk):

| Document Type | Chunking Strategy | Embedding Model |
|--------------|-------------------|-----------------|
| DDQ (40+ pages) | 1000 chars, 200 overlap | text-embedding-3-large |
| Fact Sheet (2-4 pages) | 800 chars, 150 overlap | text-embedding-3-large |
| Offering Memo | 1000 chars, 200 overlap | text-embedding-3-large |
| News Articles | Full article (if <8K tokens) | text-embedding-3-small |

### 1.5 Data NOT to Embed

❌ **Don't embed separately:**
- Monthly return numbers (already captured in fund text)
- Raw timestamps/dates (not semantic)
- User activity logs (use for collaborative filtering, not embeddings)
- Passwords, tokens, PII

---

## 2. Embedding Model Selection

### 2.1 Model Comparison

| Model | Dimensions | Max Tokens | Cost per 1M tokens | Use Case |
|-------|------------|------------|-------------------|----------|
| **text-embedding-3-large** | 3072 | 8191 | $0.13 | Funds, Documents, Providers |
| **text-embedding-3-small** | 1536 | 8191 | $0.02 | User profiles, High-volume |
| text-embedding-ada-002 | 1536 | 8191 | $0.10 | Legacy (don't use) |

### 2.2 Recommendations

| Entity | Model | Rationale |
|--------|-------|-----------|
| **Funds** | text-embedding-3-large | Quality critical for search accuracy; ~10K funds = low volume |
| **Service Providers** | text-embedding-3-large | Quality matters; ~5K providers = low volume |
| **User Profiles** | text-embedding-3-small | Higher volume; preference matching less nuanced |
| **Document Chunks** | text-embedding-3-large | DDQ analysis needs high fidelity |
| **Search Queries** | text-embedding-3-large | Must match fund embedding space |

### 2.3 Dimension Reduction (Optional Optimization)

OpenAI's text-embedding-3 models support **native dimension reduction** via the `dimensions` parameter:

```typescript
// Reduce 3072 → 1536 for storage savings (slight quality tradeoff)
const response = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: text,
  dimensions: 1536  // Truncate to 1536 (Matryoshka representation)
});
```

**Recommendation:** Start with full 3072 dimensions. Optimize later if storage/performance requires it.

---

## 3. pgvector Setup & Storage

### 3.1 Why pgvector (Not Pinecone/Weaviate)?

| Factor | pgvector | Dedicated Vector DB |
|--------|----------|---------------------|
| **Simplicity** | ✅ Same database | ❌ Additional service |
| **Transactions** | ✅ ACID with fund data | ❌ Eventual consistency |
| **Cost** | ✅ No extra service | ❌ $70-700/mo |
| **Hybrid Queries** | ✅ JOIN with filters | ⚠️ Requires sync |
| **Scale** | ⚠️ <10M vectors | ✅ Billions |

**Decision:** Use pgvector. HedgeCo scale (~50K total vectors) is well within pgvector's sweet spot.

### 3.2 Installation & Setup

```sql
-- Enable pgvector extension (Supabase/Neon have this pre-installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 3.3 Schema Design

```sql
-- Fund table with embedding column
ALTER TABLE "Fund" ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- Service Provider embedding
ALTER TABLE "ServiceProvider" ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- User profile embedding (smaller dimension)
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS preference_embedding vector(1536);

-- Document chunks table (for DDQ/RAG)
CREATE TABLE IF NOT EXISTS "DocumentChunk" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  fund_id TEXT REFERENCES "Fund"(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  document_type TEXT NOT NULL,  -- 'DDQ', 'FACT_SHEET', 'OFFERING_MEMO'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',  -- page_number, section, chunk_index
  embedding vector(3072),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.4 Index Selection

pgvector supports two index types:

| Index Type | Build Time | Query Time | Recall | Best For |
|------------|------------|------------|--------|----------|
| **HNSW** | Slow | Fast | ~99% | <100K vectors, accuracy priority |
| **IVFFlat** | Fast | Medium | ~95% | >100K vectors, build speed priority |

**Recommendation:** Use HNSW for funds/providers, IVFFlat for document chunks.

```sql
-- HNSW index for funds (high accuracy)
CREATE INDEX IF NOT EXISTS fund_embedding_hnsw_idx 
ON "Fund" USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- HNSW for service providers
CREATE INDEX IF NOT EXISTS provider_embedding_hnsw_idx 
ON "ServiceProvider" USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- IVFFlat for document chunks (larger volume)
CREATE INDEX IF NOT EXISTS doc_chunk_embedding_idx 
ON "DocumentChunk" USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Composite index for filtered searches
CREATE INDEX IF NOT EXISTS fund_type_embedding_idx 
ON "Fund" (type) 
WHERE embedding IS NOT NULL;
```

### 3.5 Prisma Schema Update

```prisma
model Fund {
  id              String    @id @default(cuid())
  // ... existing fields ...
  
  // Vector embedding (3072 dimensions)
  embedding       Unsupported("vector(3072)")?
  embeddingUpdatedAt DateTime?
  
  @@index([type, status])
}

model DocumentChunk {
  id            String   @id @default(cuid())
  fundId        String
  fund          Fund     @relation(fields: [fundId], references: [id], onDelete: Cascade)
  documentId    String
  documentType  String
  content       String
  metadata      Json     @default("{}")
  embedding     Unsupported("vector(3072)")?
  createdAt     DateTime @default(now())
  
  @@index([fundId])
  @@index([documentType])
}
```

> **Note:** Prisma doesn't natively support pgvector, so we use `Unsupported()` and raw queries for vector operations.

---

## 4. Query Approach for Semantic Search

### 4.1 Hybrid Search Architecture

```
User Query: "find crypto funds beating Bitcoin"
                    │
                    ▼
        ┌───────────────────────┐
        │   Query Processing    │
        │  (GPT-4o Function     │
        │   Calling)            │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐      ┌───────────────┐
│ Structured    │      │   Semantic    │
│ SQL Query     │      │ Vector Search │
│ (filters)     │      │ (similarity)  │
└───────┬───────┘      └───────┬───────┘
        │                       │
        │   fund_type='CRYPTO'  │   query_embedding <=> fund_embedding
        │   return_1y > btc_ret │   ORDER BY distance
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Reciprocal Rank      │
        │  Fusion (RRF)         │
        │  Merge & Re-rank      │
        └───────────┬───────────┘
                    │
                    ▼
              Final Results
```

### 4.2 Vector Similarity Search Function

```sql
-- Search similar funds with optional filters
CREATE OR REPLACE FUNCTION search_similar_funds(
  query_embedding vector(3072),
  fund_type_filter TEXT DEFAULT NULL,
  strategy_filter TEXT DEFAULT NULL,
  min_aum DECIMAL DEFAULT NULL,
  max_aum DECIMAL DEFAULT NULL,
  match_count INT DEFAULT 20,
  similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  type TEXT,
  strategy TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.type::TEXT,
    f.strategy,
    (1 - (f.embedding <=> query_embedding))::FLOAT as similarity
  FROM "Fund" f
  WHERE 
    f.status = 'APPROVED'
    AND f.visible = true
    AND f.embedding IS NOT NULL
    AND (fund_type_filter IS NULL OR f.type::TEXT = fund_type_filter)
    AND (strategy_filter IS NULL OR f.strategy ILIKE '%' || strategy_filter || '%')
    AND (min_aum IS NULL OR f.aum >= min_aum)
    AND (max_aum IS NULL OR f.aum <= max_aum)
    AND (1 - (f.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

### 4.3 TypeScript Implementation

```typescript
// src/ai/embeddings/search.ts

import { prisma } from '@/lib/prisma';
import { generateEmbedding } from './pipeline';

interface VectorSearchOptions {
  fundType?: string;
  strategy?: string;
  minAum?: number;
  maxAum?: number;
  limit?: number;
  threshold?: number;
  excludeIds?: string[];
}

interface VectorSearchResult {
  id: string;
  name: string;
  type: string;
  strategy: string;
  similarity: number;
}

export async function vectorSearchFunds(
  query: string,
  options: VectorSearchOptions = {}
): Promise<VectorSearchResult[]> {
  const {
    fundType = null,
    strategy = null,
    minAum = null,
    maxAum = null,
    limit = 20,
    threshold = 0.5,
    excludeIds = []
  } = options;

  // Generate embedding for search query
  const queryEmbedding = await generateEmbedding(query);

  // Execute vector search with filters
  const results = await prisma.$queryRaw<VectorSearchResult[]>`
    SELECT 
      f.id,
      f.name,
      f.type::TEXT as type,
      f.strategy,
      (1 - (f.embedding <=> ${queryEmbedding}::vector))::FLOAT as similarity
    FROM "Fund" f
    WHERE 
      f.status = 'APPROVED'
      AND f.visible = true
      AND f.embedding IS NOT NULL
      AND (${fundType}::TEXT IS NULL OR f.type::TEXT = ${fundType})
      AND (${strategy}::TEXT IS NULL OR f.strategy ILIKE '%' || ${strategy} || '%')
      AND (${minAum}::DECIMAL IS NULL OR f.aum >= ${minAum})
      AND (${maxAum}::DECIMAL IS NULL OR f.aum <= ${maxAum})
      AND (1 - (f.embedding <=> ${queryEmbedding}::vector)) >= ${threshold}
      ${excludeIds.length > 0 ? prisma.$queryRaw`AND f.id NOT IN (${prisma.Prisma.join(excludeIds)})` : prisma.$queryRaw``}
    ORDER BY f.embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `;

  return results;
}

// Find similar funds to a given fund
export async function findSimilarFunds(
  fundId: string,
  limit: number = 10
): Promise<VectorSearchResult[]> {
  const results = await prisma.$queryRaw<VectorSearchResult[]>`
    SELECT 
      f.id,
      f.name,
      f.type::TEXT as type,
      f.strategy,
      (1 - (f.embedding <=> source.embedding))::FLOAT as similarity
    FROM "Fund" f
    CROSS JOIN (SELECT embedding FROM "Fund" WHERE id = ${fundId}) source
    WHERE 
      f.id != ${fundId}
      AND f.status = 'APPROVED'
      AND f.visible = true
      AND f.embedding IS NOT NULL
    ORDER BY f.embedding <=> source.embedding
    LIMIT ${limit}
  `;

  return results;
}
```

### 4.4 Reciprocal Rank Fusion (RRF)

Merge structured and semantic results:

```typescript
// src/ai/search/ranking.ts

interface RankedResult {
  id: string;
  fund: Fund;
}

interface ResultSet {
  results: RankedResult[];
  weight: number;
}

const RRF_K = 60; // Standard constant

export function reciprocalRankFusion(resultSets: ResultSet[]): Fund[] {
  const scores = new Map<string, { score: number; fund: Fund }>();

  for (const { results, weight } of resultSets) {
    results.forEach((result, rank) => {
      const rrfScore = weight * (1 / (RRF_K + rank + 1));
      
      if (scores.has(result.id)) {
        scores.get(result.id)!.score += rrfScore;
      } else {
        scores.set(result.id, { score: rrfScore, fund: result.fund });
      }
    });
  }

  // Sort by combined score
  const merged = Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(s => s.fund);

  return merged;
}

// Usage in search orchestrator:
const merged = reciprocalRankFusion([
  { results: structuredResults, weight: 0.6 },  // SQL query results
  { results: semanticResults, weight: 0.4 },    // Vector search results
]);
```

### 4.5 Distance Metrics

pgvector supports three distance operators:

| Operator | Metric | Use Case |
|----------|--------|----------|
| `<=>` | Cosine distance | **Default** - works well for normalized text embeddings |
| `<->` | L2 (Euclidean) | Image embeddings, geographic data |
| `<#>` | Inner product | Pre-normalized vectors, max similarity |

**Recommendation:** Use cosine distance (`<=>`) for all text embeddings.

---

## 5. Batch Update Strategy

### 5.1 Embedding Refresh Triggers

| Trigger | Action | Priority | Latency Target |
|---------|--------|----------|----------------|
| Fund created | Generate embedding | High | <5 seconds |
| Fund description updated | Regenerate embedding | High | <5 seconds |
| Monthly returns added | Regenerate embedding | Medium | <1 minute |
| Fund stats recalculated | Regenerate embedding | Medium | <1 minute |
| User preferences changed | Regenerate user embedding | Low | <5 minutes |
| Document uploaded | Chunk & embed document | Medium | <2 minutes |
| Nightly batch | Full reconciliation | Low | Overnight |

### 5.2 Event-Driven Pipeline

```typescript
// src/jobs/embedding-jobs.ts

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { updateFundEmbedding, updateUserEmbedding, processDocument } from '@/ai/embeddings/pipeline';

const redis = new Redis(process.env.REDIS_URL!);
const embeddingQueue = new Queue('embeddings', { connection: redis });

// Job types
interface EmbeddingJob {
  type: 'fund' | 'user' | 'provider' | 'document';
  entityId: string;
  priority?: number;
  reason?: string;
}

// Enqueue embedding job (with deduplication)
export async function queueEmbeddingRefresh(job: EmbeddingJob) {
  const jobId = `${job.type}:${job.entityId}`;
  
  await embeddingQueue.add(job.type, job, {
    jobId,  // Deduplication key
    priority: job.priority || 5,
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
}

// Worker
const worker = new Worker('embeddings', async (job: Job<EmbeddingJob>) => {
  console.log(`Processing embedding job: ${job.data.type}:${job.data.entityId}`);
  
  switch (job.data.type) {
    case 'fund':
      await updateFundEmbedding(job.data.entityId);
      break;
    case 'user':
      await updateUserEmbedding(job.data.entityId);
      break;
    case 'provider':
      await updateProviderEmbedding(job.data.entityId);
      break;
    case 'document':
      await processDocument(job.data.entityId);
      break;
  }
}, { 
  connection: redis,
  concurrency: 5,  // Process 5 jobs in parallel
  limiter: {
    max: 100,  // Max 100 jobs per minute (API rate limiting)
    duration: 60000,
  },
});

// Prisma middleware to auto-queue on changes
prisma.$use(async (params, next) => {
  const result = await next(params);
  
  if (params.model === 'Fund' && ['create', 'update'].includes(params.action)) {
    const fundId = result.id;
    const changedFields = params.args.data ? Object.keys(params.args.data) : [];
    
    // Only re-embed if relevant fields changed
    const embeddingFields = ['name', 'description', 'strategy', 'subStrategy', 'type'];
    if (changedFields.some(f => embeddingFields.includes(f)) || params.action === 'create') {
      await queueEmbeddingRefresh({
        type: 'fund',
        entityId: fundId,
        priority: 3,
        reason: params.action,
      });
    }
  }
  
  return result;
});
```

### 5.3 Batch Generation for Initial Load

```typescript
// src/scripts/generate-all-embeddings.ts

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { chunk } from 'lodash';

const openai = new OpenAI();

async function generateAllFundEmbeddings() {
  // Get all funds needing embeddings
  const funds = await prisma.fund.findMany({
    where: {
      status: 'APPROVED',
      OR: [
        { embedding: null },
        { embeddingUpdatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Stale >7 days
      ],
    },
    include: { stats: true },
  });

  console.log(`Generating embeddings for ${funds.length} funds...`);

  // Batch process (OpenAI allows up to 2048 inputs per request, we use 100 for safety)
  const batches = chunk(funds, 100);
  let processed = 0;

  for (const batch of batches) {
    const texts = batch.map(buildFundEmbeddingText);
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: texts,
    });

    // Update database in transaction
    await prisma.$transaction(
      batch.map((fund, i) =>
        prisma.$executeRaw`
          UPDATE "Fund" 
          SET 
            embedding = ${response.data[i].embedding}::vector,
            "embeddingUpdatedAt" = NOW()
          WHERE id = ${fund.id}
        `
      )
    );

    processed += batch.length;
    console.log(`Progress: ${processed}/${funds.length} (${((processed/funds.length)*100).toFixed(1)}%)`);

    // Rate limiting: 3000 RPM for embeddings API
    await new Promise(resolve => setTimeout(resolve, 2100)); // ~28 requests/minute with batch of 100
  }

  console.log('✅ All fund embeddings generated!');
}

// Run nightly via cron
// 0 3 * * * node dist/scripts/generate-all-embeddings.js
```

### 5.4 Nightly Reconciliation Job

```typescript
// src/jobs/nightly-embedding-reconciliation.ts

import { CronJob } from 'cron';

const nightlyReconciliation = new CronJob('0 3 * * *', async () => {
  console.log('Starting nightly embedding reconciliation...');
  
  // 1. Find funds with stale embeddings (stats changed but embedding didn't)
  const staleFunds = await prisma.$queryRaw<{id: string}[]>`
    SELECT f.id 
    FROM "Fund" f
    JOIN "FundStats" s ON f.id = s."fundId"
    WHERE f.embedding IS NOT NULL
    AND s."updatedAt" > f."embeddingUpdatedAt"
  `;
  
  console.log(`Found ${staleFunds.length} funds with stale embeddings`);
  
  for (const fund of staleFunds) {
    await queueEmbeddingRefresh({
      type: 'fund',
      entityId: fund.id,
      priority: 10,  // Low priority
      reason: 'nightly_reconciliation',
    });
  }
  
  // 2. Find funds missing embeddings
  const missingEmbeddings = await prisma.fund.findMany({
    where: { 
      status: 'APPROVED',
      visible: true,
      embedding: null,
    },
    select: { id: true },
  });
  
  console.log(`Found ${missingEmbeddings.length} funds missing embeddings`);
  
  for (const fund of missingEmbeddings) {
    await queueEmbeddingRefresh({
      type: 'fund',
      entityId: fund.id,
      priority: 5,
      reason: 'missing_embedding',
    });
  }
  
  console.log('Nightly reconciliation queued');
});

nightlyReconciliation.start();
```

---

## 6. Cost Estimation

### 6.1 Initial Load Costs

| Entity | Count | Avg Tokens | Model | Cost |
|--------|-------|------------|-------|------|
| Funds | 10,000 | 500 | text-embedding-3-large | $0.65 |
| Service Providers | 5,000 | 300 | text-embedding-3-large | $0.20 |
| User Profiles | 50,000 | 200 | text-embedding-3-small | $0.20 |
| Document Chunks | 100,000 | 600 | text-embedding-3-large | $7.80 |
| **Total Initial** | | | | **~$9** |

### 6.2 Ongoing Monthly Costs

| Activity | Volume/Month | Tokens | Model | Monthly Cost |
|----------|--------------|--------|-------|--------------|
| New funds | 200 | 500 | large | $0.01 |
| Fund updates | 2,000 | 500 | large | $0.13 |
| Search queries | 100,000 | 50 | large | $0.65 |
| User profile updates | 10,000 | 200 | small | $0.04 |
| Document uploads | 500 | 30,000 | large | $1.95 |
| **Total Monthly** | | | | **~$3** |

**Verdict:** Embedding costs are negligible (~$3/month). The LLM calls for search/chat will be the primary AI cost.

### 6.3 Storage Costs

| Entity | Count | Dimensions | Bytes/Vector | Total Storage |
|--------|-------|------------|--------------|---------------|
| Funds | 10,000 | 3072 | 12,288 | 123 MB |
| Providers | 5,000 | 3072 | 12,288 | 61 MB |
| User Profiles | 50,000 | 1536 | 6,144 | 307 MB |
| Doc Chunks | 100,000 | 3072 | 12,288 | 1.2 GB |
| **Total** | | | | **~1.7 GB** |

Easily handled by PostgreSQL; no special storage considerations needed.

---

## 7. Implementation Checklist

### Sprint 2: Foundation

- [ ] **Database Setup**
  - [ ] Enable pgvector extension in Supabase/Neon
  - [ ] Add embedding columns to Fund, ServiceProvider, Profile tables
  - [ ] Create DocumentChunk table
  - [ ] Create HNSW indexes for Fund and ServiceProvider
  - [ ] Create IVFFlat index for DocumentChunk

- [ ] **Embedding Generation**
  - [ ] Implement `buildFundEmbeddingText()` function
  - [ ] Implement `generateEmbedding()` wrapper for OpenAI API
  - [ ] Implement `generateEmbeddingsBatch()` for bulk operations
  - [ ] Create initial migration script for existing funds

- [ ] **Job Queue**
  - [ ] Set up BullMQ with Redis
  - [ ] Implement embedding job worker
  - [ ] Add Prisma middleware for auto-queuing
  - [ ] Create nightly reconciliation cron job

### Sprint 3: Search Integration

- [ ] **Vector Search**
  - [ ] Implement `vectorSearchFunds()` function
  - [ ] Implement `findSimilarFunds()` function
  - [ ] Create SQL function for filtered vector search
  - [ ] Integrate with existing search API

- [ ] **Hybrid Search**
  - [ ] Implement Reciprocal Rank Fusion
  - [ ] Connect structured search with vector search
  - [ ] Add similarity scores to search results
  - [ ] Test search quality with sample queries

### Sprint 4: Advanced Features

- [ ] **Document Processing**
  - [ ] Implement PDF chunking pipeline
  - [ ] Create document upload handler
  - [ ] Build DDQ Q&A retrieval function

- [ ] **Recommendations**
  - [ ] Implement user preference embeddings
  - [ ] Build "similar funds" feature
  - [ ] Create personalized recommendation API

---

## Appendix A: SQL Reference

```sql
-- Check if pgvector is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check index status
SELECT 
  indexrelname as index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as scans
FROM pg_stat_user_indexes 
WHERE indexrelname LIKE '%embedding%';

-- Verify embeddings exist
SELECT 
  COUNT(*) as total,
  COUNT(embedding) as with_embedding,
  COUNT(*) - COUNT(embedding) as missing_embedding
FROM "Fund"
WHERE status = 'APPROVED';

-- Sample similarity search
SELECT 
  name,
  1 - (embedding <=> (SELECT embedding FROM "Fund" WHERE id = 'clx123...')) as similarity
FROM "Fund"
WHERE id != 'clx123...'
ORDER BY embedding <=> (SELECT embedding FROM "Fund" WHERE id = 'clx123...')
LIMIT 10;
```

---

## Appendix B: Monitoring Queries

```sql
-- Embedding freshness report
SELECT 
  DATE_TRUNC('day', "embeddingUpdatedAt") as date,
  COUNT(*) as embeddings_updated
FROM "Fund"
WHERE "embeddingUpdatedAt" IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC
LIMIT 30;

-- Stale embeddings alert
SELECT COUNT(*) as stale_count
FROM "Fund" f
JOIN "FundStats" s ON f.id = s."fundId"
WHERE f.embedding IS NOT NULL
AND s."updatedAt" > f."embeddingUpdatedAt" + INTERVAL '1 day';
```

---

*"Jinkies! With this pipeline in place, we'll crack the mystery of fund discovery in no time!"* 🔍

— Velma 🤓
