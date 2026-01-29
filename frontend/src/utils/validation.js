/**
 * Validation Utilities
 * Form validation functions for user input
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate hex color format
 * @param {string} color - Hex color to validate (e.g., "#000000")
 * @returns {boolean} True if valid
 */
export function isValidHexColor(color) {
  if (!color || typeof color !== 'string') {
    return false;
  }
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color.trim());
}

/**
 * Validate date range (end date >= start date)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {boolean} True if valid
 */
export function isValidDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
}

/**
 * Validate that cup dates fall within season dates
 * @param {string|Date} seasonStart - Season start date
 * @param {string|Date} seasonEnd - Season end date
 * @param {string|Date} cupStart - Cup start date
 * @param {string|Date} cupEnd - Cup end date
 * @returns {boolean} True if valid
 */
export function isValidCupDateRange(seasonStart, seasonEnd, cupStart, cupEnd) {
  const seasonStartDate = new Date(seasonStart);
  const seasonEndDate = new Date(seasonEnd);
  const cupStartDate = new Date(cupStart);
  const cupEndDate = new Date(cupEnd);
  
  return cupStartDate >= seasonStartDate && 
         cupEndDate <= seasonEndDate &&
         cupEndDate >= cupStartDate;
}

/**
 * Validate required field
 * @param {*} value - Value to check
 * @returns {boolean} True if not empty
 */
export function isRequired(value) {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return true;
}

/**
 * Validate positive integer
 * @param {*} value - Value to validate
 * @returns {boolean} True if valid positive integer
 */
export function isPositiveInteger(value) {
  const num = parseInt(value, 10);
  return !isNaN(num) && num > 0;
}

/**
 * Validate lap time format (MM:SS.mmm or HH:MM:SS.mmm)
 * @param {string} lapTime - Lap time string
 * @returns {boolean} True if valid format
 */
export function isValidLapTime(lapTime) {
  if (!lapTime || typeof lapTime !== 'string') {
    return false;
  }
  // Match MM:SS.mmm or HH:MM:SS.mmm format
  const timeRegex = /^(\d{1,2}:)?\d{1,2}:\d{2}\.\d{1,3}$/;
  return timeRegex.test(lapTime.trim());
}

/**
 * Validate form and return errors
 * @param {Object} formData - Form data object
 * @param {Object} rules - Validation rules { field: [validators] }
 * @returns {Object} Errors object { field: errorMessage }
 */
export function validateForm(formData, rules) {
  const errors = {};
  
  for (const [field, validators] of Object.entries(rules)) {
    const value = formData[field];
    
    for (const validator of validators) {
      if (typeof validator === 'function') {
        if (!validator(value)) {
          errors[field] = `Invalid ${field}`;
          break;
        }
      } else if (typeof validator === 'object' && validator.validate) {
        if (!validator.validate(value, formData)) {
          errors[field] = validator.message || `Invalid ${field}`;
          break;
        }
      }
    }
  }
  
  return errors;
}
