/**
 * Public Rankings Page
 * Displays driver rankings for active season
 */

import { listCups, listRaces, listRaceResultsByRaceIds, listSeasons } from '../services/api.js';
import { calculateRankings, calculatePenaltyRankings } from '../services/points.js';
import { applySeasonTheme, getStoredSeasonId, resolveSelectedSeason, setStoredSeasonId } from '../services/theme.js';
import { showNotification } from '../utils/helpers.js';
import { getDriverImageHtml } from '../utils/image.js';
import { t } from '../services/i18n.js';

const PublicRankings = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 mb-3">
        <div class="h3 mb-1">${t('publicRankings.title')}</div>
        <div class="d-flex w-auto">
          <select class="form-select form-select-sm" id="season-name" aria-label="${t('publicRankings.seasonLabel')}">
            <option value="">${t('common.status.loadingSeasons')}</option>
          </select>
        </div>
      </div>
      <ul class="nav nav-tabs flex-nowrap mb-3" id="rankings-tabs" role="tablist"></ul>
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
      let seasons = await listSeasons({
        order: { column: 'start_date', ascending: true },
        filters: [{ column: 'is_ongoing', operator: 'eq', value: true }]
      });
      if (!seasons.length) {
        seasonSelect.innerHTML = `<option value="">${t('publicRankings.noAvailableSeasons')}</option>`;
        seasonSelect.disabled = true;
        renderEmpty(t('publicRankings.noAvailableSeasonsYet'));
        return;
      }
      
      const renderSeasonOptions = () => {
        seasonSelect.innerHTML = seasons
          .map(season => `<option value="${season.id}">${season.name}</option>`)
          .join('');
      };
      
      const findSeasonById = (seasonId) => (
        seasons.find(season => String(season.id) === String(seasonId))
      );
      
      const renderRankingsForSeason = async (season) => {
        renderLoading();
        applySeasonTheme(season);
        
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
        
        if (!raceResults.length) {
          renderEmpty();
          return;
        }
        
      const overallRaces = races.filter(race => race.affects_championship !== false);
        const sections = [
        {
          id: 'overall',
          label: t('publicRankings.overallChampionship'),
          races: overallRaces,
          ranking: 'points'
        },
        {
          id: 'penalties',
          label: t('publicRankings.penalties'),
          races: overallRaces,
          ranking: 'penalties'
        },
        ...cups.map(cup => ({
          id: `cup-${cup.id}`,
          label: cup.name,
          races: races.filter(race => race.cup_id === cup.id),
          ranking: 'points'
        }))
      ];
        
        tabs.innerHTML = sections.map((section, index) => `
          <li class="nav-item" role="presentation">
            <button class="nav-link ${index === 0 ? 'active' : ''} text-nowrap" id="${section.id}-tab" data-bs-toggle="tab" data-bs-target="#${section.id}" type="button" role="tab">
              ${section.label}
            </button>
          </li>
        `).join('');
        
        content.innerHTML = sections.map((section, index) => {
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
                    ${rankings.map(driver => `
                      <tr>
                        <td>${driver.rank}</td>
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
      
      const selectSeason = async (seasonId, { persist = false } = {}) => {
        let selectedSeason = findSeasonById(seasonId);
        if (!selectedSeason) {
          selectedSeason = await resolveSelectedSeason(seasons);
        }
        if (!selectedSeason) {
          seasonSelect.innerHTML = `<option value="">${t('publicRankings.noActiveSeasonFound')}</option>`;
          seasonSelect.disabled = true;
          renderEmpty(t('publicRankings.noActiveSeasonFound'));
          return;
        }
        seasonSelect.value = String(selectedSeason.id);
        seasonSelect.disabled = false;
        if (persist) {
          setStoredSeasonId(selectedSeason.id);
        }
        await renderRankingsForSeason(selectedSeason);
      };
      
      renderSeasonOptions();
      await selectSeason(getStoredSeasonId());
      
      seasonSelect.addEventListener('change', async (event) => {
        await selectSeason(event.target.value, { persist: true });
      });
    } catch (error) {
      showNotification(error.message, 'error');
      renderEmpty();
    }
  }
};

export default PublicRankings;
