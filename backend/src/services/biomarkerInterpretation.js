/**
 * Biomarker Interpretation Service
 * 
 * This service analyzes biomarker values against reference ranges and provides
 * interpretations, significance, and context for health report data.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Interprets a single biomarker value
 * @param {object} biomarker - Normalized biomarker data
 * @returns {object} Interpretation data
 */
function interpretBiomarker(biomarker) {
  const { name, value, unit, referenceMin, referenceMax, status, category } = biomarker;
  
  // Get interpretation based on status
  const interpretation = getStatusInterpretation(name, status, value, referenceMin, referenceMax);
  
  // Get clinical significance
  const significance = getClinicalSignificance(name, status, category);
  
  // Get context information
  const context = getBiomarkerContext(name, category);
  
  return {
    ...biomarker,
    interpretation,
    significance,
    context
  };
}

/**
 * Interprets a full health report with multiple biomarkers
 * @param {Array} biomarkers - Array of normalized biomarker data
 * @param {object} options - Additional options
 * @returns {object} Full report interpretation
 */
function interpretHealthReport(biomarkers, options = {}) {
  // Interpret each biomarker
  const interpretedBiomarkers = biomarkers.map(biomarker => 
    interpretBiomarker(biomarker)
  );
  
  // Group biomarkers by category
  const categorizedBiomarkers = {};
  interpretedBiomarkers.forEach(biomarker => {
    if (!categorizedBiomarkers[biomarker.category]) {
      categorizedBiomarkers[biomarker.category] = [];
    }
    categorizedBiomarkers[biomarker.category].push(biomarker);
  });
  
  // Identify patterns across biomarkers
  const patterns = identifyBiomarkerPatterns(interpretedBiomarkers);
  
  // Generate summary
  const summary = generateReportSummary(interpretedBiomarkers, patterns);
  
  return {
    biomarkers: interpretedBiomarkers,
    categorizedBiomarkers,
    patterns,
    summary
  };
}

/**
 * Gets interpretation text based on biomarker status
 * @param {string} name - Biomarker name
 * @param {string} status - Status (normal, below_range, above_range, etc.)
 * @param {number} value - Biomarker value
 * @param {number} min - Reference minimum
 * @param {number} max - Reference maximum
 * @returns {string} Interpretation text
 */
function getStatusInterpretation(name, status, value, min, max) {
  switch (status) {
    case 'normal':
      return `${name} is within the normal reference range.`;
    
    case 'borderline_low':
      return `${name} is at the lower end of the normal range. This may be normal for you, but worth monitoring.`;
    
    case 'borderline_high':
      return `${name} is at the higher end of the normal range. This may be normal for you, but worth monitoring.`;
    
    case 'below_range':
      const belowPercent = min ? Math.round((1 - (value / min)) * 100) : null;
      return `${name} is below the reference range${belowPercent ? ` by approximately ${belowPercent}%` : ''}.`;
    
    case 'above_range':
      const abovePercent = max ? Math.round(((value / max) - 1) * 100) : null;
      return `${name} is above the reference range${abovePercent ? ` by approximately ${abovePercent}%` : ''}.`;
    
    default:
      return `${name} status could not be determined.`;
  }
}

/**
 * Gets clinical significance based on biomarker and status
 * @param {string} name - Biomarker name
 * @param {string} status - Status (normal, below_range, above_range, etc.)
 * @param {string} category - Biomarker category
 * @returns {object} Significance information
 */
function getClinicalSignificance(name, status, category) {
  // This would be expanded with a comprehensive database of biomarker interpretations
  // The following are simplified examples
  
  const biomarkerInfo = getBiomarkerInfo(name.toLowerCase());
  
  if (!biomarkerInfo) {
    return {
      description: "No specific significance information available for this biomarker.",
      level: "unknown",
      factors: []
    };
  }
  
  if (status === 'normal') {
    return {
      description: `${name} is within normal limits, suggesting normal ${biomarkerInfo.function}.`,
      level: "normal",
      factors: []
    };
  }
  
  // Handle abnormal values
  if (status.includes('below')) {
    return {
      description: biomarkerInfo.lowDescription || `Low ${name} may indicate ${biomarkerInfo.lowIndication.join(', ')}.`,
      level: status.includes('borderline') ? "mild" : "significant",
      factors: biomarkerInfo.lowFactors || []
    };
  }
  
  if (status.includes('above')) {
    return {
      description: biomarkerInfo.highDescription || `High ${name} may indicate ${biomarkerInfo.highIndication.join(', ')}.`,
      level: status.includes('borderline') ? "mild" : "significant",
      factors: biomarkerInfo.highFactors || []
    };
  }
  
  return {
    description: "The significance of this result is unclear.",
    level: "unknown",
    factors: []
  };
}

