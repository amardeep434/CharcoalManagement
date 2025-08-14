import * as XLSX from 'xlsx';
import type { ImportAnalysis, ImportPreview } from '@shared/schema';

// Pattern detection keywords for different data types
const PATTERNS = {
  sales: {
    keywords: ['hotel', 'sale', 'quantity', 'rate', 'amount', 'total', 'customer', 'delivery', 'charcoal'],
    requiredFields: ['hotel', 'quantity', 'rate', 'amount'],
    confidence: 0.8
  },
  purchases: {
    keywords: ['supplier', 'purchase', 'buy', 'quantity', 'rate', 'amount', 'invoice', 'vendor'],
    requiredFields: ['supplier', 'quantity', 'rate', 'amount'],
    confidence: 0.8
  },
  companies: {
    keywords: ['company', 'business', 'organization', 'code', 'contact', 'phone', 'email', 'address'],
    requiredFields: ['name', 'code'],
    confidence: 0.9
  },
  suppliers: {
    keywords: ['supplier', 'vendor', 'provider', 'code', 'contact', 'phone', 'email', 'address'],
    requiredFields: ['name', 'code'],
    confidence: 0.9
  },
  hotels: {
    keywords: ['hotel', 'resort', 'restaurant', 'customer', 'client', 'contact', 'phone', 'email'],
    requiredFields: ['name', 'contact'],
    confidence: 0.9
  },
  payments: {
    keywords: ['payment', 'paid', 'amount', 'date', 'reference', 'transaction', 'receipt'],
    requiredFields: ['amount', 'date'],
    confidence: 0.7
  }
};

// Column mapping rules
const COLUMN_MAPPINGS = {
  // Sales mappings
  hotelName: ['hotel name', 'hotel', 'customer name', 'customer', 'client name', 'client'],
  quantity: ['quantity', 'qty', 'amount', 'kg', 'kilograms', 'weight'],
  ratePerKg: ['rate per kg', 'rate', 'price per kg', 'unit price', 'cost per kg'],
  totalAmount: ['total amount', 'total', 'amount', 'value', 'price', 'cost'],
  date: ['date', 'delivery date', 'sale date', 'transaction date'],
  paymentStatus: ['payment status', 'status', 'payment', 'paid'],
  paymentDate: ['payment date', 'paid date', 'payment received'],
  paymentAmount: ['payment amount', 'paid amount', 'received amount'],
  
  // Company/Supplier/Hotel mappings
  name: ['name', 'company name', 'business name', 'supplier name', 'hotel name'],
  code: ['code', 'company code', 'business code', 'supplier code', 'hotel code', 'id'],
  contactPerson: ['contact person', 'contact', 'representative', 'manager'],
  phone: ['phone', 'mobile', 'contact number', 'telephone'],
  email: ['email', 'email address', 'contact email'],
  address: ['address', 'location', 'full address', 'street address'],
  taxId: ['tax id', 'gst number', 'tax number', 'vat number'],
  
  // Purchase mappings
  supplierName: ['supplier name', 'supplier', 'vendor name', 'vendor'],
  invoiceNumber: ['invoice number', 'invoice', 'bill number', 'reference'],
  
  // General
  notes: ['notes', 'remarks', 'comments', 'description'],
  isActive: ['active', 'status', 'is active', 'enabled']
};

