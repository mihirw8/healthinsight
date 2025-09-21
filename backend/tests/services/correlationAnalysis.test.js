const { expect } = require('chai');
const sinon = require('sinon');
const {
  analyzeBiomarkerCorrelations,
  trackTrendsOverTime,
  generateHealthInsights,
  calculatePearsonCorrelation,
  performLinearRegression
} = require('../../src/services/correlationAnalysis');

describe('Correlation Analysis Service', () => {
  describe('calculatePearsonCorrelation()', () => {
    it('should calculate positive correlation correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const result = calculatePearsonCorrelation(x, y);
      
      expect(result).to.be.a('number');
      expect(result).to.be.closeTo(1.0, 0.001); // Perfect positive correlation
    });

    it('should calculate negative correlation correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      
      const result = calculatePearsonCorrelation(x, y);
      
      expect(result).to.be.a('number');
      expect(result).to.be.closeTo(-1.0, 0.001); // Perfect negative correlation
    });

    it('should calculate no correlation correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 2, 8, 1, 7];
      
      const result = calculatePearsonCorrelation(x, y);
      
      expect(result).to.be.a('number');
      expect(Math.abs(result)).to.be.lessThan(0.5); // Weak or no correlation
    });

    it('should handle empty arrays', () => {
      const x = [];
      const y = [];
      
      const result = calculatePearsonCorrelation(x, y);
      
      expect(result).to.be.NaN;
    });

    it('should handle arrays of different lengths', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6];
      
      const result = calculatePearsonCorrelation(x, y);
      
      expect(result).to.be.NaN;
    });
  });

  describe('performLinearRegression()', () => {
    it('should calculate slope and intercept correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      
      const result = performLinearRegression(x, y);
      
      expect(result).to.be.an('object');
      expect(result.slope).to.be.closeTo(2, 0.001);
      expect(result.intercept).to.be.closeTo(0, 0.001);
    });

    it('should handle negative slope', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [10, 8, 6, 4, 2];
      
      const result = performLinearRegression(x, y);
      
      expect(result).to.be.an('object');
      expect(result.slope).to.be.closeTo(-2, 0.001);
      expect(result.intercept).to.be.closeTo(12, 0.001);
    });

    it('should handle empty arrays', () => {
      const x = [];
      const y = [];
      
      const result = performLinearRegression(x, y);
      
      expect(result).to.be.an('object');
      expect(result.slope).to.be.NaN;
      expect(result.intercept).to.be.NaN;
    });
  });

  describe('analyzeBiomarkerCorrelations()', () => {
    it('should identify correlations between biomarkers', () => {
      const biomarkerHistory = [
        {
          date: '2023-01-15',
          biomarkers: [
            { name: 'Glucose', value: 100 },
            { name: 'HbA1c', value: 5.8 },
            { name: 'Triglycerides', value: 150 }
          ]
        },
        {
          date: '2023-03-15',
          biomarkers: [
            { name: 'Glucose', value: 110 },
            { name: 'HbA1c', value: 6.0 },
            { name: 'Triglycerides', value: 165 }
          ]
        },
        {
          date: '2023-06-15',
          biomarkers: [
            { name: 'Glucose', value: 120 },
            { name: 'HbA1c', value: 6.2 },
            { name: 'Triglycerides', value: 180 }
          ]
        }
      ];
      
      const result = analyzeBiomarkerCorrelations(biomarkerHistory);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      // Check for Glucose-HbA1c correlation
      const glucoseHbA1cCorrelation = result.find(
        corr => (corr.biomarker1 === 'Glucose' && corr.biomarker2 === 'HbA1c') || 
                (corr.biomarker1 === 'HbA1c' && corr.biomarker2 === 'Glucose')
      );
      
      expect(glucoseHbA1cCorrelation).to.exist;
      expect(glucoseHbA1cCorrelation.correlationCoefficient).to.be.closeTo(1.0, 0.1);
      expect(glucoseHbA1cCorrelation.strength).to.equal('strong');
    });

    it('should handle empty history', () => {
      const biomarkerHistory = [];
      
      const result = analyzeBiomarkerCorrelations(biomarkerHistory);
      
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });

    it('should handle history with only one entry', () => {
      const biomarkerHistory = [
        {
          date: '2023-01-15',
          biomarkers: [
            { name: 'Glucose', value: 100 },
            { name: 'HbA1c', value: 5.8 }
          ]
        }
      ];
      
      const result = analyzeBiomarkerCorrelations(biomarkerHistory);
      
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });
  });

  describe('trackTrendsOverTime()', () => {
    it('should identify increasing trends', () => {
      const biomarkerHistory = [
        {
          date: '2023-01-15',
          biomarkers: [{ name: 'Glucose', value: 90 }]
        },
        {
          date: '2023-03-15',
          biomarkers: [{ name: 'Glucose', value: 95 }]
        },
        {
          date: '2023-06-15',
          biomarkers: [{ name: 'Glucose', value: 100 }]
        }
      ];
      
      const result = trackTrendsOverTime(biomarkerHistory);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      const glucoseTrend = result.find(trend => trend.biomarker === 'Glucose');
      expect(glucoseTrend).to.exist;
      expect(glucoseTrend.trend).to.equal('increasing');
      expect(glucoseTrend.slope).to.be.greaterThan(0);
    });

    it('should identify decreasing trends', () => {
      const biomarkerHistory = [
        {
          date: '2023-01-15',
          biomarkers: [{ name: 'HDL Cholesterol', value: 60 }]
        },
        {
          date: '2023-03-15',
          biomarkers: [{ name: 'HDL Cholesterol', value: 55 }]
        },
        {
          date: '2023-06-15',
          biomarkers: [{ name: 'HDL Cholesterol', value: 50 }]
        }
      ];
      
      const result = trackTrendsOverTime(biomarkerHistory);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      const hdlTrend = result.find(trend => trend.biomarker === 'HDL Cholesterol');
      expect(hdlTrend).to.exist;
      expect(hdlTrend.trend).to.equal('decreasing');
      expect(hdlTrend.slope).to.be.lessThan(0);
    });

    it('should identify stable trends', () => {
      const biomarkerHistory = [
        {
          date: '2023-01-15',
          biomarkers: [{ name: 'Calcium', value: 9.5 }]
        },
        {
          date: '2023-03-15',
          biomarkers: [{ name: 'Calcium', value: 9.4 }]
        },
        {
          date: '2023-06-15',
          biomarkers: [{ name: 'Calcium', value: 9.6 }]
        }
      ];
      
      const result = trackTrendsOverTime(biomarkerHistory);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      const calciumTrend = result.find(trend => trend.biomarker === 'Calcium');
      expect(calciumTrend).to.exist;
      expect(calciumTrend.trend).to.equal('stable');
      expect(Math.abs(calciumTrend.slope)).to.be.lessThan(0.1);
    });

    it('should handle empty history', () => {
      const biomarkerHistory = [];
      
      const result = trackTrendsOverTime(biomarkerHistory);
      
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });
  });

  describe('generateHealthInsights()', () => {
    it('should generate insights based on correlations and trends', () => {
      const correlations = [
        {
          biomarker1: 'Glucose',
          biomarker2: 'HbA1c',
          correlationCoefficient: 0.95,
          strength: 'strong',
          direction: 'positive'
        }
      ];
      
      const trends = [
        {
          biomarker: 'Glucose',
          trend: 'increasing',
          slope: 5,
          significance: 'medium'
        },
        {
          biomarker: 'HbA1c',
          trend: 'increasing',
          slope: 0.2,
          significance: 'medium'
        }
      ];
      
      const result = generateHealthInsights(correlations, trends);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      // Check for glucose-related insight
      const glucoseInsight = result.find(insight => 
        insight.title.includes('Glucose') || insight.description.includes('glucose')
      );
      
      expect(glucoseInsight).to.exist;
      expect(glucoseInsight.title).to.be.a('string');
      expect(glucoseInsight.description).to.be.a('string');
      expect(glucoseInsight.severity).to.be.a('string');
    });

    it('should handle empty correlations and trends', () => {
      const correlations = [];
      const trends = [];
      
      const result = generateHealthInsights(correlations, trends);
      
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });

    it('should generate insights with only trend data', () => {
      const correlations = [];
      const trends = [
        {
          biomarker: 'LDL Cholesterol',
          trend: 'increasing',
          slope: 10,
          significance: 'high'
        }
      ];
      
      const result = generateHealthInsights(correlations, trends);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      const ldlInsight = result.find(insight => 
        insight.title.includes('LDL') || insight.description.includes('LDL')
      );
      
      expect(ldlInsight).to.exist;
      expect(ldlInsight.severity).to.equal('high');
    });
  });
});