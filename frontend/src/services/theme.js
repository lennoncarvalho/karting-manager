/**
 * Theme Service
 * Applies season accent colors across the UI
 */

import { queryTable } from './api.js';
import { isValidHexColor } from '../utils/validation.js';

const SEASON_ACCENT_KEY = 'seasonAccent';
const SEASON_ACCENT_SEASON_KEY = 'seasonAccentSeasonId';
const SELECTED_SEASON_KEY = 'selectedSeasonId';

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage errors (private mode, quota, etc.).
  }
}

function cacheSeasonAccent(season) {
  if (!season || !isValidHexColor(season.accent_color)) {
    return;
  }
  const seasonId = season.id !== undefined && season.id !== null ? String(season.id) : '';
  const cachedSeasonId = readStorage(SEASON_ACCENT_SEASON_KEY);
  const cachedAccent = readStorage(SEASON_ACCENT_KEY);
  if (seasonId && cachedSeasonId === seasonId && cachedAccent === season.accent_color) {
    return;
  }
  writeStorage(SEASON_ACCENT_SEASON_KEY, seasonId);
  writeStorage(SEASON_ACCENT_KEY, season.accent_color);
}

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
    cacheSeasonAccent(season);
  }
}

export function getStoredSeasonId() {
  const stored = readStorage(SELECTED_SEASON_KEY);
  return stored ? String(stored) : null;
}

export function setStoredSeasonId(seasonId) {
  if (seasonId === undefined || seasonId === null) {
    return;
  }
  writeStorage(SELECTED_SEASON_KEY, String(seasonId));
}

export async function resolveSelectedSeason(seasons) {
  if (!Array.isArray(seasons) || seasons.length === 0) {
    return null;
  }
  const storedId = getStoredSeasonId();
  if (storedId) {
    const matched = seasons.find(season => String(season.id) === storedId);
    if (matched) {
      return matched;
    }
  }
  const ongoingSeasons = seasons.filter(season => season && season.is_ongoing);
  if (!ongoingSeasons.length) {
    return null;
  }
  return ongoingSeasons
    .slice()
    .sort((left, right) => {
      const leftDate = Date.parse(left.start_date || left.end_date || '') || 0;
      const rightDate = Date.parse(right.start_date || right.end_date || '') || 0;
      if (leftDate !== rightDate) {
        return rightDate - leftDate;
      }
      return String(right.id).localeCompare(String(left.id));
    })[0];
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
