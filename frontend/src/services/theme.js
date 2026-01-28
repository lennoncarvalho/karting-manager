/**
 * Theme Service
 * Applies season accent colors across the UI
 */

import { queryTable } from './api.js';
import { isValidHexColor } from '../utils/validation.js';

/**
 * Set CSS custom property for season accent
 * @param {string} color - Hex color
 */
export function setSeasonAccent(color) {
  if (!isValidHexColor(color)) {
    return;
  }
  document.documentElement.style.setProperty('--season-accent', color);
}

/**
 * Apply theme based on a season object
 * @param {Object|null} season - Season data
 */
export function applySeasonTheme(season) {
  if (season && season.accent_color) {
    setSeasonAccent(season.accent_color);
  }
}

/**
 * Determine the active season (ongoing preferred, else end_date >= today, else most recent)
 * @returns {Promise<Object|null>}
 */
export async function getActiveSeason() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const ongoing = await queryTable('seasons', {
      filters: [{ column: 'is_ongoing', operator: 'eq', value: true }],
      order: { column: 'start_date', ascending: false },
      limit: 1
    });
    
    if (ongoing && ongoing.length > 0) {
      return ongoing[0];
    }
    
    const active = await queryTable('seasons', {
      filters: [{ column: 'end_date', operator: 'gte', value: today }],
      order: { column: 'end_date', ascending: true }
    });
    
    if (active && active.length > 0) {
      return active[0];
    }
    
    const recent = await queryTable('seasons', {
      order: { column: 'end_date', ascending: false },
      limit: 1
    });
    
    return recent && recent.length > 0 ? recent[0] : null;
  } catch (error) {
    console.error('Error fetching active season:', error);
    return null;
  }
}

/**
 * Fetch active season and apply its theme
 * @returns {Promise<void>}
 */
export async function applyThemeForActiveSeason() {
  const season = await getActiveSeason();
  applySeasonTheme(season);
}
