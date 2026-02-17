// Embeddings Service - Vector generation and storage for semantic search
// Uses OpenAI text-embedding-3-large (3072 dimensions)

import OpenAI from 'openai';
import { prisma } from './prisma';
import type { Fund, FundStatistics } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

// ============================================================
// OpenAI Client (lazy initialized)
// ============================================================

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 3072;

// ============================================================
// Types
// ============================================================

type FundWithStats = Fund & {
  statistics: FundStatistics | null;
};

interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
  tokensUsed: number;
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Format currency for human-readable embedding text
 */
function formatCurrency(value: Decimal | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(0)}K`;
  }
  return `$${num.toFixed(0)}`;
}

/**
 * Format percentage for human-readable embedding text
 */
function formatPercent(value: Decimal | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : Number(value);
  // Assuming stored as decimal (e.g., 0.15 = 15%)
  return `${(num * 100).toFixed(1)}%`;
}

/**
 * Format fund type for human-readable text
 */
function formatFundType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Generate embedding vector for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const response = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return {
    embedding: response.data[0].embedding,
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    tokensUsed: response.usage.total_tokens,
  };
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than individual calls (up to 2048 inputs per request)
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
  if (texts.length === 0) return [];
  
  // OpenAI allows up to 2048 inputs per request, we use 100 for safety
  const batchSize = 100;
  const results: EmbeddingResult[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const response = await getOpenAI().embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const batchResults = response.data.map((item) => ({
      embedding: item.embedding,
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
      tokensUsed: Math.ceil(response.usage.total_tokens / batch.length), // Approximate per-item
    }));

    results.push(...batchResults);

    // Rate limiting: ~3000 RPM for embeddings API
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Build the text representation of a fund for embedding
 * Following the spec from EMBEDDING_PIPELINE.md
 */
export function buildFundEmbeddingText(fund: FundWithStats): string {
  const stats = fund.statistics;

  const lines = [
    // Identity
    `Fund Name: ${fund.name}`,
    `Fund Type: ${formatFundType(fund.type)}`,

    // Strategy (critical for semantic matching)
    fund.strategy && `Investment Strategy: ${fund.strategy.replace(/_/g, ' ')}`,
    fund.subStrategy && `Sub-Strategy: ${fund.subStrategy}`,

    // Description (rich semantic content)
    fund.description && `Description: ${fund.description}`,

    // Quantitative context (converted to natural language)
    fund.aum && `Assets Under Management: ${formatCurrency(fund.aum)}`,
    stats?.oneYearReturn && `One-Year Return: ${formatPercent(stats.oneYearReturn)}`,
    stats?.threeYearReturn && `Three-Year Annualized Return: ${formatPercent(stats.threeYearReturn)}`,
    stats?.sharpeRatio && `Sharpe Ratio: ${Number(stats.sharpeRatio).toFixed(2)}`,
    stats?.maxDrawdown && `Maximum Drawdown: ${formatPercent(stats.maxDrawdown)}`,
    stats?.volatility && `Annualized Volatility: ${formatPercent(stats.volatility)}`,

    // Geographic focus
    fund.country && `Domicile: ${fund.country}`,
    fund.state && `State: ${fund.state}`,
    fund.city && `City: ${fund.city}`,

    // Terms (for matching investor constraints)
    fund.minInvestment && `Minimum Investment: ${formatCurrency(fund.minInvestment)}`,
    fund.managementFee && `Management Fee: ${formatPercent(fund.managementFee)}`,
    fund.performanceFee && `Performance Fee: ${formatPercent(fund.performanceFee)}`,
    fund.lockupPeriod && `Lockup Period: ${fund.lockupPeriod}`,
    fund.redemptionTerms && `Redemption Terms: ${fund.redemptionTerms}`,

    // Risk characteristics
    stats?.beta && `Beta to S&P 500: ${Number(stats.beta).toFixed(2)}`,
    stats?.correlationSP500 && `Correlation to S&P 500: ${Number(stats.correlationSP500).toFixed(2)}`,
    
    // Structure
    fund.legalStructure && `Legal Structure: ${fund.legalStructure}`,
    fund.domicile && `Fund Domicile: ${fund.domicile}`,
  ];

  return lines.filter(Boolean).join('\n');
}

/**
 * Generate and store embedding for a specific fund
 * Creates or updates the FundEmbedding record
 */
export async function upsertFundEmbedding(fundId: string): Promise<{ success: boolean; tokensUsed: number }> {
  // Fetch fund with statistics
  const fund = await prisma.fund.findUnique({
    where: { id: fundId },
    include: { statistics: true },
  });

  if (!fund) {
    throw new Error(`Fund not found: ${fundId}`);
  }

  // Build embedding text
  const sourceText = buildFundEmbeddingText(fund);

  // Generate embedding
  const { embedding, model, dimensions, tokensUsed } = await generateEmbedding(sourceText);

  // Convert embedding array to pgvector format string: '[0.1,0.2,...]'
  const embeddingVector = `[${embedding.join(',')}]`;

  // Check if embedding exists using raw query (pgvector types not natively supported)
  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "FundEmbedding" WHERE "fundId" = ${fundId} LIMIT 1
  `;

  if (existing.length > 0) {
    // Update existing embedding using raw SQL for vector type
    await prisma.$executeRaw`
      UPDATE "FundEmbedding"
      SET 
        embedding = ${embeddingVector}::vector,
        "sourceText" = ${sourceText},
        model = ${model},
        dimensions = ${dimensions},
        "updatedAt" = NOW()
      WHERE "fundId" = ${fundId}
    `;
  } else {
    // Create new embedding with vector using raw SQL
    const newId = `emb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await prisma.$executeRaw`
      INSERT INTO "FundEmbedding" (id, "fundId", embedding, "sourceText", model, dimensions, "createdAt", "updatedAt")
      VALUES (
        ${newId},
        ${fundId},
        ${embeddingVector}::vector,
        ${sourceText},
        ${model},
        ${dimensions},
        NOW(),
        NOW()
      )
    `;
  }

  return { success: true, tokensUsed };
}

/**
 * Generate embeddings for all funds that don't have one
 * Useful for initial migration or catching up
 */
export async function generateMissingEmbeddings(): Promise<{
  processed: number;
  failed: number;
  totalTokens: number;
}> {
  // Find all approved funds without embeddings using raw query
  const fundsWithoutEmbeddings = await prisma.$queryRaw<{ id: string }[]>`
    SELECT f.id 
    FROM "Fund" f
    LEFT JOIN "FundEmbedding" fe ON f.id = fe."fundId"
    WHERE f.status = 'APPROVED' 
    AND f.visible = true 
    AND fe.id IS NULL
  `;

  // Fetch full fund data for those without embeddings
  const fundIds = fundsWithoutEmbeddings.map((f) => f.id);
  const funds = await prisma.fund.findMany({
    where: { id: { in: fundIds } },
    include: { statistics: true },
  });

  let processed = 0;
  let failed = 0;
  let totalTokens = 0;

  for (const fund of funds) {
    try {
      const result = await upsertFundEmbedding(fund.id);
      totalTokens += result.tokensUsed;
      processed++;
      
      // Log progress every 10 funds
      if (processed % 10 === 0) {
        console.log(`Processed ${processed}/${funds.length} embeddings`);
      }
    } catch (error) {
      console.error(`Failed to generate embedding for fund ${fund.id}:`, error);
      failed++;
    }
  }

  return { processed, failed, totalTokens };
}

/**
 * Perform vector similarity search for funds
 */
export async function searchFundsByVector(
  queryEmbedding: number[],
  options: {
    fundType?: string;
    strategy?: string;
    minAum?: number;
    maxAum?: number;
    limit?: number;
    threshold?: number;
    excludeIds?: string[];
  } = {}
): Promise<
  Array<{
    id: string;
    name: string;
    type: string;
    strategy: string | null;
    similarity: number;
  }>
> {
  const { 
    fundType, 
    strategy, 
    minAum, 
    maxAum, 
    limit = 20, 
    threshold = 0.5,
    excludeIds = [] 
  } = options;

  const embeddingVector = `[${queryEmbedding.join(',')}]`;

  // Build dynamic WHERE conditions
  const conditions: string[] = [
    `f.status = 'APPROVED'`,
    `f.visible = true`,
    `fe.embedding IS NOT NULL`,
    `(1 - (fe.embedding <=> '${embeddingVector}'::vector)) >= ${threshold}`,
  ];

  if (fundType) {
    conditions.push(`f.type::TEXT = '${fundType}'`);
  }
  if (strategy) {
    conditions.push(`f.strategy ILIKE '%${strategy}%'`);
  }
  if (minAum !== undefined) {
    conditions.push(`f.aum >= ${minAum}`);
  }
  if (maxAum !== undefined) {
    conditions.push(`f.aum <= ${maxAum}`);
  }
  if (excludeIds.length > 0) {
    conditions.push(`f.id NOT IN (${excludeIds.map(id => `'${id}'`).join(',')})`);
  }

  const whereClause = conditions.join(' AND ');

  const results = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string;
      type: string;
      strategy: string | null;
      similarity: number;
    }>
  >(`
    SELECT 
      f.id,
      f.name,
      f.type::TEXT as type,
      f.strategy,
      (1 - (fe.embedding <=> '${embeddingVector}'::vector))::FLOAT as similarity
    FROM "Fund" f
    JOIN "FundEmbedding" fe ON f.id = fe."fundId"
    WHERE ${whereClause}
    ORDER BY fe.embedding <=> '${embeddingVector}'::vector
    LIMIT ${limit}
  `);

  return results;
}

/**
 * Find similar funds to a given fund
 */
export async function findSimilarFunds(
  fundId: string,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    name: string;
    type: string;
    strategy: string | null;
    similarity: number;
  }>
> {
  const results = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      type: string;
      strategy: string | null;
      similarity: number;
    }>
  >`
    SELECT 
      f.id,
      f.name,
      f.type::TEXT as type,
      f.strategy,
      (1 - (fe.embedding <=> source.embedding))::FLOAT as similarity
    FROM "Fund" f
    JOIN "FundEmbedding" fe ON f.id = fe."fundId"
    CROSS JOIN (
      SELECT embedding 
      FROM "FundEmbedding" 
      WHERE "fundId" = ${fundId}
    ) source
    WHERE 
      f.id != ${fundId}
      AND f.status = 'APPROVED'
      AND f.visible = true
      AND fe.embedding IS NOT NULL
    ORDER BY fe.embedding <=> source.embedding
    LIMIT ${limit}
  `;

  return results;
}
