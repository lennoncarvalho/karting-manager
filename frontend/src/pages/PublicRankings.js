/**
 * Public Rankings Page
 * Displays driver rankings for active season
 */

import { listCups, listRaces, listRaceResultsByRaceIds } from '../services/api.js';
import { calculateRankings } from '../services/points.js';
import { applySeasonTheme, getActiveSeason } from '../services/theme.js';
import { showNotification } from '../utils/helpers.js';
import { getDriverImageHtml } from '../utils/image.js';

const PublicRankings = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <div>
          <h1 class="h3 mb-1">Driver Rankings</h1>
          <p class="text-muted mb-0" id="season-name">Loading season...</p>
        </div>
      </div>
      <ul class="nav nav-tabs flex-nowrap mb-3" id="rankings-tabs" role="tablist"></ul>
      <div class="tab-content" id="rankings-content"></div>
    `;
    container.appendChild(main);
    
    const seasonName = main.querySelector('#season-name');
    const tabs = main.querySelector('#rankings-tabs');
    const content = main.querySelector('#rankings-content');
    
    const renderLoading = () => {
      content.innerHTML = `
        <div class="d-flex align-items-center gap-2 text-muted">
          <div class="spinner-border spinner-border-sm" role="status"></div>
          <span>Loading rankings...</span>
        </div>
      `;
    };
    
    const renderEmpty = () => {
      content.innerHTML = `
        <div class="alert alert-info">No races or results available yet.</div>
      `;
    };
    
    try {
      renderLoading();
      const season = await getActiveSeason();
      if (!season) {
        seasonName.textContent = 'No active season found';
        renderEmpty();
        return;
      }
      seasonName.textContent = season.name;
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
      
      const sections = [
        {
          id: 'overall',
          label: 'Overall Championship',
          races: races.filter(race => race.affects_championship !== false)
        },
        ...cups.map(cup => ({
          id: `cup-${cup.id}`,
          label: cup.name,
          races: races.filter(race => race.cup_id === cup.id)
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
        const rankings = calculateRankings(section.races, sectionResults, {
          type: section.id === 'overall' ? 'overall' : 'cup'
        });
        
        if (!section.races.length || !sectionResults.length) {
          return `
            <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" id="${section.id}" role="tabpanel">
              <div class="alert alert-info">No results for this tab yet.</div>
            </div>
          `;
        }
        
        return `
          <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" id="${section.id}" role="tabpanel">
            <div class="table-responsive">
              <table class="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Driver</th>
                    <th>Best Position</th>
                    <th>Total Points</th>
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
                      <td>${driver.bestPosition || '-'}</td>
                      <td class="fw-semibold">${driver.totalPoints}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }).join('');
    } catch (error) {
      showNotification(error.message, 'error');
      renderEmpty();
    }
  }
};

export default PublicRankings;
