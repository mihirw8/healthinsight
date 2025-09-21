/**
 * Correlation Analysis Service
 * 
 * This service analyzes relationships between biomarkers, identifies trends over time,
 * and provides insights into potential health patterns.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { linearRegression } = require('ml-regression');

/**
 * Analyzes correlations between biomarkers for a specific user
 * @param {string} userId - User ID
 * @param {Array} biomarkerNames - Optional array of biomarker names to analyze
 * @returns {Promise<Array>} Correlation results
 */
async function analyzeBiomarkerCorrelations(userId, biomarkerNames = []) {
  try {
    // Get user's biomarker data
    const biomarkerData = await fetchUserBiomarkerData(userId, biomarkerNames);
    
    if (!biomarkerData || Object.keys(biomarkerData).length < 2) {
      return {
        correlations: [],
        message: "Insufficient data for correlation analysis. At least two biomarkers with multiple data points are required."
      };
    }
    
    // Calculate correlations between biomarkers
    const correlations = calculateCorrelations(biomarkerData);
    
    // Filter significant correlations
    const significantCorrelations = correlations.filter(corr => 
      Math.abs(corr.coefficient) >= 0.5 && corr.dataPoints >= 3
    );
    
    // Save significant correlations to database
    await saveCorrelations(userId, significantCorrelations);
    
    return {
      correlations: significantCorrelations,
      message: `Found ${significantCorrelations.length} significant correlations.`
    };
  } catch (error) {
    console.error('Error in correlation analysis:', error);
    throw new Error('Failed to analyze biomarker correlations');
  }
}

/**
 * Analyzes trends for specific biomarkers over time
 * @param {string} userId - User ID
 * @param {Array} biomarkerNames - Array of biomarker names to analyze
 * @returns {Promise<Array>} Trend analysis results
 */
async function analyzeBiomarkerTrends(userId, biomarkerNames = []) {
  try {
    // Get user's biomarker data
    const biomarkerData = await fetchUserBiomarkerData(userId, biomarkerNames);
    
    if (!biomarkerData || Object.keys(biomarkerData).length === 0) {
      return {
        trends: [],
        message: "No biomarker data available for trend analysis."
      };
    }
    
    // Calculate trends for each biomarker
    const trends = [];
    
    for (const [biomarkerName, dataPoints] of Object.entries(biomarkerData)) {
      if (dataPoints.length >= 2) {
        const trend = calculateTrend(biomarkerName, dataPoints);
        trends.push(trend);
      }
    }
    
    return {
      trends,
      message: `Analyzed trends for ${trends.length} biomarkers.`
    };
  } catch (error) {
    console.error('Error in trend analysis:', error);
    throw new Error('Failed to analyze biomarker trends');
  }
}

/**
 * Identifies potential health insights based on correlations and trends
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Health insights
 */
async function generateHealthInsights(userId) {
  try {
    // Get user's significant correlations
    const correlations = await prisma.correlation.findMany({
      where: { userId }
    });
    
    // Get user's biomarker trends
    const { trends } = await analyzeBiomarkerTrends(userId);
    
    // Generate insights based on correlations and trends
    const insights = [];
    
    // Insights from correlations
    correlations.forEach(correlation => {
      if (Math.abs(correlation.coefficient) >= 0.7) {
        insights.push({
          type: 'correlation',
          title: `Strong relationship between ${correlation.biomarker1} and ${correlation.biomarker2}`,
          description: generateCorrelationInsight(correlation),
          strength: 'high',
          relatedBiomarkers: [correlation.biomarker1, correlation.biomarker2],
          actionable: true
        });
      }
    });
    
    // Insights from trends
    trends.forEach(trend => {
      if (Math.abs(trend.slope) >= 0.1) {
        insights.push({
          type: 'trend',
          title: `${trend.direction === 'increasing' ? 'Rising' : 'Declining'} ${trend.biomarkerName} levels`,
          description: generateTrendInsight(trend),
          strength: Math.abs(trend.slope) >= 0.2 ? 'high' : 'medium',
          relatedBiomarkers: [trend.biomarkerName],
          actionable: true
        });
      }
    });
    
    // Combine insights from correlations and trends
    const combinedInsights = generateCombinedInsights(correlations, trends);
    insights.push(...combinedInsights);
    
    return {
      insights,
      message: `Generated ${insights.length} health insights.`
    };
  } catch (error) {
    console.error('Error generating health insights:', error);
    throw new Error('Failed to generate health insights');
  }
}

