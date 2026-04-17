/**
 * Theme Service
 * Applies season accent colors across the UI
 */

import * as Sentry from '@sentry/browser';
import { isValidHexColor } from '../utils/validation.js';

const SELECTED_SEASON_KEY = 'selectedSeasonId';

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    Sentry.captureException(error);
    // Ignore storage errors (private mode, quota, etc.).
  }
}

/**
 * Apply theme based on a season object
 * @param {Object|null} season - Season data
 */
export function applySeasonTheme(season) {
  if (season && season.accent_color && isValidHexColor(season.accent_color)) {
    document.documentElement.style.setProperty('--season-accent', season.accent_color);
  }
}

/**
 * Get the stored season ID from localStorage
 * @returns {string|null} The stored season ID
 */
export function getStoredSeasonId() {
  const stored = readStorage(SELECTED_SEASON_KEY);
  return stored ? String(stored) : null;
}

/**
 * Set the season ID in localStorage
 * @param {string|number} seasonId - The season ID to store
 */
export function setStoredSeasonId(seasonId) {
  if (seasonId === undefined || seasonId === null) {
    return;
  }
  writeStorage(SELECTED_SEASON_KEY, String(seasonId));
}
