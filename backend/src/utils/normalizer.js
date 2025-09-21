/**
 * Biomarker Normalization Utility
 * 
 * This module handles standardization of biomarker names, units, and reference ranges
 * across different lab providers and formats.
 */

// Standard biomarker mapping with LOINC codes
const biomarkerStandardization = {
  // Complete Blood Count (CBC)
  'hemoglobin': { code: '718-7', standardUnit: 'g/dL', category: 'CBC' },
  'hgb': { code: '718-7', standardUnit: 'g/dL', category: 'CBC' },
  'hb': { code: '718-7', standardUnit: 'g/dL', category: 'CBC' },
  'wbc': { code: '6690-2', standardUnit: '10^3/µL', category: 'CBC' },
  'white blood cell count': { code: '6690-2', standardUnit: '10^3/µL', category: 'CBC' },
  'rbc': { code: '789-8', standardUnit: '10^6/µL', category: 'CBC' },
  'red blood cell count': { code: '789-8', standardUnit: '10^6/µL', category: 'CBC' },
  'platelets': { code: '777-3', standardUnit: '10^3/µL', category: 'CBC' },
  'plt': { code: '777-3', standardUnit: '10^3/µL', category: 'CBC' },
  'hematocrit': { code: '4544-3', standardUnit: '%', category: 'CBC' },
  'hct': { code: '4544-3', standardUnit: '%', category: 'CBC' },
  'mcv': { code: '787-2', standardUnit: 'fL', category: 'CBC' },
  'mch': { code: '785-6', standardUnit: 'pg', category: 'CBC' },
  'mchc': { code: '786-4', standardUnit: 'g/dL', category: 'CBC' },
  'rdw': { code: '788-0', standardUnit: '%', category: 'CBC' },
  'neutrophils': { code: '751-8', standardUnit: '%', category: 'CBC' },
  'lymphocytes': { code: '731-0', standardUnit: '%', category: 'CBC' },
  'monocytes': { code: '742-7', standardUnit: '%', category: 'CBC' },
  'eosinophils': { code: '711-2', standardUnit: '%', category: 'CBC' },
  'basophils': { code: '704-7', standardUnit: '%', category: 'CBC' },
  
  // Comprehensive Metabolic Panel (CMP)
  'glucose': { code: '2345-7', standardUnit: 'mg/dL', category: 'CMP' },
  'bun': { code: '3094-0', standardUnit: 'mg/dL', category: 'CMP' },
  'blood urea nitrogen': { code: '3094-0', standardUnit: 'mg/dL', category: 'CMP' },
  'creatinine': { code: '2160-0', standardUnit: 'mg/dL', category: 'CMP' },
  'egfr': { code: '33914-3', standardUnit: 'mL/min/1.73m²', category: 'CMP' },
  'sodium': { code: '2951-2', standardUnit: 'mmol/L', category: 'CMP' },
  'na': { code: '2951-2', standardUnit: 'mmol/L', category: 'CMP' },
  'potassium': { code: '2823-3', standardUnit: 'mmol/L', category: 'CMP' },
  'k': { code: '2823-3', standardUnit: 'mmol/L', category: 'CMP' },
  'chloride': { code: '2075-0', standardUnit: 'mmol/L', category: 'CMP' },
  'cl': { code: '2075-0', standardUnit: 'mmol/L', category: 'CMP' },
  'co2': { code: '2028-9', standardUnit: 'mmol/L', category: 'CMP' },
  'calcium': { code: '17861-6', standardUnit: 'mg/dL', category: 'CMP' },
  'ca': { code: '17861-6', standardUnit: 'mg/dL', category: 'CMP' },
  'protein': { code: '2885-2', standardUnit: 'g/dL', category: 'CMP' },
  'albumin': { code: '1751-7', standardUnit: 'g/dL', category: 'CMP' },
  'globulin': { code: '2336-6', standardUnit: 'g/dL', category: 'CMP' },
  'a/g ratio': { code: '1759-0', standardUnit: '', category: 'CMP' },
  'bilirubin': { code: '1975-2', standardUnit: 'mg/dL', category: 'CMP' },
  'alt': { code: '1742-6', standardUnit: 'U/L', category: 'CMP' },
  'ast': { code: '1920-8', standardUnit: 'U/L', category: 'CMP' },
  'alp': { code: '6768-6', standardUnit: 'U/L', category: 'CMP' },
  
  // Lipid Panel
  'cholesterol': { code: '2093-3', standardUnit: 'mg/dL', category: 'Lipid' },
  'triglycerides': { code: '2571-8', standardUnit: 'mg/dL', category: 'Lipid' },
  'hdl': { code: '2085-9', standardUnit: 'mg/dL', category: 'Lipid' },
  'ldl': { code: '13457-7', standardUnit: 'mg/dL', category: 'Lipid' },
  'vldl': { code: '2091-7', standardUnit: 'mg/dL', category: 'Lipid' },
  
  // Thyroid Panel
  'tsh': { code: '3016-3', standardUnit: 'mIU/L', category: 'Thyroid' },
  't3': { code: '3053-6', standardUnit: 'ng/dL', category: 'Thyroid' },
  't4': { code: '3026-2', standardUnit: 'µg/dL', category: 'Thyroid' },
  'free t3': { code: '30123-3', standardUnit: 'pg/mL', category: 'Thyroid' },
  'free t4': { code: '3024-7', standardUnit: 'ng/dL', category: 'Thyroid' },
  
  // Urinalysis
  'urine glucose': { code: '5792-7', standardUnit: 'mg/dL', category: 'Urinalysis' },
  'urine protein': { code: '5804-0', standardUnit: 'mg/dL', category: 'Urinalysis' },
  'urine ph': { code: '5803-2', standardUnit: '', category: 'Urinalysis' },
  'urine specific gravity': { code: '5811-5', standardUnit: '', category: 'Urinalysis' },
  'urine ketones': { code: '5797-6', standardUnit: 'mg/dL', category: 'Urinalysis' },
  
  // Novel Kidney Markers
  'ngal': { code: '62238-1', standardUnit: 'ng/mL', category: 'Novel Kidney' },
  'kim-1': { code: '82642-1', standardUnit: 'ng/mL', category: 'Novel Kidney' },
  'timp-2': { code: '89579-9', standardUnit: 'ng/mL', category: 'Novel Kidney' },
  'igfbp7': { code: '89580-7', standardUnit: 'ng/mL', category: 'Novel Kidney' }
};

