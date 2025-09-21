const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Helper function to parse PDF files
const parsePdfReport = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    // Implement PDF parsing logic here
    return extractLabData(data.text);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
};

// Helper function to parse CSV files
const parseCsvReport = async (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const readableStream = Readable.from(buffer.toString());
    
    readableStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Helper function to extract structured lab data
const extractLabData = (text) => {
  // Implement extraction logic based on common lab report formats
  // This is a placeholder for the actual implementation
  const biomarkers = [];
  
  // Example pattern matching for common lab tests
  const patterns = [
    { name: 'Hemoglobin', regex: /Hemoglobin[:\s]+(\d+\.?\d*)\s*(\w+\/\w+)/i },
    { name: 'Glucose', regex: /Glucose[:\s]+(\d+\.?\d*)\s*(\w+\/\w+)/i },
    { name: 'Cholesterol', regex: /Cholesterol[:\s]+(\d+\.?\d*)\s*(\w+\/\w+)/i },
    // Add more patterns for other common tests
  ];
  
  patterns.forEach(pattern => {
    const match = text.match(pattern.regex);
    if (match) {
      biomarkers.push({
        name: pattern.name,
        value: parseFloat(match[1]),
        unit: match[2]
      });
    }
  });
  
  return {
    biomarkers,
    collectionDate: new Date(), // Extract actual date from report
    reportType: 'Unknown' // Determine report type from content
  };
};

// Controller methods
exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let reportData;
    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;

    // Parse file based on type
    if (fileType === 'application/pdf') {
      reportData = await parsePdfReport(fileBuffer);
    } else if (fileType === 'text/csv') {
      reportData = await parseCsvReport(fileBuffer);
    } else if (fileType === 'application/json') {
      reportData = JSON.parse(fileBuffer.toString());
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Create health report in database
    const healthReport = await prisma.healthReport.create({
      data: {
        userId,
        reportType: reportData.reportType,
        collectionDate: reportData.collectionDate,
        biomarkers: {
          create: reportData.biomarkers.map(biomarker => ({
            biomarker: {
              connectOrCreate: {
                where: { code: biomarker.name.toLowerCase().replace(/\s/g, '_') },
                create: {
                  code: biomarker.name.toLowerCase().replace(/\s/g, '_'),
                  name: biomarker.name,
                  category: 'Unknown', // Determine category based on biomarker
                  unit: biomarker.unit
                }
              }
            },
            value: biomarker.value,
            unit: biomarker.unit,
            referenceMin: biomarker.referenceMin,
            referenceMax: biomarker.referenceMax,
            isAbnormal: biomarker.value < (biomarker.referenceMin || 0) || 
                        biomarker.value > (biomarker.referenceMax || 100)
          }))
        }
      },
      include: {
        biomarkers: true
      }
    });

    res.status(201).json(healthReport);
  } catch (error) {
    console.error('Error uploading report:', error);
    res.status(500).json({ error: 'Failed to process health report' });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await prisma.healthReport.findMany({
      include: {
        biomarkers: {
          include: {
            biomarker: true
          }
        }
      }
    });
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch health reports' });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await prisma.healthReport.findUnique({
      where: { id },
      include: {
        biomarkers: {
          include: {
            biomarker: true
          }
        }
      }
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Health report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch health report' });
  }
};

exports.getReportsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await prisma.healthReport.findMany({
      where: { userId },
      include: {
        biomarkers: {
          include: {
            biomarker: true
          }
        }
      },
      orderBy: {
        collectionDate: 'desc'
      }
    });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: 'Failed to fetch user health reports' });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { userId, reportType, collectionDate, provider, notes, biomarkers } = req.body;
    
    const healthReport = await prisma.healthReport.create({
      data: {
        userId,
        reportType,
        collectionDate: new Date(collectionDate),
        provider,
        notes,
        biomarkers: {
          create: biomarkers.map(biomarker => ({
            biomarker: {
              connectOrCreate: {
                where: { code: biomarker.code },
                create: {
                  code: biomarker.code,
                  name: biomarker.name,
                  category: biomarker.category || 'Unknown',
                  unit: biomarker.unit
                }
              }
            },
            value: biomarker.value,
            unit: biomarker.unit,
            referenceMin: biomarker.referenceMin,
            referenceMax: biomarker.referenceMax,
            isAbnormal: biomarker.isAbnormal
          }))
        }
      },
      include: {
        biomarkers: true
      }
    });
    
    res.status(201).json(healthReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create health report' });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { reportType, collectionDate, provider, notes } = req.body;
    
    const updatedReport = await prisma.healthReport.update({
      where: { id },
      data: {
        reportType,
        collectionDate: new Date(collectionDate),
        provider,
        notes
      }
    });
    
    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update health report' });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete associated biomarker values first
    await prisma.biomarkerValue.deleteMany({
      where: { healthReportId: id }
    });
    
    // Then delete the report
    await prisma.healthReport.delete({
      where: { id }
    });
    
    res.json({ message: 'Health report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete health report' });
  }
};