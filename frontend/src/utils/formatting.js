/**
 * Formatting Utilities
 * Date, time, and data formatting functions
 */

import { t } from '../services/i18n.js';

/**
 * Format date for display (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format datetime for display (YYYY-MM-DD HH:MM)
 * @param {string|Date} datetime - Datetime to format
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(datetime) {
  if (!datetime) return '';
  const d = new Date(datetime);
  if (isNaN(d.getTime())) return '';
  
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format date for input field (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date for HTML date input
 */
export function formatDateForInput(date) {
  return formatDate(date);
}

/**
 * Format datetime for input field (YYYY-MM-DDTHH:MM)
 * @param {string|Date} datetime - Datetime to format
 * @returns {string} Formatted datetime for HTML datetime-local input
 */
export function formatDateTimeForInput(datetime) {
  if (!datetime) return '';
  const d = new Date(datetime);
  if (isNaN(d.getTime())) return '';
  
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${dateStr}T${hours}:${minutes}`;
}

/**
 * Format lap time for display
 * @param {string} lapTime - Lap time string (MM:SS.mmm or HH:MM:SS.mmm)
 * @returns {string} Formatted lap time
 */
export function formatLapTime(lapTime) {
  if (!lapTime) return '';
  return lapTime;
}

/**
 * Format position with ordinal suffix (1st, 2nd, 3rd, etc.)
 * @param {number} position - Position number
 * @returns {string} Formatted position with suffix
 */
export function formatPosition(position) {
  if (!position || position < 1) return '';
  
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = position % 100;
  return position + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

/**
 * Format points with thousands separator
 * @param {number} points - Points value
 * @returns {string} Formatted points
 */
export function formatPoints(points) {
  if (points === null || points === undefined) return '0';
  return points.toLocaleString();
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 weeks")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins > 0) {
        return t('relative.inMinute', { count: diffMins });
      }
      return t('relative.minuteAgo', { count: Math.abs(diffMins) });
    }
    if (diffHours > 0) {
      return t('relative.inHour', { count: diffHours });
    }
    return t('relative.hourAgo', { count: Math.abs(diffHours) });
  }
  
  if (diffDays > 0) {
    return t('relative.inDay', { count: diffDays });
  }
  return t('relative.dayAgo', { count: Math.abs(diffDays) });
}