// Unit conversion functions
const unitConversions = {
  // Hemoglobin conversions
  'g/dL_to_g/L': (value) => value * 10,
  'g/L_to_g/dL': (value) => value / 10,
  'mmol/L_to_g/dL': (value) => value * 1.611,
  'g/dL_to_mmol/L': (value) => value / 1.611,
  
  // Glucose conversions
  'mg/dL_to_mmol/L': (value) => value * 0.0555,
  'mmol/L_to_mg/dL': (value) => value * 18.0182,
  
  // Creatinine conversions
  'mg/dL_to_µmol/L': (value) => value * 88.4,
  'µmol/L_to_mg/dL': (value) => value / 88.4,
  
  // Cholesterol conversions
  'mg/dL_to_mmol/L_chol': (value) => value * 0.0259,
  'mmol/L_to_mg/dL_chol': (value) => value * 38.67,
  
  // Triglycerides conversions
  'mg/dL_to_mmol/L_trig': (value) => value * 0.0113,
  'mmol/L_to_mg/dL_trig': (value) => value * 88.5,
  
  // Temperature conversions
  'F_to_C': (value) => (value - 32) * 5/9,
  'C_to_F': (value) => (value * 9/5) + 32
};

/**
 * Standardizes a biomarker name to its canonical form
 * @param {string} name - The biomarker name to standardize
 * @returns {object} The standardized biomarker information or null if not found
 */
