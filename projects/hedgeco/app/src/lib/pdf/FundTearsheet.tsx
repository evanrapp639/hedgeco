// Professional Fund Tearsheet PDF Template
// Inspired by Bloomberg/Morningstar fund factsheets

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { formatCurrency, formatPercent, formatDate } from '../pdf';

// Professional color palette
const colors = {
  primary: '#1a365d',      // Deep navy
  secondary: '#2c5282',    // Medium blue
  accent: '#4299e1',       // Light blue
  success: '#38a169',      // Green
  danger: '#e53e3e',       // Red
  text: '#1a202c',         // Dark gray
  textLight: '#718096',    // Medium gray
  border: '#e2e8f0',       // Light gray
  background: '#f7fafc',   // Off white
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.text,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerLeft: {
    flex: 1,
  },
  fundName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  fundStrategy: {
    fontSize: 12,
    color: colors.secondary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 8,
    color: colors.textLight,
  },
  dateValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  // Key Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  statBox: {
    width: '25%',
    padding: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 8,
    color: colors.textLight,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  statValuePositive: {
    color: colors.success,
  },
  statValueNegative: {
    color: colors.danger,
  },
  // Fund Overview
  overviewGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  overviewColumn: {
    flex: 1,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  overviewLabel: {
    fontSize: 9,
    color: colors.textLight,
  },
  overviewValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  // Monthly Returns Table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textAlign: 'center',
  },
  tableHeaderCellFirst: {
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: colors.background,
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
    textAlign: 'center',
  },
  tableCellFirst: {
    fontFamily: 'Helvetica-Bold',
    textAlign: 'left',
  },
  tableCellPositive: {
    color: colors.success,
  },
  tableCellNegative: {
    color: colors.danger,
  },
  // Performance Chart Placeholder
  chartPlaceholder: {
    height: 150,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartText: {
    fontSize: 10,
    color: colors.textLight,
  },
  // Description
  description: {
    fontSize: 9,
    lineHeight: 1.5,
    color: colors.text,
  },
  // Contact / Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactSection: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 8,
    color: colors.textLight,
    lineHeight: 1.4,
  },
  disclaimer: {
    flex: 2,
    paddingLeft: 20,
  },
  disclaimerText: {
    fontSize: 7,
    color: colors.textLight,
    lineHeight: 1.4,
  },
});

// Type definitions
export interface FundData {
  id: string;
  name: string;
  strategy: string;
  description?: string;
  inceptionDate: Date;
  aum?: number;
  minimumInvestment?: number;
  managementFee?: number;
  performanceFee?: number;
  lockupPeriod?: string;
  redemptionNotice?: string;
}

export interface PerformanceData {
  ytd: number;
  mtd: number;
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
  sinceInception: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  volatility?: number;
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
}

export interface ContactInfo {
  firmName: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface FundTearsheetProps {
  fund: FundData;
  performance: PerformanceData;
  monthlyReturns: MonthlyReturn[];
  contact: ContactInfo;
  asOfDate: Date;
}

// Helper to get return color style
const getReturnStyle = (value: number | undefined) => {
  if (value === undefined || value === null) return {};
  return value >= 0 ? styles.statValuePositive : styles.statValueNegative;
};

const getTableCellStyle = (value: number | undefined) => {
  if (value === undefined || value === null) return {};
  return value >= 0 ? styles.tableCellPositive : styles.tableCellNegative;
};

// Stat Box Component
const StatBox: React.FC<{ label: string; value: string; isReturn?: boolean; rawValue?: number }> = ({
  label,
  value,
  isReturn = false,
  rawValue,
}) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, isReturn && rawValue !== undefined ? getReturnStyle(rawValue) : {}]}>
      {value}
    </Text>
  </View>
);

// Overview Row Component
const OverviewRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.overviewRow}>
    <Text style={styles.overviewLabel}>{label}</Text>
    <Text style={styles.overviewValue}>{value}</Text>
  </View>
);