function normalizeColumnName(columnName: string): string {
  return columnName.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

function detectPattern(columns: string[], sampleRows: Record<string, any>[]): { pattern: string; confidence: number; mapping: Record<string, string> } {
  const normalizedColumns = columns.map(normalizeColumnName);
  const scores: Record<string, number> = {};
  const mappings: Record<string, Record<string, string>> = {};

  // Calculate scores for each pattern
  for (const [patternName, pattern] of Object.entries(PATTERNS)) {
    let score = 0;
    const mapping: Record<string, string> = {};

    // Check keyword matches
    for (const keyword of pattern.keywords) {
      const matchCount = normalizedColumns.filter(col => col.includes(keyword)).length;
      score += matchCount * 0.1;
    }

    // Check required field mappings
    let requiredFieldsFound = 0;
    for (const requiredField of pattern.requiredFields) {
      const possibleMappings = COLUMN_MAPPINGS[requiredField as keyof typeof COLUMN_MAPPINGS] || [requiredField];
      
      for (const possibleMapping of possibleMappings) {
        const normalizedMapping = normalizeColumnName(possibleMapping);
        const matchingColumn = normalizedColumns.find(col => col.includes(normalizedMapping));
        
        if (matchingColumn) {
          const originalColumn = columns[normalizedColumns.indexOf(matchingColumn)];
          mapping[requiredField] = originalColumn;
          requiredFieldsFound++;
          break;
        }
      }
    }

    // Boost score based on required fields found
    score += (requiredFieldsFound / pattern.requiredFields.length) * 0.7;

    // Additional mapping for optional fields
    for (const [targetField, possibleColumns] of Object.entries(COLUMN_MAPPINGS)) {
      if (!mapping[targetField]) {
        for (const possibleColumn of possibleColumns) {
          const normalizedPossible = normalizeColumnName(possibleColumn);
          const matchingColumn = normalizedColumns.find(col => col.includes(normalizedPossible));
          
          if (matchingColumn) {
            const originalColumn = columns[normalizedColumns.indexOf(matchingColumn)];
            mapping[targetField] = originalColumn;
            break;
          }
        }
      }
    }

    scores[patternName] = Math.min(score, 1.0);
    mappings[patternName] = mapping;
  }

  // Find the best pattern
  const bestPattern = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  const confidence = scores[bestPattern];

  return {
    pattern: confidence > 0.3 ? bestPattern : 'unknown',
    confidence,
    mapping: mappings[bestPattern] || {}
  };
}

export async function analyzeImportFile(fileBuffer: Buffer, fileName: string): Promise<ImportAnalysis> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const analysis: ImportAnalysis = {
    fileName,
    fileSize: fileBuffer.length,
    sheets: [],
    overallPattern: 'unknown',
    confidence: 0,
    warnings: []
  };

  // Analyze each sheet
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) {
      analysis.warnings.push(`Sheet "${sheetName}" is empty`);
      continue;
    }

    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);
    
    // Get sample rows for analysis
    const sampleRows = dataRows.slice(0, 5).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header] = (row as any[])[index];
      });
      return obj;
    });

    // Detect pattern for this sheet
    const patternDetection = detectPattern(headers, sampleRows);

    analysis.sheets.push({
      name: sheetName,
      rowCount: dataRows.length,
      columnCount: headers.length,
      columns: headers,
      sampleRows,
      detectedPattern: patternDetection.pattern as any,
      confidence: patternDetection.confidence,
      mapping: patternDetection.mapping,
    });
  }

  // Determine overall pattern
  if (analysis.sheets.length === 0) {
    analysis.warnings.push('No valid sheets found in the file');
  } else if (analysis.sheets.length === 1) {
    const sheet = analysis.sheets[0];
    analysis.overallPattern = sheet.detectedPattern as any;
    analysis.confidence = sheet.confidence;
  } else {
    // Multiple sheets - determine if mixed or consistent
    const patterns = analysis.sheets.map(sheet => sheet.detectedPattern);
    const uniquePatterns = Array.from(new Set(patterns.filter(p => p !== 'unknown')));
    
    if (uniquePatterns.length === 0) {
      analysis.overallPattern = 'unknown';
      analysis.confidence = 0;
    } else if (uniquePatterns.length === 1) {
      analysis.overallPattern = uniquePatterns[0] as any;
      analysis.confidence = analysis.sheets.reduce((sum, sheet) => sum + sheet.confidence, 0) / analysis.sheets.length;
    } else {
      analysis.overallPattern = 'mixed';
      analysis.confidence = analysis.sheets.reduce((sum, sheet) => sum + sheet.confidence, 0) / analysis.sheets.length;
    }
  }

  // Add warnings based on analysis
  if (analysis.confidence < 0.5) {
    analysis.warnings.push('Low confidence in pattern detection. Please review the mapping carefully.');
  }

  if (analysis.overallPattern === 'unknown') {
    analysis.warnings.push('Could not automatically detect the data pattern. Manual mapping may be required.');
  }

  return analysis;
}

