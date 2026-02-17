#!/usr/bin/env npx ts-node
/**
 * Generate Embeddings Script
 * Batch process all funds without embeddings
 *
 * Usage: npx ts-node scripts/generate-embeddings.ts [--dry-run] [--limit N]
 */

import { PrismaClient, FundStatus } from '@prisma/client';
import OpenAI from 'openai';

// ============================================================
// Configuration
// ============================================================

const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSIONS = 3072;
const BATCH_SIZE = 50; // Embeddings per batch (OpenAI allows up to 2048)
const RATE_LIMIT_DELAY_MS = 2000; // Delay between batches to avoid rate limits
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

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
const limitIndex = args.indexOf('--limit');
const maxLimit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;

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
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`  ⚠️  Attempt ${attempt}/${retries} failed: ${lastError.message}`);
      
      if (attempt < retries) {
        const backoffDelay = delayMs * Math.pow(2, attempt - 1);
        console.log(`  ⏳ Waiting ${backoffDelay}ms before retry...`);
        await sleep(backoffDelay);
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

interface ProcessingResult {
  fundId: string;
  fundName: string;
  success: boolean;
  tokensUsed: number;
  error?: string;
}

// ============================================================
// Main Processing
// ============================================================

async function getFundsWithoutEmbeddings(): Promise<FundWithStats[]> {
  // Find all approved/visible funds without embeddings
  const fundsWithoutEmbeddings = await prisma.$queryRaw<{ id: string }[]>`
    SELECT f.id 
    FROM "Fund" f
    LEFT JOIN "FundEmbedding" fe ON f.id = fe."fundId"
    WHERE f.status = 'APPROVED' 
    AND f.visible = true 
    AND fe.id IS NULL
    ${maxLimit ? prisma.$queryRaw`LIMIT ${maxLimit}` : prisma.$queryRaw``}
  `;

  const fundIds = fundsWithoutEmbeddings.map((f) => f.id);
  
  if (fundIds.length === 0) {
    return [];
  }

  const funds = await prisma.fund.findMany({
    where: { id: { in: fundIds } },
    include: { statistics: true },
  });

  return funds;
}

async function generateBatchEmbeddings(
  texts: string[]
): Promise<{ embeddings: number[][]; tokensUsed: number }> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return {
    embeddings: response.data.map((item) => item.embedding),
    tokensUsed: response.usage.total_tokens,
  };
}

async function storeEmbedding(
  fundId: string,
  embedding: number[],
  sourceText: string
): Promise<void> {
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
}

async function processBatch(
  funds: FundWithStats[],
  batchNumber: number,
  totalBatches: number
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];
  
  console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${funds.length} funds)`);

  // Build texts for all funds in batch
  const fundTexts = funds.map((fund) => ({
    fund,
    text: buildFundEmbeddingText(fund),
  }));

  try {
    // Generate embeddings in batch
    const { embeddings, tokensUsed } = await withRetry(() =>
      generateBatchEmbeddings(fundTexts.map((ft) => ft.text))
    );

    const tokensPerFund = Math.ceil(tokensUsed / funds.length);

    // Store each embedding
    for (let i = 0; i < funds.length; i++) {
      const fund = funds[i];
      const embedding = embeddings[i];
      const sourceText = fundTexts[i].text;

      try {
        if (!dryRun) {
          await storeEmbedding(fund.id, embedding, sourceText);
        }
        
        results.push({
          fundId: fund.id,
          fundName: fund.name,
          success: true,
          tokensUsed: tokensPerFund,
        });
        
        console.log(`  ✅ ${fund.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          fundId: fund.id,
          fundName: fund.name,
          success: false,
          tokensUsed: 0,
          error: errorMessage,
        });
        console.error(`  ❌ ${fund.name}: ${errorMessage}`);
      }
    }
  } catch (error) {
    // Batch embedding generation failed, try individual funds
    console.warn(`  ⚠️  Batch failed, falling back to individual processing`);
    
    for (const { fund, text } of fundTexts) {
      try {
        const response = await withRetry(() =>
          openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text,
            dimensions: EMBEDDING_DIMENSIONS,
          })
        );

        if (!dryRun) {
          await storeEmbedding(fund.id, response.data[0].embedding, text);
        }

        results.push({
          fundId: fund.id,
          fundName: fund.name,
          success: true,
          tokensUsed: response.usage.total_tokens,
        });
        
        console.log(`  ✅ ${fund.name}`);
        
        // Small delay between individual calls
        await sleep(500);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          fundId: fund.id,
          fundName: fund.name,
          success: false,
          tokensUsed: 0,
          error: errorMessage,
        });
        console.error(`  ❌ ${fund.name}: ${errorMessage}`);
      }
    }
  }

  return results;
}

// ============================================================
// Entry Point
// ============================================================

async function main(): Promise<void> {
  console.log('\n🚀 Generate Embeddings Script');
  console.log('================================');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  if (maxLimit) {
    console.log(`📊 Limit: ${maxLimit} funds\n`);
  }

  // Get funds needing embeddings
  console.log('📋 Fetching funds without embeddings...');
  const funds = await getFundsWithoutEmbeddings();

  if (funds.length === 0) {
    console.log('✨ All funds already have embeddings!');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${funds.length} funds to process\n`);

  // Process in batches
  const batches: FundWithStats[][] = [];
  for (let i = 0; i < funds.length; i += BATCH_SIZE) {
    batches.push(funds.slice(i, i + BATCH_SIZE));
  }

  const allResults: ProcessingResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < batches.length; i++) {
    const batchResults = await processBatch(batches[i], i + 1, batches.length);
    allResults.push(...batchResults);

    // Rate limiting between batches
    if (i < batches.length - 1) {
      console.log(`\n⏳ Rate limit delay (${RATE_LIMIT_DELAY_MS}ms)...`);
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const successful = allResults.filter((r) => r.success);
  const failed = allResults.filter((r) => !r.success);
  const totalTokens = allResults.reduce((sum, r) => sum + r.tokensUsed, 0);

  console.log('\n================================');
  console.log('📊 Summary');
  console.log('================================');
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`🎟️  Total tokens used: ${totalTokens.toLocaleString()}`);
  console.log(`💰 Estimated cost: $${((totalTokens / 1_000_000) * 0.13).toFixed(4)}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed funds:');
    failed.forEach((f) => {
      console.log(`  - ${f.fundName}: ${f.error}`);
    });
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No embeddings were actually stored');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
