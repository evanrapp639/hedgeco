// PDF Generation Service
// Uses @react-pdf/renderer for server-side PDF generation

import ReactPDF from '@react-pdf/renderer';

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