// Main Tearsheet Document
export const FundTearsheet: React.FC<FundTearsheetProps> = ({
  fund,
  performance,
  monthlyReturns,
  contact,
  asOfDate,
}) => {
  // Organize monthly returns by year
  const returnsByYear = monthlyReturns.reduce((acc, ret) => {
    if (!acc[ret.year]) {
      acc[ret.year] = {};
    }
    acc[ret.year][ret.month] = ret.return;
    return acc;
  }, {} as Record<number, Record<number, number>>);

  const years = Object.keys(returnsByYear)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 5); // Last 5 years

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Calculate year totals
  const yearTotals: Record<number, number> = {};
  years.forEach((year) => {
    const yearReturns = Object.values(returnsByYear[year] || {});
    if (yearReturns.length > 0) {
      // Compound returns
      yearTotals[year] =
        (yearReturns.reduce((acc, r) => acc * (1 + r / 100), 1) - 1) * 100;
    }
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.fundName}>{fund.name}</Text>
            <Text style={styles.fundStrategy}>{fund.strategy}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateLabel}>AS OF</Text>
            <Text style={styles.dateValue}>{formatDate(asOfDate)}</Text>
          </View>
        </View>

        {/* Key Performance Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          <View style={styles.statsGrid}>
            <StatBox label="MTD" value={formatPercent(performance.mtd)} isReturn rawValue={performance.mtd} />
            <StatBox label="YTD" value={formatPercent(performance.ytd)} isReturn rawValue={performance.ytd} />
            <StatBox
              label="1 Year"
              value={performance.oneYear !== undefined ? formatPercent(performance.oneYear) : 'N/A'}
              isReturn
              rawValue={performance.oneYear}
            />
            <StatBox
              label="Since Inception"
              value={formatPercent(performance.sinceInception)}
              isReturn
              rawValue={performance.sinceInception}
            />
            <StatBox
              label="Sharpe Ratio"
              value={performance.sharpeRatio?.toFixed(2) ?? 'N/A'}
            />
            <StatBox
              label="Max Drawdown"
              value={performance.maxDrawdown !== undefined ? formatPercent(performance.maxDrawdown) : 'N/A'}
              isReturn
              rawValue={performance.maxDrawdown}
            />
            <StatBox
              label="Volatility"
              value={performance.volatility !== undefined ? formatPercent(performance.volatility) : 'N/A'}
            />
            <StatBox
              label="AUM"
              value={fund.aum ? formatCurrency(fund.aum) : 'N/A'}
            />
          </View>
        </View>

        {/* Fund Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fund Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewColumn}>
              <OverviewRow label="Inception Date" value={formatDate(fund.inceptionDate)} />
              <OverviewRow label="Strategy" value={fund.strategy} />
              <OverviewRow
                label="Minimum Investment"
                value={fund.minimumInvestment ? formatCurrency(fund.minimumInvestment) : 'Contact us'}
              />
              <OverviewRow label="Lockup Period" value={fund.lockupPeriod ?? 'None'} />
            </View>
            <View style={styles.overviewColumn}>
              <OverviewRow
                label="Management Fee"
                value={fund.managementFee ? `${fund.managementFee}%` : 'N/A'}
              />
              <OverviewRow
                label="Performance Fee"
                value={fund.performanceFee ? `${fund.performanceFee}%` : 'N/A'}
              />
              <OverviewRow label="Redemption Notice" value={fund.redemptionNotice ?? 'N/A'} />
              <OverviewRow label="AUM" value={fund.aum ? formatCurrency(fund.aum) : 'N/A'} />
            </View>
          </View>
          {fund.description && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.description}>{fund.description}</Text>
            </View>
          )}
        </View>

        {/* Performance Chart Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cumulative Performance</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartText}>Performance chart - See interactive dashboard</Text>
          </View>
        </View>

        {/* Monthly Returns Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Returns (%)</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCellFirst]}>Year</Text>
              {months.map((month) => (
                <Text key={month} style={styles.tableHeaderCell}>
                  {month}
                </Text>
              ))}
              <Text style={styles.tableHeaderCell}>YTD</Text>
            </View>
            {/* Rows */}
            {years.map((year, idx) => (
              <View key={year} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, styles.tableCellFirst]}>{year}</Text>
                {months.map((_, monthIdx) => {
                  const ret = returnsByYear[year]?.[monthIdx + 1];
                  return (
                    <Text
                      key={monthIdx}
                      style={[styles.tableCell, getTableCellStyle(ret)]}
                    >
                      {ret !== undefined ? ret.toFixed(1) : '-'}
                    </Text>
                  );
                })}
                <Text style={[styles.tableCell, getTableCellStyle(yearTotals[year])]}>
                  {yearTotals[year] !== undefined ? yearTotals[year].toFixed(1) : '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer / Contact */}
        <View style={styles.footer}>
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>{contact.firmName}</Text>
            <Text style={styles.contactText}>
              {contact.address && `${contact.address}\n`}
              {contact.phone && `Tel: ${contact.phone}\n`}
              {contact.email && `${contact.email}\n`}
              {contact.website && contact.website}
            </Text>
          </View>
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              Past performance is not indicative of future results. This document is for informational
              purposes only and does not constitute an offer to sell or a solicitation to buy any
              securities. Investment involves risk including possible loss of principal. Investors should
              carefully review the fund&apos;s offering documents before investing.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default FundTearsheet;
