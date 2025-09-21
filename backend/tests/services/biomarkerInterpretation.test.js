const { expect } = require('chai');
const sinon = require('sinon');
const {
  interpretBiomarker,
  analyzeBiomarkerPattern,
  analyzeHealthReport,
  determineSignificance,
  generateSummary
} = require('../../src/services/biomarkerInterpretation');

describe('Biomarker Interpretation Service', () => {
  describe('interpretBiomarker()', () => {
    it('should correctly interpret a normal biomarker value', () => {
      const biomarker = {
        name: 'Glucose',
        value: 85,
        referenceMin: 70,
        referenceMax: 99,
        unit: 'mg/dL'
      };

      const result = interpretBiomarker(biomarker);
      
      expect(result).to.be.an('object');
      expect(result.status).to.equal('normal');
      expect(result.interpretation).to.include('normal range');
    });

    it('should correctly interpret a high biomarker value', () => {
      const biomarker = {
        name: 'Total Cholesterol',
        value: 240,
        referenceMin: 125,
        referenceMax: 200,
        unit: 'mg/dL'
      };

      const result = interpretBiomarker(biomarker);
      
      expect(result).to.be.an('object');
      expect(result.status).to.equal('high');
      expect(result.interpretation).to.include('above the reference range');
    });

    it('should correctly interpret a low biomarker value', () => {
      const biomarker = {
        name: 'Hemoglobin',
        value: 11,
        referenceMin: 13.5,
        referenceMax: 17.5,
        unit: 'g/dL'
      };

      const result = interpretBiomarker(biomarker);
      
      expect(result).to.be.an('object');
      expect(result.status).to.equal('low');
      expect(result.interpretation).to.include('below the reference range');
    });

    it('should correctly interpret a critical high biomarker value', () => {
      const biomarker = {
        name: 'Potassium',
        value: 6.5,
        referenceMin: 3.5,
        referenceMax: 5.0,
        unit: 'mmol/L'
      };

      const result = interpretBiomarker(biomarker);
      
      expect(result).to.be.an('object');
      expect(result.status).to.equal('critical_high');
      expect(result.interpretation).to.include('critically high');
    });

    it('should correctly interpret a critical low biomarker value', () => {
      const biomarker = {
        name: 'Sodium',
        value: 120,
        referenceMin: 135,
        referenceMax: 145,
        unit: 'mmol/L'
      };

      const result = interpretBiomarker(biomarker);
      
      expect(result).to.be.an('object');
      expect(result.status).to.equal('critical_low');
      expect(result.interpretation).to.include('critically low');
    });

    it('should handle biomarkers without reference ranges', () => {
      const biomarker = {
        name: 'New Test',
        value: 42,
        unit: 'units'
      };

      const result = interpretBiomarker(biomarker);
      
      expect(result).to.be.an('object');
      expect(result.status).to.equal('unknown');
      expect(result.interpretation).to.include('No reference range');
    });
  });

  describe('analyzeBiomarkerPattern()', () => {
    it('should detect anemia pattern', () => {
      const biomarkers = [
        { name: 'Hemoglobin', value: 11, referenceMin: 13.5, referenceMax: 17.5, status: 'low' },
        { name: 'Hematocrit', value: 32, referenceMin: 38.8, referenceMax: 50, status: 'low' },
        { name: 'RBC', value: 3.8, referenceMin: 4.5, referenceMax: 5.9, status: 'low' }
      ];

      const result = analyzeBiomarkerPattern(biomarkers);
      
      expect(result).to.be.an('array');
      expect(result.some(pattern => pattern.name === 'Anemia')).to.be.true;
    });

    it('should detect metabolic syndrome pattern', () => {
      const biomarkers = [
        { name: 'Glucose', value: 110, referenceMin: 70, referenceMax: 99, status: 'high' },
        { name: 'Triglycerides', value: 180, referenceMin: 0, referenceMax: 150, status: 'high' },
        { name: 'HDL Cholesterol', value: 35, referenceMin: 40, referenceMax: 60, status: 'low' },
        { name: 'Blood Pressure', value: '140/90', referenceMin: '90/60', referenceMax: '120/80', status: 'high' }
      ];

      const result = analyzeBiomarkerPattern(biomarkers);
      
      expect(result).to.be.an('array');
      expect(result.some(pattern => pattern.name === 'Metabolic Syndrome')).to.be.true;
    });

    it('should return empty array when no patterns are detected', () => {
      const biomarkers = [
        { name: 'Vitamin D', value: 45, referenceMin: 30, referenceMax: 100, status: 'normal' },
        { name: 'Calcium', value: 9.5, referenceMin: 8.6, referenceMax: 10.2, status: 'normal' }
      ];

      const result = analyzeBiomarkerPattern(biomarkers);
      
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });
  });

  describe('determineSignificance()', () => {
    it('should identify critical biomarkers as high significance', () => {
      const biomarker = {
        name: 'Potassium',
        value: 6.5,
        referenceMin: 3.5,
        referenceMax: 5.0,
        status: 'critical_high'
      };

      const result = determineSignificance(biomarker);
      
      expect(result).to.equal('high');
    });

    it('should identify normal biomarkers as low significance', () => {
      const biomarker = {
        name: 'Calcium',
        value: 9.5,
        referenceMin: 8.6,
        referenceMax: 10.2,
        status: 'normal'
      };

      const result = determineSignificance(biomarker);
      
      expect(result).to.equal('low');
    });

    it('should identify certain abnormal biomarkers as medium significance', () => {
      const biomarker = {
        name: 'Total Cholesterol',
        value: 220,
        referenceMin: 125,
        referenceMax: 200,
        status: 'high'
      };

      const result = determineSignificance(biomarker);
      
      expect(result).to.equal('medium');
    });
  });

  describe('analyzeHealthReport()', () => {
    it('should analyze a complete health report', () => {
      const report = {
        id: 'report123',
        userId: 'user456',
        date: '2023-06-15',
        biomarkers: [
          { name: 'Glucose', value: 85, referenceMin: 70, referenceMax: 99, unit: 'mg/dL' },
          { name: 'Total Cholesterol', value: 240, referenceMin: 125, referenceMax: 200, unit: 'mg/dL' },
          { name: 'HDL Cholesterol', value: 45, referenceMin: 40, referenceMax: 60, unit: 'mg/dL' },
          { name: 'LDL Cholesterol', value: 155, referenceMin: 0, referenceMax: 100, unit: 'mg/dL' },
          { name: 'Triglycerides', value: 180, referenceMin: 0, referenceMax: 150, unit: 'mg/dL' }
        ]
      };

      const result = analyzeHealthReport(report);
      
      expect(result).to.be.an('object');
      expect(result.biomarkerResults).to.be.an('array');
      expect(result.biomarkerResults).to.have.lengthOf(5);
      expect(result.patterns).to.be.an('array');
      expect(result.summary).to.be.a('string');
      expect(result.criticalBiomarkers).to.be.an('array');
      expect(result.abnormalBiomarkers).to.be.an('array');
      expect(result.abnormalBiomarkers.length).to.be.at.least(3); // Cholesterol, LDL, Triglycerides
    });

    it('should handle empty biomarker list', () => {
      const report = {
        id: 'report123',
        userId: 'user456',
        date: '2023-06-15',
        biomarkers: []
      };

      const result = analyzeHealthReport(report);
      
      expect(result).to.be.an('object');
      expect(result.biomarkerResults).to.be.an('array');
      expect(result.biomarkerResults).to.be.empty;
      expect(result.patterns).to.be.an('array');
      expect(result.patterns).to.be.empty;
      expect(result.summary).to.be.a('string');
      expect(result.summary).to.include('No biomarkers');
      expect(result.criticalBiomarkers).to.be.an('array');
      expect(result.criticalBiomarkers).to.be.empty;
      expect(result.abnormalBiomarkers).to.be.an('array');
      expect(result.abnormalBiomarkers).to.be.empty;
    });
  });

  describe('generateSummary()', () => {
    it('should generate a summary for a report with abnormal biomarkers', () => {
      const biomarkerResults = [
        { name: 'Glucose', value: 85, status: 'normal', interpretation: 'Normal glucose level' },
        { name: 'Total Cholesterol', value: 240, status: 'high', interpretation: 'Elevated cholesterol' },
        { name: 'LDL Cholesterol', value: 155, status: 'high', interpretation: 'Elevated LDL' }
      ];
      
      const patterns = [
        { name: 'Hyperlipidemia', description: 'Elevated lipid levels', significance: 'medium' }
      ];

      const result = generateSummary(biomarkerResults, patterns);
      
      expect(result).to.be.a('string');
      expect(result).to.include('elevated');
      expect(result).to.include('cholesterol');
    });

    it('should generate a summary for a report with critical biomarkers', () => {
      const biomarkerResults = [
        { name: 'Glucose', value: 85, status: 'normal', interpretation: 'Normal glucose level' },
        { name: 'Potassium', value: 6.5, status: 'critical_high', interpretation: 'Critically high potassium' }
      ];
      
      const patterns = [];

      const result = generateSummary(biomarkerResults, patterns);
      
      expect(result).to.be.a('string');
      expect(result).to.include('critical');
      expect(result).to.include('potassium');
      expect(result).to.include('medical attention');
    });

    it('should generate a summary for a report with all normal biomarkers', () => {
      const biomarkerResults = [
        { name: 'Glucose', value: 85, status: 'normal', interpretation: 'Normal glucose level' },
        { name: 'Total Cholesterol', value: 180, status: 'normal', interpretation: 'Normal cholesterol' }
      ];
      
      const patterns = [];

      const result = generateSummary(biomarkerResults, patterns);
      
      expect(result).to.be.a('string');
      expect(result).to.include('normal');
      expect(result).to.include('healthy');
    });
  });
});