/**
 * Gets context information for a biomarker
 * @param {string} name - Biomarker name
 * @param {string} category - Biomarker category
 * @returns {object} Context information
 */
function getBiomarkerContext(name, category) {
  const biomarkerInfo = getBiomarkerInfo(name.toLowerCase());
  
  if (!biomarkerInfo) {
    return {
      description: `${name} is a biomarker in the ${category} category.`,
      relatedBiomarkers: [],
      confoundingFactors: [],
      whenToRetest: "As advised by your healthcare provider."
    };
  }
  
  return {
    description: biomarkerInfo.description || `${name} is a biomarker in the ${category} category.`,
    relatedBiomarkers: biomarkerInfo.relatedBiomarkers || [],
    confoundingFactors: biomarkerInfo.confoundingFactors || [],
    whenToRetest: biomarkerInfo.whenToRetest || "As advised by your healthcare provider."
  };
}

/**
 * Identifies patterns across multiple biomarkers
 * @param {Array} biomarkers - Array of interpreted biomarkers
 * @returns {Array} Identified patterns
 */
function identifyBiomarkerPatterns(biomarkers) {
  const patterns = [];
  
  // Map biomarkers by name for easy lookup
  const biomarkerMap = {};
  biomarkers.forEach(b => {
    biomarkerMap[b.name.toLowerCase()] = b;
  });
  
  // Check for anemia patterns
  if (biomarkerMap['hemoglobin'] && biomarkerMap['hemoglobin'].status.includes('below')) {
    const anemiaPattern = {
      name: 'Potential Anemia Pattern',
      description: 'Your results show low hemoglobin, which may indicate anemia.',
      confidence: 'medium',
      biomarkers: ['hemoglobin'],
      recommendation: 'Consider discussing these results with your healthcare provider.'
    };
    
    // Check for additional anemia indicators
    if (biomarkerMap['hematocrit'] && biomarkerMap['hematocrit'].status.includes('below')) {
      anemiaPattern.biomarkers.push('hematocrit');
      anemiaPattern.confidence = 'high';
      anemiaPattern.description = 'Your results show low hemoglobin and hematocrit, which may indicate anemia.';
    }
    
    if (biomarkerMap['mcv']) {
      if (biomarkerMap['mcv'].status.includes('below')) {
        anemiaPattern.biomarkers.push('mcv');
        anemiaPattern.description += ' The low MCV suggests this may be microcytic anemia, often associated with iron deficiency.';
      } else if (biomarkerMap['mcv'].status.includes('above')) {
        anemiaPattern.biomarkers.push('mcv');
        anemiaPattern.description += ' The high MCV suggests this may be macrocytic anemia, which can be associated with vitamin B12 or folate deficiency.';
      }
    }
    
    patterns.push(anemiaPattern);
  }
  
  // Check for metabolic syndrome pattern
  const metabolicRiskFactors = {
    'glucose': (b) => b.status.includes('above'),
    'triglycerides': (b) => b.status.includes('above'),
    'hdl': (b) => b.status.includes('below'),
    'ldl': (b) => b.status.includes('above')
  };
  
  let metabolicRiskCount = 0;
  const presentMetabolicFactors = [];
  
  for (const [name, checkFn] of Object.entries(metabolicRiskFactors)) {
    if (biomarkerMap[name] && checkFn(biomarkerMap[name])) {
      metabolicRiskCount++;
      presentMetabolicFactors.push(name);
    }
  }
  
  if (metabolicRiskCount >= 2) {
    patterns.push({
      name: 'Potential Metabolic Risk Pattern',
      description: `Your results show ${metabolicRiskCount} factors that may be associated with metabolic risk: ${presentMetabolicFactors.join(', ')}.`,
      confidence: metabolicRiskCount >= 3 ? 'high' : 'medium',
      biomarkers: presentMetabolicFactors,
      recommendation: 'Consider discussing lifestyle factors such as diet and exercise with your healthcare provider.'
    });
  }
  
  // Check for thyroid patterns
  if (biomarkerMap['tsh']) {
    if (biomarkerMap['tsh'].status.includes('above')) {
      const thyroidPattern = {
        name: 'Elevated TSH Pattern',
        description: 'Your results show elevated TSH, which may indicate the thyroid is being stimulated to produce more hormone.',
        confidence: 'medium',
        biomarkers: ['tsh'],
        recommendation: 'Consider discussing these results with your healthcare provider.'
      };
      
      if (biomarkerMap['free t4'] && biomarkerMap['free t4'].status.includes('below')) {
        thyroidPattern.biomarkers.push('free t4');
        thyroidPattern.confidence = 'high';
        thyroidPattern.description = 'Your results show elevated TSH with low Free T4, which may be consistent with hypothyroidism.';
      }
      
      patterns.push(thyroidPattern);
    } else if (biomarkerMap['tsh'].status.includes('below')) {
      const thyroidPattern = {
        name: 'Low TSH Pattern',
        description: 'Your results show low TSH, which may indicate reduced thyroid stimulation.',
        confidence: 'medium',
        biomarkers: ['tsh'],
        recommendation: 'Consider discussing these results with your healthcare provider.'
      };
      
      if (biomarkerMap['free t4'] && biomarkerMap['free t4'].status.includes('above')) {
        thyroidPattern.biomarkers.push('free t4');
        thyroidPattern.confidence = 'high';
        thyroidPattern.description = 'Your results show low TSH with high Free T4, which may be consistent with hyperthyroidism.';
      }
      
      patterns.push(thyroidPattern);
    }
  }
  
  // Check for kidney function patterns
  if (biomarkerMap['creatinine'] && biomarkerMap['creatinine'].status.includes('above')) {
    const kidneyPattern = {
      name: 'Elevated Creatinine Pattern',
      description: 'Your results show elevated creatinine, which may indicate reduced kidney function.',
      confidence: 'medium',
      biomarkers: ['creatinine'],
      recommendation: 'Consider discussing these results with your healthcare provider.'
    };
    
    if (biomarkerMap['bun'] && biomarkerMap['bun'].status.includes('above')) {
      kidneyPattern.biomarkers.push('bun');
      kidneyPattern.confidence = 'high';
      kidneyPattern.description = 'Your results show elevated creatinine and BUN, which may indicate reduced kidney function.';
    }
    
    if (biomarkerMap['egfr'] && biomarkerMap['egfr'].status.includes('below')) {
      kidneyPattern.biomarkers.push('egfr');
      kidneyPattern.confidence = 'high';
      kidneyPattern.description = 'Your results show reduced eGFR with elevated creatinine, which may indicate reduced kidney function.';
    }
    
    patterns.push(kidneyPattern);
  }
  
  return patterns;
}

