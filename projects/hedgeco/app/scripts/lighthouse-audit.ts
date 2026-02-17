#!/usr/bin/env npx ts-node

/**
 * Lighthouse Performance Audit Script
 * 
 * Runs Lighthouse audits on key pages and outputs scores to JSON.
 * Flags performance issues that need attention.
 * 
 * Usage: npx ts-node scripts/lighthouse-audit.ts
 * 
 * Requirements:
 * - Chrome/Chromium installed
 * - App running on localhost:3000 (or set LIGHTHOUSE_URL env var)
 */

import { exec } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const BASE_URL = process.env.LIGHTHOUSE_URL || 'http://localhost:3000';
const OUTPUT_DIR = './lighthouse-reports';
const THRESHOLDS = {
  performance: 70,
  accessibility: 90,
  'best-practices': 80,
  seo: 80,
};

// Key pages to audit
const PAGES_TO_AUDIT = [
  { name: 'home', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'funds', path: '/funds' },
  { name: 'providers', path: '/providers' },
];

// Additional authenticated pages (require manual auth setup)
const AUTHENTICATED_PAGES = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'messages', path: '/messages' },
];

interface LighthouseScore {
  performance: number;
  accessibility: number;
  'best-practices': number;
  seo: number;
}

interface AuditResult {
  page: string;
  url: string;
  timestamp: string;
  scores: LighthouseScore;
  issues: string[];
  passed: boolean;
}

interface AuditReport {
  generatedAt: string;
  baseUrl: string;
  thresholds: typeof THRESHOLDS;
  results: AuditResult[];
  summary: {
    totalPages: number;
    passed: number;
    failed: number;
    averageScores: LighthouseScore;
  };
}

async function checkLighthouseInstalled(): Promise<boolean> {
  try {
    await execAsync('npx lighthouse --version');
    return true;
  } catch {
    return false;
  }
}

async function runLighthouseAudit(url: string, outputPath: string): Promise<LighthouseScore | null> {
  try {
    const cmd = `npx lighthouse "${url}" \
      --output=json \
      --output-path="${outputPath}" \
      --chrome-flags="--headless --no-sandbox --disable-gpu" \
      --only-categories=performance,accessibility,best-practices,seo \
      --quiet`;

    console.log(`  Running Lighthouse on ${url}...`);
    await execAsync(cmd, { timeout: 120000 });

    // Read and parse results
    const results = require(outputPath);
    
    return {
      performance: Math.round(results.categories.performance.score * 100),
      accessibility: Math.round(results.categories.accessibility.score * 100),
      'best-practices': Math.round(results.categories['best-practices'].score * 100),
      seo: Math.round(results.categories.seo.score * 100),
    };
  } catch (error) {
    console.error(`  Error auditing ${url}:`, error);
    return null;
  }
}

function checkThresholds(scores: LighthouseScore): string[] {
  const issues: string[] = [];
  
  for (const [category, threshold] of Object.entries(THRESHOLDS)) {
    const score = scores[category as keyof LighthouseScore];
    if (score < threshold) {
      issues.push(`${category}: ${score} (threshold: ${threshold})`);
    }
  }
  
  return issues;
}

function formatScoreColor(score: number, threshold: number): string {
  if (score >= threshold) return `\x1b[32m${score}\x1b[0m`; // Green
  if (score >= threshold - 10) return `\x1b[33m${score}\x1b[0m`; // Yellow
  return `\x1b[31m${score}\x1b[0m`; // Red
}

function printScoreTable(result: AuditResult): void {
  console.log(`\n  📊 ${result.page.toUpperCase()} (${result.url})`);
  console.log('  ─────────────────────────────────────');
  
  const categories = ['performance', 'accessibility', 'best-practices', 'seo'] as const;
  
  for (const category of categories) {
    const score = result.scores[category];
    const threshold = THRESHOLDS[category];
    const status = score >= threshold ? '✅' : '❌';
    const coloredScore = formatScoreColor(score, threshold);
    console.log(`  ${status} ${category.padEnd(16)} ${coloredScore}`);
  }
  
  if (result.issues.length > 0) {
    console.log('\n  ⚠️  Issues:');
    result.issues.forEach(issue => console.log(`     - ${issue}`));
  }
}

