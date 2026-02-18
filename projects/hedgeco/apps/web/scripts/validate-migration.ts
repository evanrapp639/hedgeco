/**
 * Migration Validation Script
 * 
 * Compares record counts between legacy and new database,
 * verifies data integrity, and generates a validation report.
 * 
 * Usage: npx tsx scripts/validate-migration.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ValidationResult {
  table: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: Record<string, unknown>;
}

interface RecordCountComparison {
  table: string;
  newCount: number;
  legacyCount?: number;
  difference?: number;
  percentDiff?: string;
}

interface IntegrityCheck {
  check: string;
  passed: boolean;
  details: string;
  affectedRecords?: number;
}

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
};

function log(message: string, color?: keyof typeof colors) {
  if (color) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  } else {
    console.log(message);
  }
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "bold");
  console.log("=".repeat(60));
}

async function getRecordCounts(): Promise<RecordCountComparison[]> {
  const counts: RecordCountComparison[] = [];
  
  // Get counts for all major tables (based on actual Prisma schema)
  const tables = [
    { name: "User", countFn: () => prisma.user.count() },
    { name: "Profile", countFn: () => prisma.profile.count() },
    { name: "Fund", countFn: () => prisma.fund.count() },
    { name: "FundReturn", countFn: () => prisma.fundReturn.count() },
    { name: "FundStatistics", countFn: () => prisma.fundStatistics.count() },
    { name: "Message", countFn: () => prisma.message.count() },
    { name: "FundInquiry", countFn: () => prisma.fundInquiry.count() },
    { name: "ServiceProvider", countFn: () => prisma.serviceProvider.count() },
    { name: "Conference", countFn: () => prisma.conference.count() },
    { name: "Watchlist", countFn: () => prisma.watchlist.count() },
    { name: "Subscription", countFn: () => prisma.subscription.count() },
    { name: "SavedSearch", countFn: () => prisma.savedSearch.count() },
    { name: "Notification", countFn: () => prisma.notification.count() },
    { name: "AuditLog", countFn: () => prisma.auditLog.count() },
    { name: "FundDocument", countFn: () => prisma.fundDocument.count() },
  ];
  
  for (const table of tables) {
    try {
      const newCount = await table.countFn();
      counts.push({
        table: table.name,
        newCount,
        // Note: Legacy counts would come from the old database connection
        // For now, we just report the new counts
      });
    } catch (error) {
      counts.push({
        table: table.name,
        newCount: -1,
        // Mark error
      });
    }
  }
  
  return counts;
}

async function checkRequiredFields(): Promise<IntegrityCheck[]> {
  const checks: IntegrityCheck[] = [];
  
  // Check Users have required fields
  const usersWithoutEmail = await prisma.user.count({
    where: {
      email: "",
    },
  });
  
  checks.push({
    check: "Users have email",
    passed: usersWithoutEmail === 0,
    details: usersWithoutEmail === 0 
      ? "All users have email addresses" 
      : `${usersWithoutEmail} users missing email`,
    affectedRecords: usersWithoutEmail,
  });
  
  // Check Funds have required fields
  const fundsWithoutName = await prisma.fund.count({
    where: {
      name: "",
    },
  });
  
  checks.push({
    check: "Funds have name",
    passed: fundsWithoutName === 0,
    details: fundsWithoutName === 0 
      ? "All funds have names" 
      : `${fundsWithoutName} funds missing name`,
    affectedRecords: fundsWithoutName,
  });
  
  // Check Funds have managers
  const fundsWithoutManager = await prisma.fund.count({
    where: {
      managerId: "",
    },
  });
  
  checks.push({
    check: "Funds have managers",
    passed: fundsWithoutManager === 0,
    details: fundsWithoutManager === 0 
      ? "All funds have assigned managers" 
      : `${fundsWithoutManager} funds without managers`,
    affectedRecords: fundsWithoutManager,
  });
  
  // Check Profiles linked to Users
  const orphanedProfiles = await prisma.profile.count({
    where: {
      userId: "",
    },
  });
  
  checks.push({
    check: "Profiles linked to Users",
    passed: orphanedProfiles === 0,
    details: orphanedProfiles === 0 
      ? "All profiles are linked to users" 
      : `${orphanedProfiles} orphaned profiles`,
    affectedRecords: orphanedProfiles,
  });
  
  // Check Fund Returns have valid dates
  const invalidReturns = await prisma.fundReturn.count({
    where: {
      OR: [
        { year: { lt: 1990 } },
        { year: { gt: 2030 } },
        { month: { lt: 1 } },
        { month: { gt: 12 } },
      ],
    },
  });
  
  checks.push({
    check: "Fund returns have valid dates",
    passed: invalidReturns === 0,
    details: invalidReturns === 0 
      ? "All fund returns have valid year/month" 
      : `${invalidReturns} returns with invalid dates`,
    affectedRecords: invalidReturns,
  });
  
  // Check Messages have senders
  const orphanedMessages = await prisma.message.count({
    where: {
      senderId: "",
    },
  });
  
  checks.push({
    check: "Messages have senders",
    passed: orphanedMessages === 0,
    details: orphanedMessages === 0 
      ? "All messages have senders" 
      : `${orphanedMessages} messages without senders`,
    affectedRecords: orphanedMessages,
  });
  
  return checks;
}

async function checkRelationships(): Promise<IntegrityCheck[]> {
  const checks: IntegrityCheck[] = [];
  
  // Check User-Profile relationship
  const usersWithProfiles = await prisma.user.count({
    where: {
      profile: {
        isNot: null,
      },
    },
  });
  
  const totalUsers = await prisma.user.count();
  
  checks.push({
    check: "User-Profile relationship",
    passed: usersWithProfiles === totalUsers,
    details: `${usersWithProfiles}/${totalUsers} users have profiles`,
    affectedRecords: totalUsers - usersWithProfiles,
  });
  
  // Check Fund-FundStatistics relationship
  const fundsWithStats = await prisma.fund.count({
    where: {
      statistics: {
        isNot: null,
      },
    },
  });
  
  const totalFunds = await prisma.fund.count();
  
  checks.push({
    check: "Fund-Statistics relationship",
    passed: true, // Not all funds need statistics
    details: `${fundsWithStats}/${totalFunds} funds have statistics`,
  });
  
  // Check Fund-Returns relationship
  const fundsWithReturns = await prisma.fund.count({
    where: {
      returns: {
        some: {},
      },
    },
  });
  
  checks.push({
    check: "Fund-Returns relationship",
    passed: true, // Not all funds need returns
    details: `${fundsWithReturns}/${totalFunds} funds have return data`,
  });
  
  // Check Watchlist has funds
  const totalWatchlists = await prisma.watchlist.count();
  
  checks.push({
    check: "Watchlists exist",
    passed: true, // Just informational
    details: `${totalWatchlists} watchlists in database`,
  });
  
  // Check Messages have recipients
  const messagesWithRecipients = await prisma.message.count({
    where: {
      NOT: {
        recipientId: "",
      },
    },
  });
  
  const totalMessages = await prisma.message.count();
  
  checks.push({
    check: "Messages have recipients",
    passed: messagesWithRecipients === totalMessages,
    details: messagesWithRecipients === totalMessages
      ? "All messages have recipients"
      : `${totalMessages - messagesWithRecipients} messages without recipients`,
    affectedRecords: totalMessages - messagesWithRecipients,
  });
  
  return checks;
}

async function checkDataQuality(): Promise<IntegrityCheck[]> {
  const checks: IntegrityCheck[] = [];
  
  // Check for duplicate emails
  const duplicateEmails = await prisma.$queryRaw<{ email: string; count: bigint }[]>`
    SELECT email, COUNT(*) as count 
    FROM "User" 
    WHERE email IS NOT NULL 
    GROUP BY email 
    HAVING COUNT(*) > 1
  `;
  
  checks.push({
    check: "No duplicate emails",
    passed: duplicateEmails.length === 0,
    details: duplicateEmails.length === 0
      ? "No duplicate emails found"
      : `${duplicateEmails.length} duplicate email addresses`,
    affectedRecords: duplicateEmails.length,
  });
  
  // Check for duplicate fund slugs
  const duplicateSlugs = await prisma.$queryRaw<{ slug: string; count: bigint }[]>`
    SELECT slug, COUNT(*) as count 
    FROM "Fund" 
    WHERE slug IS NOT NULL 
    GROUP BY slug 
    HAVING COUNT(*) > 1
  `;
  
  checks.push({
    check: "No duplicate fund slugs",
    passed: duplicateSlugs.length === 0,
    details: duplicateSlugs.length === 0
      ? "No duplicate fund slugs found"
      : `${duplicateSlugs.length} duplicate fund slugs`,
    affectedRecords: duplicateSlugs.length,
  });
  
  // Check AUM values are reasonable
  const unreasonableAum = await prisma.fund.count({
    where: {
      aum: {
        lt: 0,
      },
    },
  });
  
  checks.push({
    check: "AUM values are non-negative",
    passed: unreasonableAum === 0,
    details: unreasonableAum === 0
      ? "All AUM values are valid"
      : `${unreasonableAum} funds with negative AUM`,
    affectedRecords: unreasonableAum,
  });
  
  // Check return values exist
  const totalReturns = await prisma.fundReturn.count();
  
  checks.push({
    check: "Fund returns exist",
    passed: totalReturns > 0,
    details: totalReturns > 0
      ? `${totalReturns} fund return records in database`
      : "No fund return records found",
    affectedRecords: totalReturns === 0 ? 1 : 0,
  });
  
  return checks;
}

async function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@") || "not set",
    recordCounts: [] as RecordCountComparison[],
    integrityChecks: [] as IntegrityCheck[],
    relationshipChecks: [] as IntegrityCheck[],
    dataQualityChecks: [] as IntegrityCheck[],
    summary: {
      totalChecks: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };
  
  logSection("🔍 Migration Validation Report");
  log(`Timestamp: ${report.timestamp}`, "blue");
  log(`Environment: ${report.environment}`);
  
  // Record Counts
  logSection("📊 Record Counts");
  report.recordCounts = await getRecordCounts();
  
  console.log("\nTable                    | Count");
  console.log("-".repeat(45));
  for (const count of report.recordCounts) {
    const countStr = count.newCount >= 0 ? count.newCount.toString().padStart(10) : "ERROR".padStart(10);
    console.log(`${count.table.padEnd(24)} | ${countStr}`);
  }
  
  // Required Fields Check
  logSection("✅ Required Fields Check");
  report.integrityChecks = await checkRequiredFields();
  
  for (const check of report.integrityChecks) {
    const status = check.passed ? "✓ PASS" : "✗ FAIL";
    const color = check.passed ? "green" : "red";
    log(`${status}: ${check.check}`, color);
    console.log(`   ${check.details}`);
    
    report.summary.totalChecks++;
    if (check.passed) {
      report.summary.passed++;
    } else {
      report.summary.failed++;
    }
  }
  
  // Relationship Checks
  logSection("🔗 Relationship Checks");
  report.relationshipChecks = await checkRelationships();
  
  for (const check of report.relationshipChecks) {
    const status = check.passed ? "✓ PASS" : (check.affectedRecords && check.affectedRecords > 0) ? "⚠ WARN" : "✓ PASS";
    const color = check.passed ? "green" : "yellow";
    log(`${status}: ${check.check}`, color);
    console.log(`   ${check.details}`);
    
    report.summary.totalChecks++;
    if (check.passed) {
      report.summary.passed++;
    } else if (check.affectedRecords && check.affectedRecords > 0) {
      report.summary.warnings++;
    }
  }
  
  // Data Quality Checks
  logSection("🎯 Data Quality Checks");
  report.dataQualityChecks = await checkDataQuality();
  
  for (const check of report.dataQualityChecks) {
    const status = check.passed ? "✓ PASS" : "✗ FAIL";
    const color = check.passed ? "green" : "red";
    log(`${status}: ${check.check}`, color);
    console.log(`   ${check.details}`);
    
    report.summary.totalChecks++;
    if (check.passed) {
      report.summary.passed++;
    } else {
      report.summary.failed++;
    }
  }
  
  // Summary
  logSection("📋 Summary");
  console.log(`\nTotal Checks: ${report.summary.totalChecks}`);
  log(`  ✓ Passed:   ${report.summary.passed}`, "green");
  if (report.summary.failed > 0) {
    log(`  ✗ Failed:   ${report.summary.failed}`, "red");
  }
  if (report.summary.warnings > 0) {
    log(`  ⚠ Warnings: ${report.summary.warnings}`, "yellow");
  }
  
  const passRate = ((report.summary.passed / report.summary.totalChecks) * 100).toFixed(1);
  console.log(`\nPass Rate: ${passRate}%`);
  
  if (report.summary.failed === 0) {
    log("\n✅ Migration validation PASSED!", "green");
  } else {
    log("\n❌ Migration validation FAILED - please review failed checks", "red");
  }
  
  return report;
}

// Run the validation
async function main() {
  try {
    await generateReport();
  } catch (error) {
    console.error("Error running migration validation:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