/**
 * Fetches biomarker data for a specific user
 * @param {string} userId - User ID
 * @param {Array} biomarkerNames - Optional array of biomarker names to fetch
 * @returns {Promise<Object>} Biomarker data organized by name
 */
async function fetchUserBiomarkerData(userId, biomarkerNames = []) {
  try {
    // Query to get user's biomarker values
    const query = {
      where: { 
        healthReport: { userId }
      },
      include: {
        biomarker: true,
        healthReport: {
          select: { date: true }
        }
      },
      orderBy: {
        healthReport: { date: 'asc' }
      }
    };
    
    // Add biomarker name filter if provided
    if (biomarkerNames.length > 0) {
      query.where.biomarker = {
        name: { in: biomarkerNames }
      };
    }
    
    const biomarkerValues = await prisma.biomarkerValue.findMany(query);
    
    // Organize data by biomarker name
    const biomarkerData = {};
    
    biomarkerValues.forEach(value => {
      const name = value.biomarker.name;
      
      if (!biomarkerData[name]) {
        biomarkerData[name] = [];
      }
      
      biomarkerData[name].push({
        value: value.value,
        date: value.healthReport.date,
        unit: value.unit,
        referenceMin: value.referenceMin,
        referenceMax: value.referenceMax
      });
    });
    
    return biomarkerData;
  } catch (error) {
    console.error('Error fetching user biomarker data:', error);
    throw new Error('Failed to fetch biomarker data');
  }
}

/**
 * Calculates correlations between biomarkers
 * @param {Object} biomarkerData - Biomarker data organized by name
 * @returns {Array} Correlation results
 */
function calculateCorrelations(biomarkerData) {
  const biomarkerNames = Object.keys(biomarkerData);
  const correlations = [];
  
  // Compare each pair of biomarkers
  for (let i = 0; i < biomarkerNames.length; i++) {
    for (let j = i + 1; j < biomarkerNames.length; j++) {
      const name1 = biomarkerNames[i];
      const name2 = biomarkerNames[j];
      
      const data1 = biomarkerData[name1];
      const data2 = biomarkerData[name2];
      
      // Find overlapping dates for paired analysis
      const pairedData = pairBiomarkerData(data1, data2);
      
      if (pairedData.length >= 3) {
        // Calculate Pearson correlation coefficient
        const coefficient = calculatePearsonCorrelation(
          pairedData.map(p => p.value1),
          pairedData.map(p => p.value2)
        );
        
        correlations.push({
          biomarker1: name1,
          biomarker2: name2,
          coefficient: parseFloat(coefficient.toFixed(2)),
          dataPoints: pairedData.length,
          relationship: interpretCorrelation(coefficient),
          pairedData
        });
      }
    }
  }
  
  return correlations;
}

/**
 * Pairs biomarker data points by date
 * @param {Array} data1 - First biomarker data points
 * @param {Array} data2 - Second biomarker data points
 * @returns {Array} Paired data points
 */
function pairBiomarkerData(data1, data2) {
  const pairedData = [];
  
  // Create maps of date to value for quick lookup
  const dateMap1 = new Map();
  const dateMap2 = new Map();
  
  data1.forEach(point => {
    dateMap1.set(point.date.toISOString().split('T')[0], point);
  });
  
  data2.forEach(point => {
    dateMap2.set(point.date.toISOString().split('T')[0], point);
  });
  
  // Find dates that exist in both datasets
  for (const [date, point1] of dateMap1.entries()) {
    if (dateMap2.has(date)) {
      const point2 = dateMap2.get(date);
      
      pairedData.push({
        date: new Date(date),
        value1: point1.value,
        value2: point2.value,
        unit1: point1.unit,
        unit2: point2.unit
      });
    }
  }
  
  // Sort by date
  pairedData.sort((a, b) => a.date - b.date);
  
  return pairedData;
}

/**
 * Calculates Pearson correlation coefficient between two arrays
 * @param {Array} x - First array of values
 * @param {Array} y - Second array of values
 * @returns {number} Correlation coefficient
 */
