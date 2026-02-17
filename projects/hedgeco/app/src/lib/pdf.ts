// PDF Generation Service
// Uses @react-pdf/renderer for server-side PDF generation

import ReactPDF, { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

export interface PDFGeneratorOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
}

/**
 * Generate a PDF buffer from a React PDF document
 */
export async function generatePDFBuffer(
  document: React.ReactElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: PDFGeneratorOptions
): Promise<Buffer> {
  const pdfStream = await ReactPDF.renderToStream(document);
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
    pdfStream.on('error', reject);
  });
}

/**
 * Generate a PDF and return as base64 string (useful for API responses)
 */
export async function generatePDFBase64(
  document: React.ReactElement,
  options?: PDFGeneratorOptions
): Promise<string> {
  const buffer = await generatePDFBuffer(document, options);
  return buffer.toString('base64');
}

// ============================================================
// COMPARISON PDF STYLES
// ============================================================

const comparisonStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0ea5e9',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
    backgroundColor: '#f1f5f9',
    padding: 8,
  },
  table: {
    display: 'flex',
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 8,
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  metricLabel: {
    flex: 1.5,
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  positiveValue: {
    color: '#16a34a',
  },
  negativeValue: {
    color: '#dc2626',
  },
  insightBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  insightText: {
    fontSize: 9,
    color: '#334155',
  },
  correlationMatrix: {
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
});

// ============================================================
// COMPARISON PDF TYPES
// ============================================================

interface ComparisonReportData {
  generatedAt: Date;
  funds: {
    fundId: string;
    fundName: string;
    metrics: {
      ytdReturn?: number | null;
      oneYearReturn?: number | null;
      threeYearReturn?: number | null;
      fiveYearReturn?: number | null;
      cagr?: number | null;
      volatility?: number | null;
      maxDrawdown?: number | null;
      sharpeRatio?: number | null;
      sortinoRatio?: number | null;
      aum?: number | null;
      managementFee?: number | null;
      performanceFee?: number | null;
    };
  }[];
  correlationMatrix?: number[][];
  insights?: string[];
}

// ============================================================
// COMPARISON PDF COMPONENT
// ============================================================

/**
 * Generate a comparison PDF document element
 */
export function generateComparisonPDF(data: ComparisonReportData): React.ReactElement {
  const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    const pct = value * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  };

  const formatNumber = (value: number | null | undefined, decimals = 2): string => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(decimals);
  };

  const formatAUM = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
    return `$${value.toLocaleString()}`;
  };

  const getValueStyle = (value: number | null | undefined) => {
    if (value === null || value === undefined) return {};
    return value >= 0 ? comparisonStyles.positiveValue : comparisonStyles.negativeValue;
  };

  const metrics = [
    { key: 'ytdReturn', label: 'YTD Return', format: formatPercent },
    { key: 'oneYearReturn', label: '1 Year Return', format: formatPercent },
    { key: 'threeYearReturn', label: '3 Year Return', format: formatPercent },
    { key: 'fiveYearReturn', label: '5 Year Return', format: formatPercent },
    { key: 'cagr', label: 'CAGR', format: formatPercent },
    { key: 'volatility', label: 'Volatility', format: formatPercent },
    { key: 'maxDrawdown', label: 'Max Drawdown', format: formatPercent },
    { key: 'sharpeRatio', label: 'Sharpe Ratio', format: formatNumber },
    { key: 'sortinoRatio', label: 'Sortino Ratio', format: formatNumber },
    { key: 'aum', label: 'AUM', format: formatAUM },
    { key: 'managementFee', label: 'Mgmt Fee', format: formatPercent },
    { key: 'performanceFee', label: 'Perf Fee', format: formatPercent },
  ];

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: comparisonStyles.page },
      // Header
      React.createElement(
        View,
        { style: comparisonStyles.header },
        React.createElement(Text, { style: comparisonStyles.title }, 'Fund Comparison Report'),
        React.createElement(
          Text,
          { style: comparisonStyles.subtitle },
          `Generated on ${data.generatedAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })} • ${data.funds.length} funds compared`
        )
      ),

      // Metrics Comparison Table
      React.createElement(
        View,
        { style: comparisonStyles.section },
        React.createElement(Text, { style: comparisonStyles.sectionTitle }, 'Performance Metrics'),
        React.createElement(
          View,
          { style: comparisonStyles.table },
          // Header row
          React.createElement(
            View,
            { style: comparisonStyles.tableHeaderRow },
            React.createElement(Text, { style: [comparisonStyles.tableHeaderCell, { flex: 1.5 }] }, 'Metric'),
            ...data.funds.map((fund) =>
              React.createElement(
                Text,
                { key: fund.fundId, style: comparisonStyles.tableHeaderCell },
                fund.fundName.length > 15 ? fund.fundName.slice(0, 12) + '...' : fund.fundName
              )
            )
          ),
          // Data rows
          ...metrics.map((metric) =>
            React.createElement(
              View,
              { key: metric.key, style: comparisonStyles.tableRow },
              React.createElement(Text, { style: comparisonStyles.metricLabel }, metric.label),
              ...data.funds.map((fund) => {
                const value = (fund.metrics as Record<string, number | null | undefined>)[metric.key];
                return React.createElement(
                  Text,
                  {
                    key: `${fund.fundId}-${metric.key}`,
                    style: [comparisonStyles.tableCell, getValueStyle(value)],
                  },
                  metric.format(value)
                );
              })
            )
          )
        )
      ),

      // Correlation Matrix (if available)
      data.correlationMatrix && data.correlationMatrix.length > 0
        ? React.createElement(
            View,
            { style: comparisonStyles.section },
            React.createElement(Text, { style: comparisonStyles.sectionTitle }, 'Correlation Matrix'),
            React.createElement(
              View,
              { style: comparisonStyles.table },
              // Header
              React.createElement(
                View,
                { style: comparisonStyles.tableHeaderRow },
                React.createElement(Text, { style: [comparisonStyles.tableHeaderCell, { flex: 1.5 }] }, ''),
                ...data.funds.map((fund) =>
                  React.createElement(
                    Text,
                    { key: fund.fundId, style: comparisonStyles.tableHeaderCell },
                    fund.fundName.slice(0, 8)
                  )
                )
              ),
              // Matrix rows
              ...data.correlationMatrix.map((row, i) =>
                React.createElement(
                  View,
                  { key: i, style: comparisonStyles.tableRow },
                  React.createElement(
                    Text,
                    { style: comparisonStyles.metricLabel },
                    data.funds[i]?.fundName.slice(0, 12) || ''
                  ),
                  ...row.map((corr, j) =>
                    React.createElement(
                      Text,
                      { key: j, style: comparisonStyles.tableCell },
                      corr.toFixed(2)
                    )
                  )
                )
              )
            )
          )
        : null,

      // Insights
      data.insights && data.insights.length > 0
        ? React.createElement(
            View,
            { style: comparisonStyles.section },
            React.createElement(Text, { style: comparisonStyles.sectionTitle }, 'Key Insights'),
            ...data.insights.map((insight, i) =>
              React.createElement(
                View,
                { key: i, style: comparisonStyles.insightBox },
                React.createElement(Text, { style: comparisonStyles.insightText }, `• ${insight}`)
              )
            )
          )
        : null,

      // Footer
      React.createElement(
        Text,
        { style: comparisonStyles.footer },
        'HedgeCo.Net • This report is for informational purposes only and does not constitute investment advice.'
      )
    )
  );
}

/**
 * Format currency for display in PDFs
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for display in PDFs
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format date for display in PDFs
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format month/year for display in PDFs
 */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
  }).format(date);
}
