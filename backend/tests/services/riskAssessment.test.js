const { expect } = require('chai');
const sinon = require('sinon');
const {
  assessCardiovascularRisk,
  assessDiabetesRisk,
  assessNutritionalDeficiencyRisk,
  calculateRiskScore,
  generateRiskReport
} = require('../../src/services/riskAssessment');

describe('Risk Assessment Service', () => {
  describe('calculateRiskScore()', () => {
    it('should calculate high risk score correctly', () => {
      const biomarkers = [
        { name: 'LDL Cholesterol', value: 190, unit: 'mg/dL', referenceRange: { min: 0, max: 100 } },
        { name: 'Blood Pressure', value: 160, unit: 'mmHg', referenceRange: { min: 90, max: 120 } },
        { name: 'Triglycerides', value: 300, unit: 'mg/dL', referenceRange: { min: 0, max: 150 } }
      ];
      
      const result = calculateRiskScore(biomarkers);
      
      expect(result).to.be.a('number');
      expect(result).to.be.greaterThan(0.7); // High risk
    });

    it('should calculate moderate risk score correctly', () => {
      const biomarkers = [
        { name: 'LDL Cholesterol', value: 130, unit: 'mg/dL', referenceRange: { min: 0, max: 100 } },
        { name: 'Blood Pressure', value: 135, unit: 'mmHg', referenceRange: { min: 90, max: 120 } },
        { name: 'Triglycerides', value: 180, unit: 'mg/dL', referenceRange: { min: 0, max: 150 } }
      ];
      
      const result = calculateRiskScore(biomarkers);
      
      expect(result).to.be.a('number');
      expect(result).to.be.within(0.3, 0.7); // Moderate risk
    });

    it('should calculate low risk score correctly', () => {
      const biomarkers = [
        { name: 'LDL Cholesterol', value: 80, unit: 'mg/dL', referenceRange: { min: 0, max: 100 } },
        { name: 'Blood Pressure', value: 110, unit: 'mmHg', referenceRange: { min: 90, max: 120 } },
        { name: 'Triglycerides', value: 100, unit: 'mg/dL', referenceRange: { min: 0, max: 150 } }
      ];
      
      const result = calculateRiskScore(biomarkers);
      
      expect(result).to.be.a('number');
      expect(result).to.be.lessThan(0.3); // Low risk
    });

    it('should handle empty biomarkers array', () => {
      const biomarkers = [];
      
      const result = calculateRiskScore(biomarkers);
      
      expect(result).to.equal(0);
    });
  });

  describe('assessCardiovascularRisk()', () => {
    it('should assess high cardiovascular risk correctly', () => {
      const biomarkers = [
        { name: 'LDL Cholesterol', value: 190, unit: 'mg/dL' },
        { name: 'HDL Cholesterol', value: 30, unit: 'mg/dL' },
        { name: 'Blood Pressure', value: 160, unit: 'mmHg' },
        { name: 'Triglycerides', value: 300, unit: 'mg/dL' }
      ];
      
      const userProfile = {
        age: 65,
        gender: 'male',
        smokingStatus: true,
        familyHistory: { cardiovascularDisease: true }
      };
      
      const result = assessCardiovascularRisk(biomarkers, userProfile);
      
      expect(result).to.be.an('object');
      expect(result.riskLevel).to.equal('high');
      expect(result.score).to.be.greaterThan(0.7);
      expect(result.factors).to.be.an('array');
      expect(result.factors.length).to.be.greaterThan(0);
    });

    it('should assess low cardiovascular risk correctly', () => {
      const biomarkers = [
        { name: 'LDL Cholesterol', value: 80, unit: 'mg/dL' },
        { name: 'HDL Cholesterol', value: 60, unit: 'mg/dL' },
        { name: 'Blood Pressure', value: 110, unit: 'mmHg' },
        { name: 'Triglycerides', value: 100, unit: 'mg/dL' }
      ];
      
      const userProfile = {
        age: 30,
        gender: 'female',
        smokingStatus: false,
        familyHistory: { cardiovascularDisease: false }
      };
      
      const result = assessCardiovascularRisk(biomarkers, userProfile);
      
      expect(result).to.be.an('object');
      expect(result.riskLevel).to.equal('low');
      expect(result.score).to.be.lessThan(0.3);
      expect(result.factors).to.be.an('array');
    });

    it('should handle missing biomarkers', () => {
      const biomarkers = [
        { name: 'HDL Cholesterol', value: 45, unit: 'mg/dL' }
      ];
      
      const userProfile = {
        age: 45,
        gender: 'male',
        smokingStatus: false
      };
      
      const result = assessCardiovascularRisk(biomarkers, userProfile);
      
      expect(result).to.be.an('object');
      expect(result.riskLevel).to.be.a('string');
      expect(result.score).to.be.a('number');
      expect(result.factors).to.be.an('array');
      expect(result.limitations).to.be.an('array');
      expect(result.limitations.length).to.be.greaterThan(0);
    });
  });

  describe('assessDiabetesRisk()', () => {
    it('should assess high diabetes risk correctly', () => {
      const biomarkers = [
        { name: 'Glucose', value: 130, unit: 'mg/dL' },
        { name: 'HbA1c', value: 6.5, unit: '%' },
        { name: 'Insulin', value: 25, unit: 'μU/mL' }
      ];
      
      const userProfile = {
        age: 55,
        bmi: 32,
        familyHistory: { diabetes: true },
        physicalActivity: 'low'
      };
      
      const result = assessDiabetesRisk(biomarkers, userProfile);
      
      expect(result).to.be.an('object');
      expect(result.riskLevel).to.equal('high');
      expect(result.score).to.be.greaterThan(0.7);
      expect(result.factors).to.be.an('array');
      expect(result.factors.length).to.be.greaterThan(0);
    });

    it('should assess low diabetes risk correctly', () => {
      const biomarkers = [
        { name: 'Glucose', value: 85, unit: 'mg/dL' },
        { name: 'HbA1c', value: 5.2, unit: '%' },
        { name: 'Insulin', value: 8, unit: 'μU/mL' }
      ];
      
      const userProfile = {
        age: 30,
        bmi: 22,
        familyHistory: { diabetes: false },
        physicalActivity: 'high'
      };
      
      const result = assessDiabetesRisk(biomarkers, userProfile);
      
      expect(result).to.be.an('object');
      expect(result.riskLevel).to.equal('low');
      expect(result.score).to.be.lessThan(0.3);
      expect(result.factors).to.be.an('array');
    });

    it('should handle pre-diabetic conditions', () => {
      const biomarkers = [
        { name: 'Glucose', value: 115, unit: 'mg/dL' },
        { name: 'HbA1c', value: 6.1, unit: '%' }
      ];
      
      const userProfile = {
        age: 45,
        bmi: 27,
        familyHistory: { diabetes: false }
      };
      
      const result = assessDiabetesRisk(biomarkers, userProfile);
      
      expect(result).to.be.an('object');
      expect(result.riskLevel).to.equal('moderate');
      expect(result.score).to.be.within(0.3, 0.7);
      expect(result.factors).to.be.an('array');
      expect(result.factors.some(factor => factor.includes('pre-diabetic') || factor.includes('prediabetic'))).to.be.true;
    });
  });

  describe('assessNutritionalDeficiencyRisk()', () => {
    it('should assess vitamin D deficiency risk correctly', () => {
      const biomarkers = [
        { name: 'Vitamin D', value: 15, unit: 'ng/mL', referenceRange: { min: 30, max: 100 } },
        { name: 'Calcium', value: 8.5, unit: 'mg/dL', referenceRange: { min: 8.5, max: 10.5 } }
      ];
      
      const userProfile = {
        diet: 'vegetarian',
        sunExposure: 'low'
      };
      
      const result = assessNutritionalDeficiencyRisk(biomarkers, userProfile);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      const vitaminDRisk = result.find(risk => risk.nutrient === 'Vitamin D');
      expect(vitaminDRisk).to.exist;
      expect(vitaminDRisk.riskLevel).to.equal('high');
      expect(vitaminDRisk.currentValue).to.equal(15);
      expect(vitaminDRisk.recommendations).to.be.an('array');
    });

    it('should assess iron deficiency risk correctly', () => {
      const biomarkers = [
        { name: 'Iron', value: 40, unit: 'μg/dL', referenceRange: { min: 60, max: 170 } },
        { name: 'Ferritin', value: 10, unit: 'ng/mL', referenceRange: { min: 20, max: 250 } },
        { name: 'Hemoglobin', value: 11, unit: 'g/dL', referenceRange: { min: 12, max: 16 } }
      ];
      
      const userProfile = {
        diet: 'vegetarian',
        gender: 'female'
      };
      
      const result = assessNutritionalDeficiencyRisk(biomarkers, userProfile);
      
      expect(result).to.be.an('array');
      
      const ironRisk = result.find(risk => risk.nutrient === 'Iron');
      expect(ironRisk).to.exist;
      expect(ironRisk.riskLevel).to.equal('high');
      expect(ironRisk.recommendations).to.be.an('array');
    });

    it('should handle normal nutritional levels', () => {
      const biomarkers = [
        { name: 'Vitamin D', value: 45, unit: 'ng/mL', referenceRange: { min: 30, max: 100 } },
        { name: 'Vitamin B12', value: 500, unit: 'pg/mL', referenceRange: { min: 200, max: 900 } },
        { name: 'Iron', value: 100, unit: 'μg/dL', referenceRange: { min: 60, max: 170 } }
      ];
      
      const userProfile = {
        diet: 'omnivore',
        sunExposure: 'moderate'
      };
      
      const result = assessNutritionalDeficiencyRisk(biomarkers, userProfile);
      
      expect(result).to.be.an('array');
      
      // All nutrients should be low risk
      result.forEach(risk => {
        expect(risk.riskLevel).to.equal('low');
      });
    });
  });

  describe('generateRiskReport()', () => {
    it('should generate a comprehensive risk report', () => {
      const cardiovascularRisk = {
        riskLevel: 'moderate',
        score: 0.5,
        factors: ['Elevated LDL cholesterol', 'Family history of heart disease']
      };
      
      const diabetesRisk = {
        riskLevel: 'low',
        score: 0.2,
        factors: ['Normal glucose levels', 'Healthy BMI']
      };
      
      const nutritionalRisks = [
        {
          nutrient: 'Vitamin D',
          riskLevel: 'moderate',
          currentValue: 25,
          recommendations: ['Consider vitamin D supplementation']
        }
      ];
      
      const result = generateRiskReport(cardiovascularRisk, diabetesRisk, nutritionalRisks);
      
      expect(result).to.be.an('object');
      expect(result.overallRiskLevel).to.be.a('string');
      expect(result.riskCategories).to.be.an('object');
      expect(result.riskCategories.cardiovascular).to.deep.equal(cardiovascularRisk);
      expect(result.riskCategories.diabetes).to.deep.equal(diabetesRisk);
      expect(result.riskCategories.nutritional).to.deep.equal(nutritionalRisks);
      expect(result.summary).to.be.a('string');
      expect(result.recommendations).to.be.an('array');
    });

    it('should handle high overall risk correctly', () => {
      const cardiovascularRisk = {
        riskLevel: 'high',
        score: 0.8,
        factors: ['Very high LDL cholesterol', 'Hypertension', 'Smoking']
      };
      
      const diabetesRisk = {
        riskLevel: 'high',
        score: 0.75,
        factors: ['Elevated glucose', 'High HbA1c', 'Family history of diabetes']
      };
      
      const nutritionalRisks = [
        {
          nutrient: 'Vitamin B12',
          riskLevel: 'high',
          currentValue: 150,
          recommendations: ['Urgent B12 supplementation recommended']
        }
      ];
      
      const result = generateRiskReport(cardiovascularRisk, diabetesRisk, nutritionalRisks);
      
      expect(result).to.be.an('object');
      expect(result.overallRiskLevel).to.equal('high');
      expect(result.recommendations.length).to.be.greaterThan(0);
      expect(result.urgentAction).to.be.true;
    });

    it('should handle low overall risk correctly', () => {
      const cardiovascularRisk = {
        riskLevel: 'low',
        score: 0.2,
        factors: ['Healthy cholesterol levels', 'Normal blood pressure']
      };
      
      const diabetesRisk = {
        riskLevel: 'low',
        score: 0.1,
        factors: ['Normal glucose levels', 'Healthy BMI']
      };
      
      const nutritionalRisks = [
        {
          nutrient: 'Iron',
          riskLevel: 'low',
          currentValue: 100,
          recommendations: ['Maintain current diet']
        }
      ];
      
      const result = generateRiskReport(cardiovascularRisk, diabetesRisk, nutritionalRisks);
      
      expect(result).to.be.an('object');
      expect(result.overallRiskLevel).to.equal('low');
      expect(result.recommendations.length).to.be.greaterThan(0);
      expect(result.urgentAction).to.be.false;
    });
  });
});