function calculatePearsonCorrelation(x, y) {
  const n = x.length;
  
  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate covariance and standard deviations
  let covariance = 0;
  let varX = 0;
  let varY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    
    covariance += diffX * diffY;
    varX += diffX * diffX;
    varY += diffY * diffY;
  }
  
  // Calculate correlation coefficient
  const stdX = Math.sqrt(varX);
  const stdY = Math.sqrt(varY);
  
  if (stdX === 0 || stdY === 0) {
    return 0; // No correlation if there's no variation
  }
  
  return covariance / (stdX * stdY);
}

/**
 * Interprets correlation coefficient
 * @param {number} coefficient - Correlation coefficient
 * @returns {string} Interpretation
 */
function interpretCorrelation(coefficient) {
  const absCoeff = Math.abs(coefficient);
  
  if (absCoeff >= 0.8) {
    return coefficient > 0 ? 'strong positive' : 'strong negative';
  } else if (absCoeff >= 0.5) {
    return coefficient > 0 ? 'moderate positive' : 'moderate negative';
  } else if (absCoeff >= 0.3) {
    return coefficient > 0 ? 'weak positive' : 'weak negative';
  } else {
    return 'no significant';
  }
}

/**
 * Calculates trend for a biomarker over time
 * @param {string} biomarkerName - Biomarker name
 * @param {Array} dataPoints - Biomarker data points
 * @returns {Object} Trend analysis
 */
function calculateTrend(biomarkerName, dataPoints) {
  // Sort data points by date
  dataPoints.sort((a, b) => a.date - b.date);
  
  // Prepare data for linear regression
  const x = dataPoints.map(point => point.date.getTime());
  const y = dataPoints.map(point => point.value);
  
  // Normalize x values to avoid numerical issues
  const minX = Math.min(...x);
  const normalizedX = x.map(val => (val - minX) / (1000 * 60 * 60 * 24)); // Convert to days
  
  // Calculate linear regression
  const regression = linearRegression(normalizedX, y);
  const slope = regression.slope;
  const intercept = regression.intercept;
  
  // Calculate predicted values and residuals
  const predictedValues = normalizedX.map(x => slope * x + intercept);
  const residuals = y.map((actual, i) => actual - predictedValues[i]);
  
  // Calculate R-squared
  const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
  const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
  const residualSumSquares = residuals.reduce((sum, val) => sum + Math.pow(val, 2), 0);
  const rSquared = 1 - (residualSumSquares / totalSumSquares);
  
  // Calculate percent change
  const firstValue = y[0];
  const lastValue = y[y.length - 1];
  const percentChange = firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : 0;
  
  // Determine direction and significance
  const direction = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
  const significance = Math.abs(slope) >= 0.1 ? 'significant' : 'not significant';
  
  return {
    biomarkerName,
    dataPoints: dataPoints.length,
    timeSpan: {
      start: dataPoints[0].date,
      end: dataPoints[dataPoints.length - 1].date,
      durationDays: (dataPoints[dataPoints.length - 1].date - dataPoints[0].date) / (1000 * 60 * 60 * 24)
    },
    trend: {
      slope,
      intercept,
      rSquared: parseFloat(rSquared.toFixed(2)),
      percentChange: parseFloat(percentChange.toFixed(2))
    },
    direction,
    significance,
    unit: dataPoints[0].unit,
    referenceRange: {
      min: dataPoints[0].referenceMin,
      max: dataPoints[0].referenceMax
    }
  };
}

/**
 * Saves significant correlations to database
 * @param {string} userId - User ID
 * @param {Array} correlations - Correlation results
 * @returns {Promise<void>}
 */
