#!/usr/bin/env npx ts-node
/**
 * Refresh Embeddings Script
 * Update embeddings for recently modified funds
 *
 * Usage: npx ts-node scripts/refresh-embeddings.ts [--days N] [--all] [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

// ============================================================
// Configuration
// ============================================================

const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 3072;
const BATCH_SIZE = 50;
const RATE_LIMIT_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const DEFAULT_DAYS = 7; // Default: refresh funds modified in last 7 days

// ============================================================
// Setup
// ============================================================

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const refreshAll = args.includes('--all');
const daysIndex = args.indexOf('--days');
const days = daysIndex !== -1 ? parseInt(args[daysIndex + 1], 10) : DEFAULT_DAYS;

// ============================================================
// Utility Functions
// ============================================================

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return `${(value * 100).toFixed(1)}%`;
}

function formatFundType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildFundEmbeddingText(fund: FundWithStats): string {
  const stats = fund.statistics;
  const lines = [
    `Fund Name: ${fund.name}`,
    `Fund Type: ${formatFundType(fund.type)}`,
    fund.strategy && `Investment Strategy: ${fund.strategy.replace(/_/g, ' ')}`,
    fund.subStrategy && `Sub-Strategy: ${fund.subStrategy}`,
    fund.description && `Description: ${fund.description}`,
    fund.aum && `Assets Under Management: ${formatCurrency(Number(fund.aum))}`,
    stats?.oneYearReturn && `One-Year Return: ${formatPercent(Number(stats.oneYearReturn))}`,
    stats?.threeYearReturn && `Three-Year Annualized Return: ${formatPercent(Number(stats.threeYearReturn))}`,
    stats?.sharpeRatio && `Sharpe Ratio: ${Number(stats.sharpeRatio).toFixed(2)}`,
    stats?.maxDrawdown && `Maximum Drawdown: ${formatPercent(Number(stats.maxDrawdown))}`,
    stats?.volatility && `Annualized Volatility: ${formatPercent(Number(stats.volatility))}`,
    fund.country && `Domicile: ${fund.country}`,
    fund.state && `State: ${fund.state}`,
    fund.city && `City: ${fund.city}`,
    fund.minInvestment && `Minimum Investment: ${formatCurrency(Number(fund.minInvestment))}`,
    fund.managementFee && `Management Fee: ${formatPercent(Number(fund.managementFee))}`,
    fund.performanceFee && `Performance Fee: ${formatPercent(Number(fund.performanceFee))}`,
    fund.lockupPeriod && `Lockup Period: ${fund.lockupPeriod}`,
    fund.redemptionTerms && `Redemption Terms: ${fund.redemptionTerms}`,
    stats?.beta && `Beta to S&P 500: ${Number(stats.beta).toFixed(2)}`,
    stats?.correlationSP500 && `Correlation to S&P 500: ${Number(stats.correlationSP500).toFixed(2)}`,
    fund.legalStructure && `Legal Structure: ${fund.legalStructure}`,
    fund.domicile && `Fund Domicile: ${fund.domicile}`,
  ];
  return lines.filter(Boolean).join('\n');
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries: number = MAX_RETRIES): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        await sleep(5000 * Math.pow(2, attempt - 1));
      }
    }
  }
  throw lastError;
}

// ============================================================
// Types
// ============================================================

type FundWithStats = Awaited<ReturnType<typeof prisma.fund.findFirst>> & {
  statistics: Awaited<ReturnType<typeof prisma.fundStatistics.findFirst>> | null;
};

interface RefreshCandidate {
  fundId: string;
  fundName: string;
  fundUpdatedAt: Date;
  embeddingUpdatedAt: Date | null;
  reason: 'stale' | 'missing' | 'forced';
}

// ============================================================
// Main Processing
// ============================================================

async function findFundsNeedingRefresh(): Promise<RefreshCandidate[]> {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  if (refreshAll) {
    // Get all approved funds with their embedding timestamps
    const allFunds = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        updatedAt: Date;
        embUpdatedAt: Date | null;
      }>
    >`
      SELECT 
        f.id,
        f.name,
        f."updatedAt",
        fe."updatedAt" as "embUpdatedAt"
      FROM "Fund" f
      LEFT JOIN "FundEmbedding" fe ON f.id = fe."fundId"
      WHERE f.status = 'APPROVED' AND f.visible = true
      ORDER BY f."updatedAt" DESC
    `;

    return allFunds.map((f) => ({
      fundId: f.id,
      fundName: f.name,
      fundUpdatedAt: f.updatedAt,
      embeddingUpdatedAt: f.embUpdatedAt,
      reason: 'forced' as const,
    }));
  }

  // Find funds where:
  // 1. Fund was updated after the embedding was last generated
  // 2. Fund has no embedding yet
  // 3. Statistics were updated recently (via a join check)
  const candidates = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      updatedAt: Date;
      embUpdatedAt: Date | null;
      statsUpdatedAt: Date | null;
    }>
  >`
    SELECT 
      f.id,
      f.name,
      f."updatedAt",
      fe."updatedAt" as "embUpdatedAt",
      fs."updatedAt" as "statsUpdatedAt"
    FROM "Fund" f
    LEFT JOIN "FundEmbedding" fe ON f.id = fe."fundId"
    LEFT JOIN "FundStatistics" fs ON f.id = fs."fundId"
    WHERE 
      f.status = 'APPROVED' 
      AND f.visible = true
      AND (
        -- No embedding exists
        fe.id IS NULL
        -- Fund updated after embedding
        OR f."updatedAt" > fe."updatedAt"
        -- Statistics updated after embedding
        OR (fs."updatedAt" IS NOT NULL AND fs."updatedAt" > fe."updatedAt")
        -- Within the time window
        OR f."updatedAt" >= ${sinceDate}
      )
    ORDER BY f."updatedAt" DESC
  `;

  return candidates.map((f) => {
    let reason: 'stale' | 'missing' | 'forced' = 'stale';
    if (!f.embUpdatedAt) {
      reason = 'missing';
    }
    return {
      fundId: f.id,
      fundName: f.name,
      fundUpdatedAt: f.updatedAt,
      embeddingUpdatedAt: f.embUpdatedAt,
      reason,
    };
  });
}

async function refreshEmbedding(fundId: string): Promise<{ success: boolean; tokensUsed: number }> {
  const fund = await prisma.fund.findUnique({
    where: { id: fundId },
    include: { statistics: true },
  });

  if (!fund) {
    throw new Error(`Fund not found: ${fundId}`);
  }

  const sourceText = buildFundEmbeddingText(fund);

  const response = await withRetry(() =>
    openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: sourceText,
      dimensions: EMBEDDING_DIMENSIONS,
    })
  );

  const embedding = response.data[0].embedding;
  const embeddingVector = `[${embedding.join(',')}]`;

  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "FundEmbedding" WHERE "fundId" = ${fundId} LIMIT 1
  `;

  if (existing.length > 0) {
    await prisma.$executeRaw`
      UPDATE "FundEmbedding"
      SET 
        embedding = ${embeddingVector}::vector,
        "sourceText" = ${sourceText},
        model = ${EMBEDDING_MODEL},
        dimensions = ${EMBEDDING_DIMENSIONS},
        "updatedAt" = NOW()
      WHERE "fundId" = ${fundId}
    `;
  } else {
    const newId = `emb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await prisma.$executeRaw`
      INSERT INTO "FundEmbedding" (id, "fundId", embedding, "sourceText", model, dimensions, "createdAt", "updatedAt")
      VALUES (
        ${newId},
        ${fundId},
        ${embeddingVector}::vector,
        ${sourceText},
        ${EMBEDDING_MODEL},
        ${EMBEDDING_DIMENSIONS},
        NOW(),
        NOW()
      )
    `;
  }

  return { success: true, tokensUsed: response.usage.total_tokens };
}

// ============================================================
// Entry Point
// ============================================================

async function main(): Promise<void> {
  console.log('\n🔄 Refresh Embeddings Script');
  console.log('================================');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  if (refreshAll) {
    console.log('📋 Mode: Refresh ALL embeddings\n');
  } else {
    console.log(`📋 Mode: Refresh funds modified in last ${days} days\n`);
  }

  // Find candidates for refresh
  console.log('🔎 Finding funds needing refresh...');
  const candidates = await findFundsNeedingRefresh();

  if (candidates.length === 0) {
    console.log('✨ All embeddings are up to date!');
    await prisma.$disconnect();
    return;
  }

  // Group by reason
  const missing = candidates.filter((c) => c.reason === 'missing');
  const stale = candidates.filter((c) => c.reason === 'stale');
  const forced = candidates.filter((c) => c.reason === 'forced');

  console.log(`\nFound ${candidates.length} funds to refresh:`);
  if (missing.length > 0) console.log(`  📭 Missing embedding: ${missing.length}`);
  if (stale.length > 0) console.log(`  ⏰ Stale embedding: ${stale.length}`);
  if (forced.length > 0) console.log(`  🔄 Forced refresh: ${forced.length}`);

  // Process
  const startTime = Date.now();
  let successful = 0;
  let failed = 0;
  let totalTokens = 0;
  const errors: Array<{ name: string; error: string }> = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const progress = `[${i + 1}/${candidates.length}]`;

    try {
      if (!dryRun) {
        const result = await refreshEmbedding(candidate.fundId);
        totalTokens += result.tokensUsed;
      }
      console.log(`${progress} ✅ ${candidate.fundName} (${candidate.reason})`);
      successful++;

      // Rate limiting
      if ((i + 1) % BATCH_SIZE === 0 && i < candidates.length - 1) {
        console.log(`\n⏳ Rate limit pause (${RATE_LIMIT_DELAY_MS}ms)...\n`);
        await sleep(RATE_LIMIT_DELAY_MS);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`${progress} ❌ ${candidate.fundName}: ${errorMessage}`);
      errors.push({ name: candidate.fundName, error: errorMessage });
      failed++;
    }
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n================================');
  console.log('📊 Summary');
  console.log('================================');
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🎟️  Total tokens used: ${totalTokens.toLocaleString()}`);
  console.log(`💰 Estimated cost: $${((totalTokens / 1_000_000) * 0.13).toFixed(4)}`);

  if (errors.length > 0) {
    console.log('\n❌ Failed funds:');
    errors.forEach((e) => console.log(`  - ${e.name}: ${e.error}`));
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No embeddings were actually updated');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
