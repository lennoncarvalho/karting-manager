/**
 * Race Detail Page
 * Display race info and manage race results
 */

import { renderNavigation } from '../components/Navigation.js';
import { openRaceResultModal } from '../components/RaceResultModal.js';
import { getCurrentUser, logout } from '../services/auth.js';
import {
  listDrivers,
  listRaceResults,
  createRaceResult,
  updateRaceResult,
  deleteRaceResult,
  createPenalties,
  deletePenaltiesByRaceResult,
  calculatePenaltyPoints,
  queryTable
} from '../services/api.js';
import { showNotification, showConfirmation } from '../utils/helpers.js';
import { getDriverImageHtml } from '../utils/image.js';

function getHashParam(name) {
  const hash = window.location.hash || '';
  const query = hash.split('?')[1] || '';
  return new URLSearchParams(query).get(name);
}

const RaceDetail = {
  async render(container) {
    container.innerHTML = '';
    
    const user = await getCurrentUser();
    const nav = renderNavigation({
      isAuthenticated: true,
      currentUserEmail: user ? user.email : '',
      onLogout: async () => {
        await logout();
        showNotification('Logged out successfully.', 'success');
      }
    });
    container.appendChild(nav);
    
    const raceId = getHashParam('id');
    const main = document.createElement('main');
    main.className = 'container mt-4';
    
    if (!raceId) {
      main.innerHTML = `
        <div class="alert alert-danger">Race ID not provided.</div>
        <a href="#/admin/races" class="btn btn-outline-secondary">Back to Races</a>
      `;
      container.appendChild(main);
      return;
    }
    
    main.innerHTML = `
      <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
        <div>
          <h1 class="h3 mb-0" id="race-title">Race Details</h1>
          <p class="text-muted mb-0" id="race-subtitle"></p>
        </div>
        <div class="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
          <button class="btn btn-primary w-100 w-sm-auto" id="add-result">Add Result</button>
          <a href="#/admin/races" class="btn btn-outline-secondary w-100 w-sm-auto">Back to Races</a>
        </div>
      </div>
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3" id="race-info"></div>
        </div>
      </div>
      <div class="card shadow-sm">
        <div class="card-header text-white">
          <h2 class="h6 mb-0">Race Results</h2>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Driver</th>
                  <th>Grid</th>
                  <th>Best Lap</th>
                  <th>Penalties</th>
                  <th>DQ</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody id="results-table-body">
                <tr>
                  <td colspan="7" class="text-center text-muted">
                    <div class="d-flex align-items-center justify-content-center gap-2">
                      <div class="spinner-border spinner-border-sm" role="status"></div>
                      <span>Loading results...</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(main);
    
    const raceTitle = main.querySelector('#race-title');
    const raceSubtitle = main.querySelector('#race-subtitle');
    const raceInfo = main.querySelector('#race-info');
    const resultsTableBody = main.querySelector('#results-table-body');
    const addResultButton = main.querySelector('#add-result');
    
    let race = null;
    let drivers = [];
    let results = [];
    
    const loadRace = async () => {
      const data = await queryTable('races', {
        filters: [{ column: 'id', operator: 'eq', value: raceId }]
      });
      race = data[0] || null;
    };
    
    const renderRaceInfo = () => {
      if (!race) {
        raceTitle.textContent = 'Race not found';
        raceSubtitle.textContent = '';
        raceInfo.innerHTML = `<div class="col-12 text-danger">Unable to load race details.</div>`;
        return;
      }
      raceTitle.textContent = race.name;
      raceSubtitle.textContent = race.location || '';
      raceInfo.innerHTML = `
        <div class="col-md-4">
          <div class="text-muted small">Date & Time</div>
          <div>${race.race_datetime ? new Date(race.race_datetime).toLocaleString() : '-'}</div>
        </div>
        <div class="col-md-4">
          <div class="text-muted small">Season</div>
          <div>${race.season_id}</div>
        </div>
        <div class="col-md-4">
          <div class="text-muted small">Affects Championship</div>
          <div>${race.affects_championship ? 'Yes' : 'No'}</div>
        </div>
      `;
    };
    
    const renderResults = () => {
      if (!results.length) {
        resultsTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted">No results yet.</td>
          </tr>
        `;
        return;
      }
      
      resultsTableBody.innerHTML = results.map(result => {
        const penalties = result.penalties || [];
        const penaltyTotal = calculatePenaltyPoints(penalties);
        return `
          <tr>
            <td>${result.finish_position}</td>
            <td>
              <div class="d-flex align-items-center gap-2">
                ${getDriverImageHtml({
                  src: result.drivers ? result.drivers.picture_url : null,
                  seed: result.driver_id || (result.drivers ? result.drivers.email : null) || (result.drivers ? result.drivers.name : null),
                  alt: result.drivers ? result.drivers.name : 'Driver',
                  className: 'rounded-circle',
                  size: 32
                })}
                <span>${result.drivers ? result.drivers.name : result.driver_id}</span>
              </div>
            </td>
            <td>${result.grid_start_position || '-'}</td>
            <td>${result.best_lap_time || '-'}</td>
            <td>${penalties.length ? `${penalties.length} (${penaltyTotal})` : '-'}</td>
            <td>${result.is_disqualified ? 'Yes' : 'No'}</td>
            <td class="text-end">
              <div class="d-flex flex-column flex-md-row justify-content-end gap-2">
                <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${result.id}">Edit</button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${result.id}">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    };
    
    const loadResults = async () => {
      results = await listRaceResults(raceId);
      renderResults();
    };
    
    const handleSave = async (payload) => {
      try {
        if (payload.id) {
          await updateRaceResult(payload.id, {
            race_id: raceId,
            driver_id: payload.driver_id,
            finish_position: payload.finish_position,
            grid_start_position: payload.grid_start_position,
            best_lap_time: payload.best_lap_time,
            is_disqualified: payload.is_disqualified,
            comments: payload.comments
          });
          await deletePenaltiesByRaceResult(payload.id);
          if (payload.penalties.length) {
            await createPenalties(payload.penalties.map(penalty => ({
              ...penalty,
              race_result_id: payload.id
            })));
          }
          showNotification('Race result updated.', 'success');
        } else {
          const created = await createRaceResult({
            race_id: raceId,
            driver_id: payload.driver_id,
            finish_position: payload.finish_position,
            grid_start_position: payload.grid_start_position,
            best_lap_time: payload.best_lap_time,
            is_disqualified: payload.is_disqualified,
            comments: payload.comments
          });
          if (payload.penalties.length) {
            await createPenalties(payload.penalties.map(penalty => ({
              ...penalty,
              race_result_id: created.id
            })));
          }
          showNotification('Race result created.', 'success');
        }
        await loadResults();
      } catch (error) {
        showNotification(error.message, 'error');
      }
    };
    
    addResultButton.addEventListener('click', () => {
      openRaceResultModal({
        drivers,
        existingResults: results,
        onSave: handleSave
      });
    });
    
    resultsTableBody.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      
      const id = button.dataset.id;
      const action = button.dataset.action;
      const result = results.find(item => item.id === id);
      if (!result) return;
      
      if (action === 'edit') {
        openRaceResultModal({
          drivers,
          existingResults: results,
          initialData: result,
          onSave: handleSave
        });
      }
      
      if (action === 'delete') {
        const confirmed = await showConfirmation('Delete this race result? This cannot be undone.');
        if (!confirmed) return;
        try {
          await deleteRaceResult(id);
          showNotification('Race result deleted.', 'success');
          await loadResults();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    });
    
    try {
      await loadRace();
      drivers = await listDrivers({ order: { column: 'name', ascending: true } });
      await loadResults();
      renderRaceInfo();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }
};

export default RaceDetail;