async function saveCorrelations(userId, correlations) {
  try {
    // Process each correlation
    for (const correlation of correlations) {
      // Check if correlation already exists
      const existingCorrelation = await prisma.correlation.findFirst({
        where: {
          userId,
          biomarker1: correlation.biomarker1,
          biomarker2: correlation.biomarker2
        }
      });
      
      if (existingCorrelation) {
        // Update existing correlation
        await prisma.correlation.update({
          where: { id: existingCorrelation.id },
          data: {
            coefficient: correlation.coefficient,
            dataPoints: correlation.dataPoints,
            relationship: correlation.relationship,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new correlation
        await prisma.correlation.create({
          data: {
            userId,
            biomarker1: correlation.biomarker1,
            biomarker2: correlation.biomarker2,
            coefficient: correlation.coefficient,
            dataPoints: correlation.dataPoints,
            relationship: correlation.relationship
          }
        });
      }
    }
  } catch (error) {
    console.error('Error saving correlations:', error);
    throw new Error('Failed to save correlations');
  }
}

/**
 * Generates insight text for a correlation
 * @param {Object} correlation - Correlation data
 * @returns {string} Insight description
 */
function generateCorrelationInsight(correlation) {
  const { biomarker1, biomarker2, coefficient, relationship } = correlation;
  
  let insight = `There is a ${relationship} correlation (${coefficient.toFixed(2)}) between ${biomarker1} and ${biomarker2}. `;
  
  if (coefficient > 0) {
    insight += `As ${biomarker1} increases, ${biomarker2} tends to increase as well. `;
  } else {
    insight += `As ${biomarker1} increases, ${biomarker2} tends to decrease. `;
  }
  
  // Add context based on specific biomarker pairs
  if ((biomarker1 === 'glucose' && biomarker2 === 'hba1c') || 
      (biomarker1 === 'hba1c' && biomarker2 === 'glucose')) {
    insight += 'This is an expected relationship as HbA1c reflects average glucose levels over time.';
  } else if ((biomarker1 === 'ldl' && biomarker2 === 'total cholesterol') || 
             (biomarker1 === 'total cholesterol' && biomarker2 === 'ldl')) {
    insight += 'This is expected as LDL is a component of total cholesterol.';
  } else if ((biomarker1 === 'creatinine' && biomarker2 === 'egfr') || 
             (biomarker1 === 'egfr' && biomarker2 === 'creatinine')) {
    insight += 'This inverse relationship is expected as eGFR is calculated using creatinine levels.';
  } else {
    insight += 'Consider discussing this relationship with your healthcare provider.';
  }
  
  return insight;
}

/**
 * Generates insight text for a trend
 * @param {Object} trend - Trend data
 * @returns {string} Insight description
 */
function generateTrendInsight(trend) {
  const { biomarkerName, direction, trend: trendData, timeSpan, unit, referenceRange } = trend;
  
  let insight = `${biomarkerName} has been ${direction} over the past ${Math.round(timeSpan.durationDays)} days `;
  insight += `(${trendData.percentChange > 0 ? '+' : ''}${trendData.percentChange}%). `;
  
  // Add context based on biomarker and direction
  if (direction === 'increasing') {
    if (trendData.percentChange > 20) {
      insight += `This represents a significant increase. `;
    }
    
    // Check if current value exceeds reference range
    const lastValue = trend.dataPoints[trend.dataPoints.length - 1];
    if (referenceRange.max && lastValue > referenceRange.max) {
      insight += `The current value is above the reference range. `;
    }
  } else if (direction === 'decreasing') {
    if (trendData.percentChange < -20) {
      insight += `This represents a significant decrease. `;
    }
    
    // Check if current value is below reference range
    const lastValue = trend.dataPoints[trend.dataPoints.length - 1];
    if (referenceRange.min && lastValue < referenceRange.min) {
      insight += `The current value is below the reference range. `;
    }
  }
  
  insight += 'Consider discussing this trend with your healthcare provider.';
  
  return insight;
}

/**
 * Generates combined insights from correlations and trends
 * @param {Array} correlations - Correlation data
 * @param {Array} trends - Trend data
 * @returns {Array} Combined insights
 */
function generateCombinedInsights(correlations, trends) {
  const insights = [];
  
  // Map trends by biomarker name for quick lookup
  const trendMap = new Map();
  trends.forEach(trend => {
    trendMap.set(trend.biomarkerName, trend);
  });
  
  // Look for correlations where both biomarkers have significant trends
  correlations.forEach(correlation => {
    const trend1 = trendMap.get(correlation.biomarker1);
    const trend2 = trendMap.get(correlation.biomarker2);
    
    if (trend1 && trend2 && 
        trend1.significance === 'significant' && 
        trend2.significance === 'significant') {
      
      insights.push({
        type: 'combined',
        title: `${correlation.biomarker1} and ${correlation.biomarker2} changing together`,
        description: `There is a ${correlation.relationship} correlation between ${correlation.biomarker1} and ${correlation.biomarker2}, and both are showing significant trends (${trend1.direction} and ${trend2.direction} respectively). This pattern may be worth discussing with your healthcare provider.`,
        strength: 'high',
        relatedBiomarkers: [correlation.biomarker1, correlation.biomarker2],
        actionable: true
      });
    }
  });
  
  return insights;
}

module.exports = {
  analyzeBiomarkerCorrelations,
  analyzeBiomarkerTrends,
  generateHealthInsights
};