/**
 * Generates a summary of the health report
 * @param {Array} biomarkers - Array of interpreted biomarkers
 * @param {Array} patterns - Identified patterns
 * @returns {object} Report summary
 */
function generateReportSummary(biomarkers, patterns) {
  // Count biomarkers by status
  const statusCounts = {
    normal: 0,
    borderline: 0,
    abnormal: 0
  };
  
  biomarkers.forEach(b => {
    if (b.status === 'normal') {
      statusCounts.normal++;
    } else if (b.status.includes('borderline')) {
      statusCounts.borderline++;
    } else {
      statusCounts.abnormal++;
    }
  });
  
  // Generate summary text
  let summaryText = `This report contains ${biomarkers.length} biomarkers. `;
  summaryText += `${statusCounts.normal} are within normal range, `;
  summaryText += `${statusCounts.borderline} are borderline, and `;
  summaryText += `${statusCounts.abnormal} are outside the reference range.`;
  
  if (patterns.length > 0) {
    summaryText += ` ${patterns.length} potential patterns were identified that may warrant attention.`;
  }
  
  // List abnormal biomarkers
  const abnormalBiomarkers = biomarkers.filter(b => 
    !b.status.includes('normal') && !b.status.includes('borderline')
  );
  
  const abnormalList = abnormalBiomarkers.map(b => ({
    name: b.name,
    value: b.value,
    unit: b.unit,
    status: b.status
  }));
  
  return {
    text: summaryText,
    statusCounts,
    abnormalBiomarkers: abnormalList,
    patternCount: patterns.length
  };
}

/**
 * Gets detailed information about a specific biomarker
 * @param {string} name - Biomarker name (lowercase)
 * @returns {object|null} Biomarker information or null if not found
 */