function standardizeBiomarker(name) {
  if (!name) return null;
  
  const normalizedName = name.toLowerCase().trim();
  
  // Direct match
  if (biomarkerStandardization[normalizedName]) {
    return {
      standardName: normalizedName,
      ...biomarkerStandardization[normalizedName]
    };
  }
  
  // Fuzzy match - check if the name contains any of our known biomarkers
  for (const [key, value] of Object.entries(biomarkerStandardization)) {
    if (normalizedName.includes(key)) {
      return {
        standardName: key,
        ...value
      };
    }
  }
  
  // No match found
  return null;
}

/**
 * Converts a value from one unit to the standard unit for a biomarker
 * @param {number} value - The value to convert
 * @param {string} fromUnit - The source unit
 * @param {string} toUnit - The target unit
 * @returns {number} The converted value
 */
function convertUnit(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  
  const conversionKey = `${fromUnit}_to_${toUnit}`;
  const reverseConversionKey = `${toUnit}_to_${fromUnit}`;
  
  if (unitConversions[conversionKey]) {
    return unitConversions[conversionKey](value);
  } else if (unitConversions[reverseConversionKey]) {
    return 1 / unitConversions[reverseConversionKey](1 / value);
  }
  
  // If no conversion function is found, return the original value
  console.warn(`No conversion found from ${fromUnit} to ${toUnit}`);
  return value;
}

/**
 * Determines if a value is abnormal based on reference ranges
 * @param {number} value - The biomarker value
 * @param {number} minRange - The minimum reference range
 * @param {number} maxRange - The maximum reference range
 * @param {object} demographics - Optional demographic information for age/sex specific ranges
 * @returns {object} Status information including classification and severity
 */
function determineAbnormalStatus(value, minRange, maxRange, demographics = {}) {
  if (value < minRange) {
    const severity = (minRange - value) / minRange;
    return {
      status: 'below_range',
      severity: severity > 0.5 ? 'high' : 'low',
      percentFromRange: -Math.round((1 - (value / minRange)) * 100)
    };
  } else if (value > maxRange) {
    const severity = (value - maxRange) / maxRange;
    return {
      status: 'above_range',
      severity: severity > 0.5 ? 'high' : 'low',
      percentFromRange: Math.round(((value / maxRange) - 1) * 100)
    };
  } else {
    // Within range
    const rangeWidth = maxRange - minRange;
    const position = (value - minRange) / rangeWidth;
    
    if (position < 0.1) {
      return { status: 'borderline_low', severity: 'minimal', percentFromRange: 0 };
    } else if (position > 0.9) {
      return { status: 'borderline_high', severity: 'minimal', percentFromRange: 0 };
    } else {
      return { status: 'normal', severity: 'none', percentFromRange: 0 };
    }
  }
}

/**
 * Adjusts reference ranges based on demographic information
 * @param {string} biomarkerCode - The standardized biomarker code
 * @param {object} defaultRange - The default reference range
 * @param {object} demographics - Demographic information (age, sex)
 * @returns {object} Adjusted reference range
 */
function adjustReferenceRange(biomarkerCode, defaultRange, demographics) {
  const { age, sex } = demographics;
  
  // Example adjustments - in a real system, this would be more comprehensive
  if (biomarkerCode === '718-7') { // Hemoglobin
    if (sex === 'female') {
      return { min: 12.0, max: 15.5 };
    } else if (sex === 'male') {
      return { min: 13.5, max: 17.5 };
    }
  } else if (biomarkerCode === '2160-0') { // Creatinine
    if (sex === 'female') {
      return { min: 0.5, max: 1.1 };
    } else if (sex === 'male') {
      return { min: 0.7, max: 1.3 };
    }
  }
  
  // Return default if no adjustments needed
  return defaultRange;
}