export async function generateImportPreview(analysis: ImportAnalysis, fileBuffer: Buffer): Promise<ImportPreview> {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const mappedData = [];
  const estimatedChanges = {
    newCompanies: 0,
    newSuppliers: 0,
    newHotels: 0,
    newSales: 0,
    newPurchases: 0,
    newPayments: 0,
  };

  for (const sheetAnalysis of analysis.sheets) {
    const worksheet = workbook.Sheets[sheetAnalysis.name];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const validationErrors: { row: number; errors: string[] }[] = [];
    const sampleMappedRecords = [];
    let validRecords = 0;
    let invalidRecords = 0;

    // Process rows and create mapped data
    for (let i = 0; i < Math.min(jsonData.length, 100); i++) { // Limit to first 100 rows for preview
      const row = jsonData[i] as Record<string, any>;
      const mappedRow: Record<string, any> = {};
      const errors: string[] = [];

      // Map columns based on detected pattern
      for (const [targetField, sourceColumn] of Object.entries(sheetAnalysis.mapping)) {
        if (sourceColumn && row[sourceColumn] !== undefined) {
          mappedRow[targetField] = row[sourceColumn];
        }
      }

      // Validate mapped row based on pattern
      if (sheetAnalysis.detectedPattern === 'sales') {
        if (!mappedRow.hotelName) errors.push('Hotel name is required');
        if (!mappedRow.quantity || mappedRow.quantity <= 0) errors.push('Valid quantity is required');
        if (!mappedRow.ratePerKg || mappedRow.ratePerKg <= 0) errors.push('Valid rate per kg is required');
        if (!mappedRow.totalAmount || mappedRow.totalAmount <= 0) errors.push('Valid total amount is required');
        if (!mappedRow.date) errors.push('Date is required');
      } else if (sheetAnalysis.detectedPattern === 'purchases') {
        if (!mappedRow.supplierName) errors.push('Supplier name is required');
        if (!mappedRow.quantity || mappedRow.quantity <= 0) errors.push('Valid quantity is required');
        if (!mappedRow.ratePerKg || mappedRow.ratePerKg <= 0) errors.push('Valid rate per kg is required');
        if (!mappedRow.totalAmount || mappedRow.totalAmount <= 0) errors.push('Valid total amount is required');
      } else if (sheetAnalysis.detectedPattern === 'companies') {
        if (!mappedRow.name) errors.push('Company name is required');
        if (!mappedRow.code) errors.push('Company code is required');
      }

      if (errors.length > 0) {
        validationErrors.push({ row: i + 1, errors });
        invalidRecords++;
      } else {
        validRecords++;
      }

      // Add to sample records (first 5)
      if (sampleMappedRecords.length < 5) {
        sampleMappedRecords.push(mappedRow);
      }
    }

    // Estimate changes based on pattern
    if (sheetAnalysis.detectedPattern === 'sales') {
      estimatedChanges.newSales = validRecords;
    } else if (sheetAnalysis.detectedPattern === 'purchases') {
      estimatedChanges.newPurchases = validRecords;
    } else if (sheetAnalysis.detectedPattern === 'companies') {
      estimatedChanges.newCompanies = validRecords;
    } else if (sheetAnalysis.detectedPattern === 'suppliers') {
      estimatedChanges.newSuppliers = validRecords;
    } else if (sheetAnalysis.detectedPattern === 'hotels') {
      estimatedChanges.newHotels = validRecords;
    }

    mappedData.push({
      sheetName: sheetAnalysis.name,
      targetTable: sheetAnalysis.detectedPattern,
      recordCount: jsonData.length,
      validRecords,
      invalidRecords,
      sampleMappedRecords,
      validationErrors: validationErrors.slice(0, 10), // Limit to first 10 errors
    });
  }

  return {
    analysis,
    mappedData,
    estimatedChanges,
  };
}