function getBiomarkerInfo(name) {
  // This would be stored in a database in a real application
  // The following are simplified examples
  const biomarkerDatabase = {
    'hemoglobin': {
      description: 'Hemoglobin is a protein in red blood cells that carries oxygen throughout the body.',
      function: 'oxygen transport in the blood',
      lowIndication: ['anemia', 'blood loss', 'nutritional deficiencies', 'chronic diseases'],
      highIndication: ['polycythemia', 'dehydration', 'lung disease', 'living at high altitude'],
      lowFactors: ['iron deficiency', 'vitamin B12 deficiency', 'folate deficiency', 'chronic inflammation'],
      highFactors: ['dehydration', 'smoking', 'certain genetic conditions', 'lung disease'],
      relatedBiomarkers: ['hematocrit', 'red blood cell count', 'mcv', 'mch', 'mchc'],
      confoundingFactors: ['recent blood loss', 'pregnancy', 'high altitude', 'dehydration'],
      whenToRetest: 'Within 1-3 months if abnormal, or as advised by your healthcare provider.'
    },
    
    'glucose': {
      description: 'Glucose is a sugar that serves as the primary source of energy for the body.',
      function: 'energy metabolism',
      lowIndication: ['hypoglycemia', 'insulin excess', 'liver disease', 'adrenal insufficiency'],
      highIndication: ['diabetes', 'prediabetes', 'stress', 'certain medications'],
      lowFactors: ['fasting', 'excessive insulin', 'alcohol consumption', 'certain medications'],
      highFactors: ['carbohydrate consumption', 'stress', 'inactivity', 'insulin resistance'],
      relatedBiomarkers: ['hba1c', 'insulin', 'c-peptide'],
      confoundingFactors: ['recent meals', 'stress', 'medications', 'time of day'],
      whenToRetest: 'Within 3 months if abnormal, or as advised by your healthcare provider.'
    },
    
    'tsh': {
      description: 'Thyroid Stimulating Hormone (TSH) is produced by the pituitary gland and regulates the thyroid gland.',
      function: 'thyroid regulation',
      lowIndication: ['hyperthyroidism', 'excessive thyroid hormone replacement', 'pituitary dysfunction'],
      highIndication: ['hypothyroidism', 'iodine deficiency', 'certain medications'],
      lowFactors: ['hyperthyroidism', 'excessive thyroid medication', 'pregnancy', 'certain medications'],
      highFactors: ['hypothyroidism', 'iodine deficiency', 'autoimmune thyroiditis', 'stress'],
      relatedBiomarkers: ['free t4', 'free t3', 't4', 't3'],
      confoundingFactors: ['medications', 'illness', 'pregnancy', 'time of day'],
      whenToRetest: 'Within 6-8 weeks if abnormal, or as advised by your healthcare provider.'
    },
    
    'creatinine': {
      description: 'Creatinine is a waste product from muscle metabolism that is filtered by the kidneys.',
      function: 'kidney filtration',
      lowIndication: ['decreased muscle mass', 'liver disease', 'protein restriction'],
      highIndication: ['reduced kidney function', 'dehydration', 'muscle damage', 'certain medications'],
      lowFactors: ['low muscle mass', 'malnutrition', 'liver disease'],
      highFactors: ['reduced kidney function', 'dehydration', 'high protein diet', 'certain medications'],
      relatedBiomarkers: ['bun', 'egfr', 'cystatin c', 'urine albumin'],
      confoundingFactors: ['muscle mass', 'diet', 'hydration status', 'medications'],
      whenToRetest: 'Within 1-3 months if abnormal, or as advised by your healthcare provider.'
    },
    
    'cholesterol': {
      description: 'Cholesterol is a waxy substance found in the blood that is necessary for building cells.',
      function: 'cell membrane structure and hormone production',
      lowIndication: ['malnutrition', 'liver disease', 'hyperthyroidism'],
      highIndication: ['increased cardiovascular risk', 'genetic factors', 'diet', 'certain medications'],
      lowFactors: ['malnutrition', 'inflammation', 'liver disease'],
      highFactors: ['diet high in saturated fats', 'genetic factors', 'obesity', 'hypothyroidism'],
      relatedBiomarkers: ['ldl', 'hdl', 'triglycerides', 'non-hdl cholesterol'],
      confoundingFactors: ['recent meals', 'medications', 'illness', 'pregnancy'],
      whenToRetest: 'Within 3-6 months if abnormal, or as advised by your healthcare provider.'
    }
  };
  
  return biomarkerDatabase[name] || null;
}

module.exports = {
  interpretBiomarker,
  interpretHealthReport,
  identifyBiomarkerPatterns
};