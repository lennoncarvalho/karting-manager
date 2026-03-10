/**
 * Season Selector Component
 * Centralized component for season selection with theme management
 */

import { listSeasons } from '../services/api.js';
import { applySeasonTheme, setStoredSeasonId, getStoredSeasonId } from '../services/theme.js';
import { t } from '../services/i18n.js';

/**
 * Calculate the default season from a list of ongoing seasons
 * @param {Array} ongoingSeasons - Array of ongoing season objects
 * @returns {Object|null} The default season (most recent by start_date)
 */
function calculateDefaultSeason(ongoingSeasons) {
  if (!Array.isArray(ongoingSeasons) || ongoingSeasons.length === 0) {
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
 * Initialize a season selector element
 * @param {HTMLSelectElement} selectElement - The select element to initialize
 * @param {Object} options - Configuration options
 * @param {Function} options.onChange - Callback when season changes (receives season object)
 * @param {boolean} options.applyTheme - Whether to apply theme on selection (default: true)
 * @returns {Promise<Object|null>} The selected season object
 */
export async function initializeSeasonSelector(selectElement, options = {}) {
  const {
    onChange = null,
    applyTheme = true
  } = options;

  if (!selectElement) {
    console.error('Season selector element not found');
    return null;
  }

  let ongoingSeasons = [];
  let selectedSeason = null;

  try {
    // Show loading state
    selectElement.innerHTML = `<option value="">${t('common.status.loadingSeasons')}</option>`;
    selectElement.disabled = true;

    // Check if there's a stored season
    const storedId = getStoredSeasonId();

    // Fetch ongoing seasons
    ongoingSeasons = await listSeasons({
      order: { column: 'start_date', ascending: true },
      filters: [{ column: 'is_ongoing', operator: 'eq', value: true }]
    });

    if (!ongoingSeasons || ongoingSeasons.length === 0) {
      selectElement.innerHTML = `<option value="">${t('publicRankings.noAvailableSeasons')}</option>`;
      selectElement.disabled = true;
      return null;
    }

    // If there's a stored season ID, try to use it
    if (storedId) {
      // Check if stored season is in ongoing seasons
      selectedSeason = ongoingSeasons.find(s => String(s.id) === storedId);

      // If not in ongoing seasons, fetch it directly from database
      if (!selectedSeason) {
        try {
          // Use listSeasons instead of queryTable so it gets cached
          const storedSeasonData = await listSeasons({
            filters: [{ column: 'id', operator: 'eq', value: storedId }],
            limit: 1
          });
          if (storedSeasonData && storedSeasonData.length > 0) {
            selectedSeason = storedSeasonData[0];
            // Add it to the list so it appears in the dropdown
            ongoingSeasons = [selectedSeason, ...ongoingSeasons];
          }
        } catch (error) {
          console.warn('Could not fetch stored season:', error);
        }
      }
    }

    // If no stored season or couldn't fetch it, use default
    if (!selectedSeason) {
      selectedSeason = calculateDefaultSeason(ongoingSeasons);

      // Persist the default season (only on first load)
      if (selectedSeason) {
        setStoredSeasonId(selectedSeason.id);
      }
    }

    if (!selectedSeason) {
      selectElement.innerHTML = `<option value="">${t('publicRankings.noActiveSeasonFound')}</option>`;
      selectElement.disabled = true;
      return null;
    }

    // Populate select options
    selectElement.innerHTML = ongoingSeasons
      .map(season => `<option value="${season.id}">${season.name}</option>`)
      .join('');

    // Set the select element value
    selectElement.value = String(selectedSeason.id);
    selectElement.disabled = false;

    // Apply theme if requested
    if (applyTheme) {
      applySeasonTheme(selectedSeason);
    }

    // Set up change listener
    selectElement.addEventListener('change', async (event) => {
      const seasonId = event.target.value;
      if (!seasonId) return;

      const season = ongoingSeasons.find(s => String(s.id) === seasonId);
      if (!season) return;

      // Always persist when user explicitly selects
      setStoredSeasonId(seasonId);

      // Apply theme
      if (applyTheme) {
        applySeasonTheme(season);
      }

      // Call custom onChange callback
      if (onChange && typeof onChange === 'function') {
        await onChange(season);
      }
    });

    return selectedSeason;
  } catch (error) {
    console.error('Error initializing season selector:', error);
    selectElement.innerHTML = `<option value="">${t('common.errors.loadSeasons')}</option>`;
    selectElement.disabled = true;
    return null;
  }
}
