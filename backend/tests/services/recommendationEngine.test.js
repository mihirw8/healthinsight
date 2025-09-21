const { expect } = require('chai');
const sinon = require('sinon');
const {
  generateRecommendations,
  prioritizeRecommendations,
  filterDuplicateRecommendations,
  generateBiomarkerRecommendations,
  generateLifestyleRecommendations
} = require('../../src/services/recommendationEngine');

describe('Recommendation Engine Service', () => {
  describe('generateBiomarkerRecommendations()', () => {
    it('should generate recommendations for elevated cholesterol', () => {
      const biomarkers = [
        { 
          name: 'LDL Cholesterol', 
          value: 160, 
          unit: 'mg/dL', 
          referenceRange: { min: 0, max: 100 },
          status: 'high'
        }
      ];
      
      const result = generateBiomarkerRecommendations(biomarkers);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      const cholesterolRec = result.find(rec => 
        rec.title.toLowerCase().includes('cholesterol') || 
        rec.description.toLowerCase().includes('cholesterol')
      );
      
      expect(cholesterolRec).to.exist;
      expect(cholesterolRec.biomarkers).to.include('LDL Cholesterol');
      expect(cholesterolRec.priority).to.be.oneOf(['high', 'medium']);
    });

    it('should generate recommendations for low vitamin levels', () => {
      const biomarkers = [
        { 
          name: 'Vitamin D', 
          value: 15, 
          unit: 'ng/mL', 
          referenceRange: { min: 30, max: 100 },
          status: 'low'
        }
      ];
      
      const result = generateBiomarkerRecommendations(biomarkers);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      const vitaminRec = result.find(rec => 
        rec.title.toLowerCase().includes('vitamin d') || 
        rec.description.toLowerCase().includes('vitamin d')
      );
      
      expect(vitaminRec).to.exist;
      expect(vitaminRec.biomarkers).to.include('Vitamin D');
    });

    it('should not generate recommendations for normal biomarkers', () => {
      const biomarkers = [
        { 
          name: 'Glucose', 
          value: 85, 
          unit: 'mg/dL', 
          referenceRange: { min: 70, max: 100 },
          status: 'normal'
        }
      ];
      
      const result = generateBiomarkerRecommendations(biomarkers);
      
      expect(result).to.be.an('array');
      
      const glucoseRec = result.find(rec => 
        rec.biomarkers.includes('Glucose') && 
        rec.title.toLowerCase().includes('glucose')
      );
      
      expect(glucoseRec).to.not.exist;
    });

    it('should handle empty biomarkers array', () => {
      const biomarkers = [];
      
      const result = generateBiomarkerRecommendations(biomarkers);
      
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });
  });

  describe('generateLifestyleRecommendations()', () => {
    it('should generate lifestyle recommendations based on risk factors', () => {
      const userProfile = {
        age: 45,
        gender: 'male',
        lifestyle: {
          smokingStatus: true,
          alcoholConsumption: 'moderate',
          physicalActivity: 'low',
          diet: 'high_processed'
        }
      };
      
      const riskFactors = {
        cardiovascular: 'moderate',
        diabetes: 'low'
      };
      
      const result = generateLifestyleRecommendations(userProfile, riskFactors);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      // Should have smoking recommendation
      const smokingRec = result.find(rec => 
        rec.title.toLowerCase().includes('smoking') || 
        rec.description.toLowerCase().includes('smoking')
      );
      
      expect(smokingRec).to.exist;
      expect(smokingRec.category).to.equal('lifestyle');
      
      // Should have physical activity recommendation
      const activityRec = result.find(rec => 
        rec.title.toLowerCase().includes('activity') || 
        rec.title.toLowerCase().includes('exercise') || 
        rec.description.toLowerCase().includes('physical activity')
      );
      
      expect(activityRec).to.exist;
    });

    it('should generate age-appropriate recommendations', () => {
      const userProfile = {
        age: 65,
        gender: 'female',
        lifestyle: {
          smokingStatus: false,
          alcoholConsumption: 'low',
          physicalActivity: 'moderate',
          diet: 'balanced'
        }
      };
      
      const riskFactors = {
        cardiovascular: 'moderate',
        osteoporosis: 'high'
      };
      
      const result = generateLifestyleRecommendations(userProfile, riskFactors);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      // Should have bone health recommendation for older female
      const boneRec = result.find(rec => 
        rec.title.toLowerCase().includes('bone') || 
        rec.description.toLowerCase().includes('bone') ||
        rec.description.toLowerCase().includes('osteoporosis')
      );
      
      expect(boneRec).to.exist;
    });

    it('should handle minimal user profile information', () => {
      const userProfile = {
        age: 30
      };
      
      const riskFactors = {};
      
      const result = generateLifestyleRecommendations(userProfile, riskFactors);
      
      expect(result).to.be.an('array');
      // Should still generate some general recommendations
      expect(result.length).to.be.greaterThan(0);
    });
  });

  describe('filterDuplicateRecommendations()', () => {
    it('should remove duplicate recommendations', () => {
      const recommendations = [
        {
          id: '1',
          title: 'Reduce saturated fat intake',
          description: 'Limit consumption of saturated fats to help lower cholesterol levels.',
          biomarkers: ['LDL Cholesterol'],
          category: 'diet'
        },
        {
          id: '2',
          title: 'Increase physical activity',
          description: 'Aim for at least 150 minutes of moderate exercise per week.',
          category: 'lifestyle'
        },
        {
          id: '3',
          title: 'Reduce saturated fat consumption',
          description: 'Decrease intake of saturated fats to improve cholesterol profile.',
          biomarkers: ['LDL Cholesterol', 'Total Cholesterol'],
          category: 'diet'
        }
      ];
      
      const result = filterDuplicateRecommendations(recommendations);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.lessThan(recommendations.length);
      
      // Check that we don't have both saturated fat recommendations
      const fatRecs = result.filter(rec => 
        rec.title.toLowerCase().includes('saturated fat')
      );
      
      expect(fatRecs.length).to.equal(1);
    });

    it('should keep unique recommendations', () => {
      const recommendations = [
        {
          id: '1',
          title: 'Increase vitamin D intake',
          description: 'Consider vitamin D supplementation or more sun exposure.',
          biomarkers: ['Vitamin D'],
          category: 'supplement'
        },
        {
          id: '2',
          title: 'Improve iron levels',
          description: 'Consume more iron-rich foods like leafy greens and lean meats.',
          biomarkers: ['Iron', 'Ferritin'],
          category: 'diet'
        }
      ];
      
      const result = filterDuplicateRecommendations(recommendations);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(recommendations.length);
    });

    it('should handle empty recommendations array', () => {
      const recommendations = [];
      
      const result = filterDuplicateRecommendations(recommendations);
      
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });
  });

  describe('prioritizeRecommendations()', () => {
    it('should prioritize recommendations correctly', () => {
      const recommendations = [
        {
          id: '1',
          title: 'Reduce blood pressure',
          description: 'Take steps to lower your blood pressure.',
          biomarkers: ['Blood Pressure'],
          category: 'lifestyle',
          priority: 'medium'
        },
        {
          id: '2',
          title: 'Critical: Lower blood glucose',
          description: 'Your glucose levels require immediate attention.',
          biomarkers: ['Glucose', 'HbA1c'],
          category: 'medical',
          priority: 'high'
        },
        {
          id: '3',
          title: 'Consider vitamin C supplementation',
          description: 'May help with overall immune function.',
          biomarkers: ['Vitamin C'],
          category: 'supplement',
          priority: 'low'
        }
      ];
      
      const result = prioritizeRecommendations(recommendations);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(recommendations.length);
      
      // First recommendation should be high priority
      expect(result[0].priority).to.equal('high');
      expect(result[0].id).to.equal('2');
      
      // Last recommendation should be low priority
      expect(result[result.length - 1].priority).to.equal('low');
      expect(result[result.length - 1].id).to.equal('3');
    });

    it('should handle recommendations with same priority', () => {
      const recommendations = [
        {
          id: '1',
          title: 'Increase fiber intake',
          description: 'Add more fiber to your diet.',
          category: 'diet',
          priority: 'medium'
        },
        {
          id: '2',
          title: 'Stay hydrated',
          description: 'Drink adequate water throughout the day.',
          category: 'lifestyle',
          priority: 'medium'
        }
      ];
      
      const result = prioritizeRecommendations(recommendations);
      
      expect(result).to.be.an('array');
      expect(result.length).to.equal(recommendations.length);
      
      // Both should have medium priority
      expect(result[0].priority).to.equal('medium');
      expect(result[1].priority).to.equal('medium');
    });

    it('should handle empty recommendations array', () => {
      const recommendations = [];
      
      const result = prioritizeRecommendations(recommendations);
      
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });
  });

  describe('generateRecommendations()', () => {
    it('should generate comprehensive recommendations', () => {
      const biomarkers = [
        { 
          name: 'LDL Cholesterol', 
          value: 160, 
          unit: 'mg/dL', 
          referenceRange: { min: 0, max: 100 },
          status: 'high'
        },
        { 
          name: 'HDL Cholesterol', 
          value: 35, 
          unit: 'mg/dL', 
          referenceRange: { min: 40, max: 60 },
          status: 'low'
        },
        { 
          name: 'Glucose', 
          value: 95, 
          unit: 'mg/dL', 
          referenceRange: { min: 70, max: 100 },
          status: 'normal'
        }
      ];
      
      const userProfile = {
        age: 50,
        gender: 'male',
        lifestyle: {
          smokingStatus: true,
          physicalActivity: 'low'
        }
      };
      
      const riskAssessments = {
        cardiovascular: { riskLevel: 'high' },
        diabetes: { riskLevel: 'moderate' }
      };
      
      const result = generateRecommendations(biomarkers, userProfile, riskAssessments);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      // Should have cholesterol recommendations
      const cholesterolRecs = result.filter(rec => 
        rec.biomarkers && (
          rec.biomarkers.includes('LDL Cholesterol') || 
          rec.biomarkers.includes('HDL Cholesterol')
        )
      );
      
      expect(cholesterolRecs.length).to.be.greaterThan(0);
      
      // Should have lifestyle recommendations
      const lifestyleRecs = result.filter(rec => 
        rec.category === 'lifestyle'
      );
      
      expect(lifestyleRecs.length).to.be.greaterThan(0);
      
      // Should have smoking recommendation
      const smokingRec = result.find(rec => 
        rec.title.toLowerCase().includes('smoking') || 
        rec.description.toLowerCase().includes('smoking')
      );
      
      expect(smokingRec).to.exist;
      
      // Recommendations should be prioritized
      const highPriorityRecs = result.filter(rec => rec.priority === 'high');
      const mediumPriorityRecs = result.filter(rec => rec.priority === 'medium');
      const lowPriorityRecs = result.filter(rec => rec.priority === 'low');
      
      // High priority should come first
      if (highPriorityRecs.length > 0 && mediumPriorityRecs.length > 0) {
        const highPriorityIndex = result.findIndex(rec => rec.priority === 'high');
        const mediumPriorityIndex = result.findIndex(rec => rec.priority === 'medium');
        expect(highPriorityIndex).to.be.lessThan(mediumPriorityIndex);
      }
    });

    it('should handle minimal input data', () => {
      const biomarkers = [
        { 
          name: 'Vitamin B12', 
          value: 150, 
          unit: 'pg/mL', 
          referenceRange: { min: 200, max: 900 },
          status: 'low'
        }
      ];
      
      const userProfile = {
        age: 35
      };
      
      const riskAssessments = {};
      
      const result = generateRecommendations(biomarkers, userProfile, riskAssessments);
      
      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);
      
      // Should have vitamin B12 recommendation
      const b12Rec = result.find(rec => 
        rec.biomarkers && rec.biomarkers.includes('Vitamin B12')
      );
      
      expect(b12Rec).to.exist;
    });

    it('should handle empty inputs', () => {
      const biomarkers = [];
      const userProfile = {};
      const riskAssessments = {};
      
      const result = generateRecommendations(biomarkers, userProfile, riskAssessments);
      
      expect(result).to.be.an('array');
      // Should still generate some general recommendations
      expect(result.length).to.be.greaterThan(0);
    });
  });
});