/**
 * Export Utilities
 * Sprint 7: HedgeCo.Net
 *
 * Provides CSV and Excel export functionality for fund data,
 * comparison reports, and other structured data.
 */

// ============================================================
// TYPES
// ============================================================

export interface ExportOptions {
  /** Include BOM for Excel UTF-8 compatibility */
  includeBom?: boolean;
  /** Date format for date values */
  dateFormat?: 'iso' | 'locale' | 'us';
  /** Number decimal places */
  decimalPlaces?: number;
  /** Null value placeholder */
  nullPlaceholder?: string;
}

type ExportValue = string | number | boolean | Date | null | undefined;
type ExportRow = Record<string, ExportValue>;

// ============================================================
// CSV EXPORT
// ============================================================

/**
 * Convert an array of objects to CSV format
 * 
 * @param data - Array of row objects
 * @param options - Export options
 * @returns CSV string
 */
export function exportToCSV<T extends ExportRow>(
  data: T[],
  options: ExportOptions = {}
): string {
  const {
    includeBom = true,
    dateFormat = 'iso',
    decimalPlaces = 2,
    nullPlaceholder = '',
  } = options;

  if (data.length === 0) {
    return '';
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Format value for CSV
  const formatValue = (value: ExportValue): string => {
    if (value === null || value === undefined) {
      return nullPlaceholder;
    }
    
    if (value instanceof Date) {
      switch (dateFormat) {
        case 'locale':
          return value.toLocaleDateString();
        case 'us':
          return value.toLocaleDateString('en-US');
        case 'iso':
        default:
          return value.toISOString().split('T')[0];
      }
    }
    
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value.toString();
      }
      return value.toFixed(decimalPlaces);
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Escape strings for CSV
    const strValue = String(value);
    if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
      return `"${strValue.replace(/"/g, '""')}"`;
    }
    return strValue;
  };

  // Build CSV
  const rows: string[] = [];
  
  // Header row
  rows.push(headers.map(h => formatValue(h)).join(','));
  
  // Data rows
  for (const row of data) {
    const values = headers.map(h => formatValue(row[h]));
    rows.push(values.join(','));
  }
  
  const csv = rows.join('\n');
  
  // Add BOM for Excel UTF-8 compatibility
  return includeBom ? '\ufeff' + csv : csv;
}

/**
 * Parse a CSV string to an array of objects
 * 
 * @param csv - CSV string
 * @returns Array of row objects
 */
export function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n');
  if (lines.length === 0) return [];
  
  // Remove BOM if present
  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1);
  }
  
  const headers = parseCSVLine(headerLine);
  const results: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    
    results.push(row);
  }
  
  return results;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // End of quoted section
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  values.push(current);
  return values;
}

// ============================================================
// EXCEL EXPORT (Simple XLSX without external dependencies)
// ============================================================

/**
 * Generate a simple Excel XML file (SpreadsheetML)
 * This creates an XML-based Excel file that doesn't require external libraries
 * 
 * @param data - Array of row objects or multiple sheets
 * @param options - Export options
 * @returns Excel XML string
 */