/**
 * Normalizes a biomarker value from lab data
 * @param {object} biomarkerData - Raw biomarker data from lab report
 * @param {object} demographics - Optional demographic information
 * @returns {object} Normalized biomarker data
 */
function normalizeBiomarker(biomarkerData, demographics = {}) {
  const { name, value, unit, referenceMin, referenceMax } = biomarkerData;
  
  // Standardize the biomarker name and get metadata
  const standardBiomarker = standardizeBiomarker(name);
  
  if (!standardBiomarker) {
    return {
      ...biomarkerData,
      standardized: false,
      message: 'Unknown biomarker'
    };
  }
  
  // Convert value to standard unit if needed
  const standardValue = unit !== standardBiomarker.standardUnit
    ? convertUnit(value, unit, standardBiomarker.standardUnit)
    : value;
  
  // Use provided reference range or get default
  let refRange = {
    min: referenceMin,
    max: referenceMax
  };
  
  // If reference range is missing, adjust based on demographics
  if (!referenceMin || !referenceMax) {
    // Default ranges would be stored in a database or configuration
    const defaultRange = getDefaultReferenceRange(standardBiomarker.code);
    refRange = adjustReferenceRange(standardBiomarker.code, defaultRange, demographics);
  }
  
  // Determine abnormal status
  const abnormalStatus = determineAbnormalStatus(
    standardValue, 
    refRange.min, 
    refRange.max, 
    demographics
  );
  
  return {
    code: standardBiomarker.code,
    name: standardBiomarker.standardName,
    originalName: name,
    value: standardValue,
    originalValue: value,
    unit: standardBiomarker.standardUnit,
    originalUnit: unit,
    category: standardBiomarker.category,
    referenceMin: refRange.min,
    referenceMax: refRange.max,
    status: abnormalStatus.status,
    severity: abnormalStatus.severity,
    percentFromRange: abnormalStatus.percentFromRange,
    standardized: true
  };
}

/**
 * Gets default reference range for a biomarker
 * @param {string} biomarkerCode - The standardized biomarker code
 * @returns {object} Default reference range
 */
function getDefaultReferenceRange(biomarkerCode) {
  // This would typically come from a database
  // These are example ranges only
  const defaultRanges = {
    // CBC
    '718-7': { min: 12.0, max: 16.0 }, // Hemoglobin
    '6690-2': { min: 4.5, max: 11.0 }, // WBC
    '789-8': { min: 4.2, max: 5.8 }, // RBC
    '777-3': { min: 150, max: 450 }, // Platelets
    '4544-3': { min: 36, max: 48 }, // Hematocrit
    
    // CMP
    '2345-7': { min: 70, max: 99 }, // Glucose
    '3094-0': { min: 7, max: 20 }, // BUN
    '2160-0': { min: 0.6, max: 1.2 }, // Creatinine
    '2951-2': { min: 135, max: 145 }, // Sodium
    '2823-3': { min: 3.5, max: 5.0 }, // Potassium
    
    // Lipid
    '2093-3': { min: 0, max: 200 }, // Cholesterol
    '2571-8': { min: 0, max: 150 }, // Triglycerides
    '2085-9': { min: 40, max: 60 }, // HDL
    '13457-7': { min: 0, max: 100 }, // LDL
    
    // Thyroid
    '3016-3': { min: 0.4, max: 4.0 }, // TSH
    '3053-6': { min: 80, max: 200 }, // T3
    '3026-2': { min: 5.0, max: 12.0 }, // T4
    '30123-3': { min: 2.3, max: 4.2 }, // Free T3
    '3024-7': { min: 0.8, max: 1.8 } // Free T4
  };
  
  return defaultRanges[biomarkerCode] || { min: null, max: null };
}

module.exports = {
  standardizeBiomarker,
  convertUnit,
  normalizeBiomarker,
  determineAbnormalStatus,
  adjustReferenceRange
};