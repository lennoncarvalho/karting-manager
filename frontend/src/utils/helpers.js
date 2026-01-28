/**
 * General Helper Functions
 * Utility functions used throughout the application
 */

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Get URL parameter value
 * @param {string} name - Parameter name
 * @returns {string|null} Parameter value or null
 */
export function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Set URL parameter
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 */
export function setUrlParameter(name, value) {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  window.history.pushState({}, '', url);
}

/**
 * Remove URL parameter
 * @param {string} name - Parameter name
 */
export function removeUrlParameter(name) {
  const url = new URL(window.location);
  url.searchParams.delete(name);
  window.history.pushState({}, '', url);
}

/**
 * Show notification/toast message
 * @param {string} message - Message to show
 * @param {string} type - Type: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showNotification(message, type = 'info', duration = 3000) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  notification.style.zIndex = '9999';
  notification.style.minWidth = '300px';
  notification.setAttribute('role', 'alert');
  
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);
}

/**
 * Mark a form control as invalid with message
 * @param {HTMLElement} field - Input/select/textarea element
 * @param {string} message - Validation message
 */
export function setFieldInvalid(field, message) {
  if (!field) return;
  field.classList.add('is-invalid');
  const parent = field.parentElement;
  if (!parent) return;
  let feedback = parent.querySelector('.invalid-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    parent.appendChild(feedback);
  }
  feedback.textContent = message;
}

/**
 * Clear invalid state from a form control
 * @param {HTMLElement} field - Input/select/textarea element
 */
export function clearFieldInvalid(field) {
  if (!field) return;
  field.classList.remove('is-invalid');
  const parent = field.parentElement;
  if (!parent) return;
  const feedback = parent.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.textContent = '';
  }
}

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} True if confirmed
 */
export function showConfirmation(message) {
  return new Promise((resolve) => {
    const confirmed = window.confirm(message);
    resolve(confirmed);
  });
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

/**
 * Generate random ID (simple UUID-like)
 * @returns {string} Random ID
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