export function exportToExcel<T extends ExportRow>(
  data: T[] | { name: string; data: T[] }[],
  options: ExportOptions = {}
): string {
  const {
    dateFormat = 'iso',
    decimalPlaces = 2,
    nullPlaceholder = '',
  } = options;

  // Normalize to sheets format
  const sheets = Array.isArray(data) && !('name' in data[0])
    ? [{ name: 'Sheet1', data: data as T[] }]
    : (data as { name: string; data: T[] }[]);

  const formatValue = (value: ExportValue): { type: string; value: string } => {
    if (value === null || value === undefined) {
      return { type: 'String', value: nullPlaceholder };
    }
    
    if (value instanceof Date) {
      return { type: 'String', value: value.toISOString().split('T')[0] };
    }
    
    if (typeof value === 'number') {
      return { 
        type: 'Number', 
        value: Number.isInteger(value) ? value.toString() : value.toFixed(decimalPlaces) 
      };
    }
    
    if (typeof value === 'boolean') {
      return { type: 'String', value: value ? 'Yes' : 'No' };
    }
    
    return { type: 'String', value: escapeXml(String(value)) };
  };

  // Build Excel XML
  const worksheets = sheets.map(sheet => {
    if (sheet.data.length === 0) {
      return `<Worksheet ss:Name="${escapeXml(sheet.name)}"><Table></Table></Worksheet>`;
    }

    const headers = Object.keys(sheet.data[0]);
    
    // Header row
    const headerRow = `<Row>${headers.map(h => 
      `<Cell><Data ss:Type="String"><B>${escapeXml(h)}</B></Data></Cell>`
    ).join('')}</Row>`;
    
    // Data rows
    const dataRows = sheet.data.map(row => {
      const cells = headers.map(h => {
        const { type, value } = formatValue(row[h]);
        return `<Cell><Data ss:Type="${type}">${value}</Data></Cell>`;
      }).join('');
      return `<Row>${cells}</Row>`;
    }).join('\n');

    return `
      <Worksheet ss:Name="${escapeXml(sheet.name)}">
        <Table>
          ${headerRow}
          ${dataRows}
        </Table>
      </Worksheet>
    `;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
    </Style>
  </Styles>
  ${worksheets}
</Workbook>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================
// DOWNLOAD HELPERS (Client-side)
// ============================================================

/**
 * Create a downloadable blob from data
 * For use in client-side code
 */
export function createDownloadBlob(
  content: string,
  mimeType: string
): Blob {
  return new Blob([content], { type: mimeType });
}

/**
 * Trigger download of a blob
 * For use in client-side code
 */
export function triggerDownload(
  blob: Blob,
  filename: string
): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export and download CSV (client-side convenience function)
 */
export function downloadCSV<T extends ExportRow>(
  data: T[],
  filename: string,
  options?: ExportOptions
): void {
  const csv = exportToCSV(data, options);
  const blob = createDownloadBlob(csv, 'text/csv;charset=utf-8');
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * Export and download Excel (client-side convenience function)
 */
export function downloadExcel<T extends ExportRow>(
  data: T[] | { name: string; data: T[] }[],
  filename: string,
  options?: ExportOptions
): void {
  const xml = exportToExcel(data, options);
  const blob = createDownloadBlob(xml, 'application/vnd.ms-excel');
  triggerDownload(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);
}

// ============================================================
// SPECIALIZED EXPORT FUNCTIONS
// ============================================================

/**
 * Export fund comparison data to CSV
 */
export function exportComparisonToCSV(
  comparison: {
    funds: {
      fundId: string;
      fundName: string;
      metrics: Record<string, number | null>;
    }[];
    correlationMatrix?: number[][];
    insights?: string[];
  },
  options?: ExportOptions
): string {
  const rows = comparison.funds.map(fund => {
    const row: Record<string, ExportValue> = {
      'Fund ID': fund.fundId,
      'Fund Name': fund.fundName,
    };
    
    // Add all metrics
    for (const [key, value] of Object.entries(fund.metrics)) {
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      row[formattedKey] = value;
    }
    
    return row;
  });

  return exportToCSV(rows, options);
}

/**
 * Export monthly returns to CSV
 */
export function exportReturnsToCSV(
  returns: {
    fundName: string;
    year: number;
    month: number;
    value: number;
  }[],
  options?: ExportOptions
): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const rows = returns.map(r => ({
    Fund: r.fundName,
    Year: r.year,
    Month: monthNames[r.month - 1],
    'Return (%)': r.value,
  }));

  return exportToCSV(rows, options);
}

/**
 * Export correlation matrix to CSV
 */
export function exportCorrelationMatrixToCSV(
  matrix: number[][],
  fundNames: string[],
  options?: ExportOptions
): string {
  const rows = matrix.map((row, i) => {
    const rowData: Record<string, ExportValue> = {
      Fund: fundNames[i],
    };
    
    row.forEach((value, j) => {
      rowData[fundNames[j]] = value;
    });
    
    return rowData;
  });

  return exportToCSV(rows, {
    ...options,
    decimalPlaces: 3,
  });
}
