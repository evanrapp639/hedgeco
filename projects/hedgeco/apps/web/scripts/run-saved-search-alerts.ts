#!/usr/bin/env npx ts-node
// Run Saved Search Alerts
// Cron job script to process all alert-enabled saved searches
// Designed to run hourly: 0 * * * * /path/to/run-saved-search-alerts.ts

import { PrismaClient, AlertFrequency } from '@prisma/client';
import {
  executeSavedSearch,
  compareResults,
  notifyUser,
  type SavedSearchCriteria,
} from '../src/lib/saved-search';

const prisma = new PrismaClient();

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  // Minimum hours since last run to process a search
  MIN_HOURS_SINCE_RUN: 1,

  // Batch size for processing
  BATCH_SIZE: 50,

  // Maximum results to check per search
  MAX_RESULTS: 100,

  // Delay between batches (ms) to prevent overload
  BATCH_DELAY: 1000,

  // Enable verbose logging
  VERBOSE: process.env.VERBOSE === 'true',
};

// ============================================================
// Types
// ============================================================

interface ProcessResult {
  searchId: string;
  searchName: string;
  userId: string;
  previousCount: number;
  currentCount: number;
  newMatches: number;
  notified: boolean;
  error?: string;
}

interface RunSummary {
  startTime: Date;
  endTime: Date;
  totalSearches: number;
  processed: number;
  notified: number;
  errors: number;
  results: ProcessResult[];
}

// ============================================================
// Helper Functions
// ============================================================

function log(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data) : '');
}

function verboseLog(message: string, data?: unknown) {
  if (CONFIG.VERBOSE) {
    log(message, data);
  }
}

function getFrequencyHours(frequency: AlertFrequency): number {
  switch (frequency) {
    case 'IMMEDIATELY':
      return 0; // Always process
    case 'DAILY':
      return 24;
    case 'WEEKLY':
      return 168; // 7 * 24
    default:
      return 24;
  }
}

function shouldProcessSearch(
  lastAlertAt: Date | null,
  frequency: AlertFrequency | null
): boolean {
  if (!lastAlertAt) return true;

  const hoursSinceLastRun =
    (Date.now() - lastAlertAt.getTime()) / (1000 * 60 * 60);
  const requiredHours = getFrequencyHours(frequency || 'DAILY');

  return hoursSinceLastRun >= Math.max(requiredHours, CONFIG.MIN_HOURS_SINCE_RUN);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Main Processing
// ============================================================

async function processSearch(search: {
  id: string;
  userId: string;
  name: string;
  filters: unknown;
  lastMatchCount: number | null;
  user: { id: string; email: string; active: boolean };
}): Promise<ProcessResult> {
  const result: ProcessResult = {
    searchId: search.id,
    searchName: search.name,
    userId: search.userId,
    previousCount: search.lastMatchCount || 0,
    currentCount: 0,
    newMatches: 0,
    notified: false,
  };

  try {
    // Skip if user is inactive
    if (!search.user.active) {
      verboseLog(`Skipping search for inactive user: ${search.userId}`);
      return result;
    }

    // Execute the search
    verboseLog(`Running search: ${search.name} (${search.id})`);
    const searchResults = await executeSavedSearch(
      search.filters as SavedSearchCriteria,
      CONFIG.MAX_RESULTS
    );

    result.currentCount = searchResults.length;

    // Compare with previous results
    const comparison = compareResults(result.previousCount, searchResults);
    result.newMatches = comparison.newMatchCount;

    // Update the saved search record
    await prisma.savedSearch.update({
      where: { id: search.id },
      data: {
        lastAlertAt: new Date(),
        lastMatchCount: result.currentCount,
      },
    });

    // Notify if there are new matches
    if (comparison.hasNewMatches && comparison.newMatchCount > 0) {
      await notifyUser(
        search.userId,
        search.id,
        search.name,
        comparison.newMatchCount
      );
      result.notified = true;
      log(`Notified user ${search.userId}: ${comparison.newMatchCount} new matches for "${search.name}"`);
    } else {
      verboseLog(`No new matches for search: ${search.name}`);
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`Error processing search ${search.id}:`, error);
  }

  return result;
}

async function runAlertJob(): Promise<RunSummary> {
  const startTime = new Date();
  log('Starting saved search alert job');

  const summary: RunSummary = {
    startTime,
    endTime: startTime,
    totalSearches: 0,
    processed: 0,
    notified: 0,
    errors: 0,
    results: [],
  };

  try {
    // Get all alert-enabled searches
    const searches = await prisma.savedSearch.findMany({
      where: {
        alertEnabled: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            active: true,
          },
        },
      },
      orderBy: {
        lastAlertAt: 'asc', // Process oldest first
      },
    });

    summary.totalSearches = searches.length;
    log(`Found ${searches.length} alert-enabled searches`);

    // Filter searches that need processing based on frequency
    const toProcess = searches.filter((search) =>
      shouldProcessSearch(search.lastAlertAt, search.alertFrequency)
    );

    log(`${toProcess.length} searches need processing`);

    // Process in batches
    for (let i = 0; i < toProcess.length; i += CONFIG.BATCH_SIZE) {
      const batch = toProcess.slice(i, i + CONFIG.BATCH_SIZE);
      log(`Processing batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(toProcess.length / CONFIG.BATCH_SIZE)}`);

      const batchResults = await Promise.all(
        batch.map((search) => processSearch(search))
      );

      summary.results.push(...batchResults);

      // Update counters
      batchResults.forEach((result) => {
        summary.processed++;
        if (result.notified) summary.notified++;
        if (result.error) summary.errors++;
      });

      // Delay between batches
      if (i + CONFIG.BATCH_SIZE < toProcess.length) {
        await sleep(CONFIG.BATCH_DELAY);
      }
    }
  } catch (error) {
    console.error('Fatal error in alert job:', error);
    summary.errors++;
  }

  summary.endTime = new Date();
  const duration = summary.endTime.getTime() - summary.startTime.getTime();

  log('Alert job completed', {
    duration: `${(duration / 1000).toFixed(2)}s`,
    totalSearches: summary.totalSearches,
    processed: summary.processed,
    notified: summary.notified,
    errors: summary.errors,
  });

  return summary;
}

// ============================================================
// Entry Point
// ============================================================

async function main() {
  try {
    const summary = await runAlertJob();

    // Exit with error code if there were errors
    if (summary.errors > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
main();

export { runAlertJob };
