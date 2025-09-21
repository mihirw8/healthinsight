/**
 * Lab Report Parser Utility
 * 
 * This module handles parsing of different lab report formats (PDF, CSV, JSON)
 * and extracts structured biomarker data.
 */

const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { normalizeBiomarker } = require('./normalizer');

/**
 * Main parser function that detects format and routes to appropriate parser
 * @param {Buffer} fileBuffer - The file buffer to parse
 * @param {string} fileType - The MIME type of the file
 * @param {object} options - Additional parsing options
 * @returns {Promise<object>} Parsed lab report data
 */
async function parseLabReport(fileBuffer, fileType, options = {}) {
  try {
    let parsedData;
    
    switch (fileType) {
      case 'application/pdf':
        parsedData = await parsePdfReport(fileBuffer, options);
        break;
      case 'text/csv':
        parsedData = await parseCsvReport(fileBuffer, options);
        break;
      case 'application/json':
        parsedData = parseJsonReport(fileBuffer, options);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Normalize the biomarker data
    if (parsedData.biomarkers && Array.isArray(parsedData.biomarkers)) {
      parsedData.biomarkers = parsedData.biomarkers.map(biomarker => 
        normalizeBiomarker(biomarker, options.demographics)
      );
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error parsing lab report:', error);
    throw new Error(`Failed to parse lab report: ${error.message}`);
  }
}

/**
 * Parses PDF lab reports
 * @param {Buffer} buffer - The PDF file buffer
 * @param {object} options - Parsing options
 * @returns {Promise<object>} Parsed lab data
 */
async function parsePdfReport(buffer, options = {}) {
  try {
    const data = await pdfParse(buffer);
    return extractLabDataFromText(data.text, options);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Parses CSV lab reports
 * @param {Buffer} buffer - The CSV file buffer
 * @param {object} options - Parsing options
 * @returns {Promise<object>} Parsed lab data
 */
async function parseCsvReport(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const results = [];
    const readableStream = Readable.from(buffer.toString());
    
    readableStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        try {
          const parsedData = processCsvData(results, options);
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => reject(error));
  });
}

/**
 * Parses JSON lab reports
 * @param {Buffer} buffer - The JSON file buffer
 * @param {object} options - Parsing options
 * @returns {object} Parsed lab data
 */
function parseJsonReport(buffer, options = {}) {
  try {
    const jsonData = JSON.parse(buffer.toString());
    return processJsonData(jsonData, options);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Failed to parse JSON file');
  }
}

/**
 * Processes CSV data into structured format
 * @param {Array} csvRows - Array of CSV row objects
 * @param {object} options - Processing options
 * @returns {object} Structured lab data
 */
function processCsvData(csvRows, options = {}) {
  // Detect CSV format
  const firstRow = csvRows[0] || {};
  const headers = Object.keys(firstRow);
  
  // Check for common CSV formats
  if (headers.includes('Test') && headers.includes('Result') && headers.includes('Units')) {
    // Standard format
    return processStandardCsvFormat(csvRows);
  } else if (headers.includes('test_name') && headers.includes('value')) {
    // Alternative format
    return processAlternativeCsvFormat(csvRows);
  } else {
    // Try generic approach
    return processGenericCsvFormat(csvRows);
  }
}

/**
 * Process standard CSV format
 * @param {Array} rows - CSV rows
 * @returns {object} Structured lab data
 */
function processStandardCsvFormat(rows) {
  const biomarkers = [];
  let collectionDate = null;
  let reportType = 'Unknown';
  
  // Look for metadata in the first few rows
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    if (row.Date || row.CollectionDate) {
      collectionDate = new Date(row.Date || row.CollectionDate);
    }
    if (row.Panel || row.ReportType) {
      reportType = row.Panel || row.ReportType;
    }
  }
  
  // Process biomarker rows
  rows.forEach(row => {
    if (row.Test && row.Result) {
      const biomarker = {
        name: row.Test,
        value: parseFloat(row.Result) || 0,
        unit: row.Units || '',
        referenceMin: parseFloat(row['Reference Low'] || row['Ref Low'] || row['Range Low'] || 0) || null,
        referenceMax: parseFloat(row['Reference High'] || row['Ref High'] || row['Range High'] || 0) || null
      };
      
      // Only add if we have a valid numeric value
      if (!isNaN(biomarker.value)) {
        biomarkers.push(biomarker);
      }
    }
  });
  
  return {
    biomarkers,
    collectionDate: collectionDate || new Date(),
    reportType
  };
}

/**
 * Process alternative CSV format
 * @param {Array} rows - CSV rows
 * @returns {object} Structured lab data
 */
function processAlternativeCsvFormat(rows) {
  const biomarkers = [];
  let collectionDate = null;
  let reportType = 'Unknown';
  
  // Extract metadata
  const metadataRow = rows.find(row => row.collection_date || row.report_type);
  if (metadataRow) {
    if (metadataRow.collection_date) {
      collectionDate = new Date(metadataRow.collection_date);
    }
    if (metadataRow.report_type) {
      reportType = metadataRow.report_type;
    }
  }
  
  // Process biomarker rows
  rows.forEach(row => {
    if (row.test_name && row.value) {
      const biomarker = {
        name: row.test_name,
        value: parseFloat(row.value) || 0,
        unit: row.unit || '',
        referenceMin: parseFloat(row.reference_low || row.ref_low || 0) || null,
        referenceMax: parseFloat(row.reference_high || row.ref_high || 0) || null
      };
      
      // Only add if we have a valid numeric value
      if (!isNaN(biomarker.value)) {
        biomarkers.push(biomarker);
      }
    }
  });
  
  return {
    biomarkers,
    collectionDate: collectionDate || new Date(),
    reportType
  };
}

/**
 * Process generic CSV format by trying to detect columns
 * @param {Array} rows - CSV rows
 * @returns {object} Structured lab data
 */
function processGenericCsvFormat(rows) {
  const biomarkers = [];
  let collectionDate = null;
  let reportType = 'Unknown';
  
  // Try to identify column names
  const firstRow = rows[0] || {};
  const headers = Object.keys(firstRow);
  
  // Map possible column names
  const nameColumn = headers.find(h => 
    /name|test|parameter|analyte/i.test(h)
  );
  
  const valueColumn = headers.find(h => 
    /value|result|measurement/i.test(h)
  );
  
  const unitColumn = headers.find(h => 
    /unit|uom/i.test(h)
  );
  
  const minColumn = headers.find(h => 
    /min|low|lower|reference.*low/i.test(h)
  );
  
  const maxColumn = headers.find(h => 
    /max|high|upper|reference.*high/i.test(h)
  );
  
  const dateColumn = headers.find(h => 
    /date|collected|drawn/i.test(h)
  );
  
  // Extract collection date if available
  if (dateColumn && rows[0][dateColumn]) {
    collectionDate = new Date(rows[0][dateColumn]);
  }
  
  // Process rows
  rows.forEach(row => {
    if (nameColumn && valueColumn && row[nameColumn] && row[valueColumn]) {
      const biomarker = {
        name: row[nameColumn],
        value: parseFloat(row[valueColumn]) || 0,
        unit: unitColumn ? (row[unitColumn] || '') : '',
        referenceMin: minColumn ? (parseFloat(row[minColumn]) || null) : null,
        referenceMax: maxColumn ? (parseFloat(row[maxColumn]) || null) : null
      };
      
      // Only add if we have a valid numeric value
      if (!isNaN(biomarker.value)) {
        biomarkers.push(biomarker);
      }
    }
  });
  
  return {
    biomarkers,
    collectionDate: collectionDate || new Date(),
    reportType
  };
}

/**
 * Process JSON data into structured format
 * @param {object} jsonData - Parsed JSON data
 * @param {object} options - Processing options
 * @returns {object} Structured lab data
 */
function processJsonData(jsonData, options = {}) {
  // Handle different JSON formats
  
  // Format 1: Array of biomarkers
  if (Array.isArray(jsonData)) {
    return {
      biomarkers: jsonData.map(item => ({
        name: item.name || item.test || item.testName || '',
        value: parseFloat(item.value || item.result || 0) || 0,
        unit: item.unit || item.units || '',
        referenceMin: parseFloat(item.referenceMin || item.refLow || item.rangeMin || 0) || null,
        referenceMax: parseFloat(item.referenceMax || item.refHigh || item.rangeMax || 0) || null
      })).filter(b => !isNaN(b.value) && b.name),
      collectionDate: options.collectionDate || new Date(),
      reportType: options.reportType || 'Unknown'
    };
  }
  
  // Format 2: Object with metadata and results array
  if (jsonData.results && Array.isArray(jsonData.results)) {
    return {
      biomarkers: jsonData.results.map(item => ({
        name: item.name || item.test || item.testName || '',
        value: parseFloat(item.value || item.result || 0) || 0,
        unit: item.unit || item.units || '',
        referenceMin: parseFloat(item.referenceMin || item.refLow || item.rangeMin || 0) || null,
        referenceMax: parseFloat(item.referenceMax || item.refHigh || item.rangeMax || 0) || null
      })).filter(b => !isNaN(b.value) && b.name),
      collectionDate: new Date(jsonData.collectionDate || jsonData.date || options.collectionDate || new Date()),
      reportType: jsonData.reportType || jsonData.panel || options.reportType || 'Unknown'
    };
  }
  
  // Format 3: Object with biomarkers as properties
  const biomarkers = [];
  for (const [key, value] of Object.entries(jsonData)) {
    if (typeof value === 'object' && value !== null) {
      biomarkers.push({
        name: key,
        value: parseFloat(value.value || value.result || 0) || 0,
        unit: value.unit || value.units || '',
        referenceMin: parseFloat(value.referenceMin || value.refLow || value.rangeMin || 0) || null,
        referenceMax: parseFloat(value.referenceMax || value.refHigh || value.rangeMax || 0) || null
      });
    }
  }
  
  if (biomarkers.length > 0) {
    return {
      biomarkers: biomarkers.filter(b => !isNaN(b.value)),
      collectionDate: options.collectionDate || new Date(),
      reportType: options.reportType || 'Unknown'
    };
  }
  
  // If we can't determine the format, return empty data
  return {
    biomarkers: [],
    collectionDate: new Date(),
    reportType: 'Unknown',
    error: 'Unrecognized JSON format'
  };
}

/**
 * Extracts structured lab data from text content
 * @param {string} text - The text content from a PDF
 * @param {object} options - Extraction options
 * @returns {object} Structured lab data
 */
function extractLabDataFromText(text, options = {}) {
  const biomarkers = [];
  let collectionDate = null;
  let reportType = 'Unknown';
  
  // Try to extract collection date
  const dateMatch = text.match(/(?:Collection Date|Date Collected|Date|Drawn):\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/i);
  if (dateMatch && dateMatch[1]) {
    collectionDate = new Date(dateMatch[1]);
  }
  
  // Try to extract report type
  const reportMatch = text.match(/(?:Panel|Report Type|Test):\s*([A-Za-z\s]+)/i);
  if (reportMatch && reportMatch[1]) {
    reportType = reportMatch[1].trim();
  }
  
  // Common biomarker patterns
  const biomarkerPatterns = [
    // Pattern 1: Name Result Units Range
    /([A-Za-z\s\-]+)[\s:]+(\d+\.?\d*)[\s]+([\w\/]+)[\s]+(?:Reference Range|Normal Range|Range)[\s:]+(\d+\.?\d*)[\s\-]+(\d+\.?\d*)/g,
    
    // Pattern 2: Name: Result Units (Range)
    /([A-Za-z\s\-]+)[\s:]+(\d+\.?\d*)[\s]+([\w\/]+)[\s]+\((?:Reference|Normal)?[\s:]*(\d+\.?\d*)[\s\-]+(\d+\.?\d*)\)/g,
    
    // Pattern 3: Name Result Units
    /([A-Za-z\s\-]+)[\s:]+(\d+\.?\d*)[\s]+([\w\/]+)/g
  ];
  
  // Extract biomarkers using patterns
  for (const pattern of biomarkerPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const [_, name, value, unit, min, max] = match;
      
      biomarkers.push({
        name: name.trim(),
        value: parseFloat(value),
        unit: unit,
        referenceMin: min ? parseFloat(min) : null,
        referenceMax: max ? parseFloat(max) : null
      });
    }
    
    // If we found biomarkers with this pattern, stop trying others
    if (biomarkers.length > 0) break;
  }
  
  // If no biomarkers found with patterns, try line-by-line approach
  if (biomarkers.length === 0) {
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Try to match a biomarker line
      const lineMatch = line.match(/^([A-Za-z\s\-]+)[\s:]+(\d+\.?\d*)[\s]+([\w\/]+)/);
      if (lineMatch) {
        const [_, name, value, unit] = lineMatch;
        
        // Look for reference range in the next line
        let referenceMin = null;
        let referenceMax = null;
        
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const rangeMatch = nextLine.match(/(?:Reference|Normal)[\s:]+(\d+\.?\d*)[\s\-]+(\d+\.?\d*)/i);
          
          if (rangeMatch) {
            referenceMin = parseFloat(rangeMatch[1]);
            referenceMax = parseFloat(rangeMatch[2]);
            i++; // Skip the next line since we've processed it
          }
        }
        
        biomarkers.push({
          name: name.trim(),
          value: parseFloat(value),
          unit: unit,
          referenceMin,
          referenceMax
        });
      }
    }
  }
  
  return {
    biomarkers,
    collectionDate: collectionDate || new Date(),
    reportType
  };
}

module.exports = {
  parseLabReport,
  parsePdfReport,
  parseCsvReport,
  parseJsonReport
};