/**
 * Public Rankings Page
 * Displays driver rankings for active season
 */

import { listCups, listRaces, listRaceResultsByRaceIds } from '../services/api.js';
import { calculateRankings, calculatePenaltyRankings, parseLapTime } from '../services/points.js';
import { initializeSeasonSelector } from '../components/seasonSelector.js';
import { showNotification } from '../utils/helpers.js';
import { getDriverImageHtml } from '../utils/image.js';
import { formatDateTime } from '../utils/formatting.js';
import { t } from '../services/i18n.js';

const PublicRankings = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="d-flex gap-2 mb-3">
        <div class="h5 mb-0">${t('publicRankings.title')}</div>
        <div class="d-flex w-auto">
          <select class="form-select form-select-sm" id="season-name" aria-label="${t('publicRankings.seasonLabel')}">
            <option value="">${t('common.status.loadingSeasons')}</option>
          </select>
        </div>
      </div>
      <ul class="nav nav-tabs" id="rankings-tabs" role="tablist"></ul>
      <div class="tab-content" id="rankings-content"></div>
    `;
    container.appendChild(main);
    
    const seasonSelect = main.querySelector('#season-name');
    const tabs = main.querySelector('#rankings-tabs');
    const content = main.querySelector('#rankings-content');
    
    const renderLoading = () => {
      tabs.innerHTML = '';
      content.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <div class="spinner-border spinner-border-sm" role="status"></div>
          <span>${t('common.status.loadingRankings')}</span>
        </div>
      `;
    };
    
    const renderEmpty = (message = t('publicRankings.noRacesOrResults')) => {
      tabs.innerHTML = '';
      content.innerHTML = `
        <div class="alert alert-info">${message}</div>
      `;
    };
    
    try {
      renderLoading();

      const renderRankingsForSeason = async (season) => {
        renderLoading();

        const cups = await listCups({ seasonId: season.id, order: { column: 'start_date', ascending: true } });
        const races = await listRaces({
          filters: [{ column: 'season_id', operator: 'eq', value: season.id }],
          order: { column: 'race_datetime', ascending: true }
        });

        if (!races.length) {
          renderEmpty();
          return;
        }

        const raceResults = await listRaceResultsByRaceIds(races.map(race => race.id));

        const overallRaces = races.filter(race => race.affects_championship !== false);
        const raceResultsByRace = new Map();
        raceResults.forEach((result) => {
          if (!raceResultsByRace.has(result.race_id)) {
            raceResultsByRace.set(result.race_id, []);
          }
          raceResultsByRace.get(result.race_id).push(result);
        });
        const now = Date.now();

        const getDriverDisplay = (result) => {
          if (!result) return null;
          const driver = result.drivers || {};
          return {
            name: driver.name || t('common.misc.unknown'),
            picture: driver.picture_url || null,
            seed: result.driver_id || driver.email || driver.name || null
          };
        };

        const renderDriverCell = (driver) => {
          if (!driver) return '-';
          return `
            <div class="d-flex align-items-center gap-2">
              ${getDriverImageHtml({
                src: driver.picture,
                seed: driver.seed || driver.name,
                alt: driver.name,
                className: 'rounded-circle',
                size: 32
              })}
              <span>${driver.name}</span>
            </div>
          `;
        };

        const getWinnerDriver = (results) => {
          if (!results || !results.length) return null;
          const winner = results.find(result => Number(result.finish_position) === 1);
          return getDriverDisplay(winner);
        };

        const getFastestLapDriver = (results) => {
          if (!results || !results.length) return null;
          let best = null;
          results.forEach((result) => {
            const time = parseLapTime(result.best_lap_time);
            if (time === null) return;
            const finish = Number.isFinite(Number(result.finish_position)) ? Number(result.finish_position) : Number.MAX_SAFE_INTEGER;
            if (!best || time < best.time || (time === best.time && finish < best.finish)) {
              best = { result, time, finish };
            }
          });
          return best ? getDriverDisplay(best.result) : null;
        };

        const getRaceTimestamp = (race) => {
          if (!race || !race.race_datetime) return null;
          const time = new Date(race.race_datetime).getTime();
          return Number.isNaN(time) ? null : time;
        };

        const sections = [
          {
            id: 'calendar',
            label: t('publicRankings.calendar'),
            type: 'calendar',
            races
          },
          {
            id: 'overall',
            label: t('publicRankings.overallChampionship'),
            races: overallRaces,
            ranking: 'points'
          },
          ...cups.map(cup => ({
            id: `cup-${cup.id}`,
            label: cup.name,
            races: races.filter(race => race.cup_id === cup.id),
            ranking: 'points'
          })),
          {
            id: 'penalties',
            label: t('publicRankings.penalties'),
            races: overallRaces,
            ranking: 'penalties'
          }
        ];
        
        tabs.innerHTML = sections.map((section, index) => `
          <li class="nav-item" role="presentation">
            <button class="nav-link ${index === 0 ? 'active' : ''} text-nowrap" id="${section.id}-tab" data-bs-toggle="tab" data-bs-target="#${section.id}" type="button" role="tab">
              ${section.label}
            </button>
          </li>
        `).join('');
        
        content.innerHTML = sections.map((section, index) => {
          if (section.type === 'calendar') {
            const orderedRaces = [...section.races].sort((left, right) => {
              const leftTime = getRaceTimestamp(left) ?? Number.MAX_SAFE_INTEGER;
              const rightTime = getRaceTimestamp(right) ?? Number.MAX_SAFE_INTEGER;
              if (leftTime !== rightTime) return leftTime - rightTime;
              return String(left.name || '').localeCompare(String(right.name || ''));
            });
            return `
              <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" id="${section.id}" role="tabpanel">
                <div class="table-responsive">
                  <table class="table table-striped align-middle">
                    <thead>
                      <tr>
                        <th>${t('publicRankings.table.raceDate')}</th>
                        <th>${t('publicRankings.table.raceName')}</th>
                        <th>${t('publicRankings.table.winner')}</th>
                        <th>${t('publicRankings.table.fastestLap')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${orderedRaces.map((race) => {
                        const raceTime = getRaceTimestamp(race);
                        const isCompleted = raceTime !== null && raceTime <= now;
                        const results = raceResultsByRace.get(race.id) || [];
                        const showResults = isCompleted && results.length;
                        const winner = showResults ? getWinnerDriver(results) : null;
                        const fastest = showResults ? getFastestLapDriver(results) : null;
                        return `
                          <tr>
                            <td>${race.race_datetime ? formatDateTime(race.race_datetime) : '-'}</td>
                            <td>
                              ${race.id ? `<a class="fw-semibold text-decoration-underline" href="#/admin/race?id=${race.id}">${race.name || '-'}</a>` : (race.name || '-')}
                              <small>${race.location || '-'}</small>
                            </td>
                            <td>${renderDriverCell(winner)}</td>
                            <td>${renderDriverCell(fastest)}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            `;
          }

          const sectionResults = raceResults.filter(result => section.races.some(race => race.id === result.race_id));
          const rankings = section.ranking === 'penalties'
            ? calculatePenaltyRankings(section.races, sectionResults, { type: 'overall' })
            : calculateRankings(section.races, sectionResults, {
              type: section.id === 'overall' ? 'overall' : 'cup'
            });
          
          if (!section.races.length || !sectionResults.length) {
            return `
              <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" id="${section.id}" role="tabpanel">
                <div class="alert alert-info">${t('publicRankings.noResultsTab')}</div>
              </div>
            `;
          }
          
          return `
            <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" id="${section.id}" role="tabpanel">
              <div class="table-responsive">
                <table class="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>${t('publicRankings.table.position')}</th>
                      <th>${t('publicRankings.table.driver')}</th>
                      <th>${t('publicRankings.table.totalPoints')}</th>
                      <th>${t('publicRankings.table.penalties')}</th>
                      <th>${t('publicRankings.table.bestPosition')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rankings.map((driver, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>
                          <div class="d-flex align-items-center gap-2">
                            ${getDriverImageHtml({
                              src: driver.picture,
                              seed: driver.driverId || driver.name,
                              alt: driver.name,
                              className: 'rounded-circle',
                              size: 36
                            })}
                            <span>${driver.name}</span>
                          </div>
                        </td>
                        <td class="fw-semibold">${driver.totalPoints}</td>
                        <td>${driver.penalties || 0}</td>
                        <td>${driver.bestPosition || '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }).join('');
      };

      // Initialize the season selector component
      const selectedSeason = await initializeSeasonSelector(seasonSelect, {
        applyTheme: true,
        onChange: async (season) => {
          // Re-render rankings when season changes
          await renderRankingsForSeason(season);
        }
      });

      // Render rankings for the initially selected season
      if (selectedSeason) {
        await renderRankingsForSeason(selectedSeason);
      } else {
        renderEmpty(t('publicRankings.noAvailableSeasonsYet'));
      }
    } catch (error) {
      showNotification(error.message, 'error');
      renderEmpty();
    }
  }
};

export default PublicRankings;