async function main(): Promise<void> {
  console.log('\n🔦 HedgeCo.Net Lighthouse Performance Audit\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Thresholds: Performance>${THRESHOLDS.performance}, Accessibility>${THRESHOLDS.accessibility}`);
  console.log(`            Best Practices>${THRESHOLDS['best-practices']}, SEO>${THRESHOLDS.seo}\n`);

  // Check if Lighthouse is installed
  const hasLighthouse = await checkLighthouseInstalled();
  if (!hasLighthouse) {
    console.error('❌ Lighthouse is not installed. Run: npm install -g lighthouse');
    process.exit(1);
  }

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results: AuditResult[] = [];
  const timestamp = new Date().toISOString();

  // Audit public pages
  console.log('📄 Auditing public pages...\n');
  
  for (const page of PAGES_TO_AUDIT) {
    const url = `${BASE_URL}${page.path}`;
    const outputPath = `${OUTPUT_DIR}/${page.name}-${Date.now()}.json`;
    
    const scores = await runLighthouseAudit(url, outputPath);
    
    if (scores) {
      const issues = checkThresholds(scores);
      const result: AuditResult = {
        page: page.name,
        url,
        timestamp,
        scores,
        issues,
        passed: issues.length === 0,
      };
      
      results.push(result);
      printScoreTable(result);
    } else {
      results.push({
        page: page.name,
        url,
        timestamp,
        scores: { performance: 0, accessibility: 0, 'best-practices': 0, seo: 0 },
        issues: ['Failed to run audit'],
        passed: false,
      });
      console.log(`  ❌ ${page.name}: Failed to audit`);
    }
  }

  // Calculate summary
  const validResults = results.filter(r => r.scores.performance > 0);
  const averageScores: LighthouseScore = {
    performance: 0,
    accessibility: 0,
    'best-practices': 0,
    seo: 0,
  };

  if (validResults.length > 0) {
    for (const category of Object.keys(averageScores) as (keyof LighthouseScore)[]) {
      averageScores[category] = Math.round(
        validResults.reduce((sum, r) => sum + r.scores[category], 0) / validResults.length
      );
    }
  }

  const passedCount = results.filter(r => r.passed).length;

  // Create report
  const report: AuditReport = {
    generatedAt: timestamp,
    baseUrl: BASE_URL,
    thresholds: THRESHOLDS,
    results,
    summary: {
      totalPages: results.length,
      passed: passedCount,
      failed: results.length - passedCount,
      averageScores,
    },
  };

  // Save report
  const reportPath = `${OUTPUT_DIR}/audit-report-${Date.now()}.json`;
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Also save latest report
  writeFileSync(`${OUTPUT_DIR}/latest-report.json`, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n\n═══════════════════════════════════════════');
  console.log('                   SUMMARY                   ');
  console.log('═══════════════════════════════════════════\n');
  
  console.log(`  Pages Audited:  ${results.length}`);
  console.log(`  Passed:         ${passedCount} ✅`);
  console.log(`  Failed:         ${results.length - passedCount} ❌`);
  
  console.log('\n  Average Scores:');
  console.log(`    Performance:     ${formatScoreColor(averageScores.performance, THRESHOLDS.performance)}`);
  console.log(`    Accessibility:   ${formatScoreColor(averageScores.accessibility, THRESHOLDS.accessibility)}`);
  console.log(`    Best Practices:  ${formatScoreColor(averageScores['best-practices'], THRESHOLDS['best-practices'])}`);
  console.log(`    SEO:             ${formatScoreColor(averageScores.seo, THRESHOLDS.seo)}`);
  
  console.log(`\n  📁 Report saved to: ${reportPath}`);
  console.log(`  📁 Latest report:   ${OUTPUT_DIR}/latest-report.json\n`);

  // Performance recommendations
  if (averageScores.performance < 80) {
    console.log('\n  💡 Performance Recommendations:');
    console.log('     - Enable Next.js Image optimization');
    console.log('     - Implement code splitting with dynamic imports');
    console.log('     - Add loading states for data fetching');
    console.log('     - Consider using React.lazy for routes');
    console.log('     - Optimize bundle size (analyze with next-bundle-analyzer)');
  }

  if (averageScores.accessibility < 90) {
    console.log('\n  ♿ Accessibility Recommendations:');
    console.log('     - Ensure all images have alt text');
    console.log('     - Check color contrast ratios');
    console.log('     - Add ARIA labels to interactive elements');
    console.log('     - Ensure proper heading hierarchy');
    console.log('     - Test with screen readers');
  }

  // Exit with error if any page failed
  if (passedCount < results.length) {
    console.log('\n⚠️  Some pages did not meet performance thresholds.\n');
    process.exit(1);
  }

  console.log('\n✅ All pages passed performance thresholds!\n');
  process.exit(0);
}

main().catch(console.error);
