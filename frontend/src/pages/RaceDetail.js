/**
 * Race Detail Page
 * Display race info and manage race results
 */

import { openRaceResultModal } from '../components/RaceResultModal.js';
import { openOcrImportModal } from '../components/OcrImportModal.js';
import {
  listDrivers,
  listRaceResults,
  createRaceResult,
  updateRaceResult,
  deleteRaceResult,
  createPenalties,
  deletePenaltiesByRaceResult,
  calculatePenaltyPoints,
  queryTable,
  getSeasonById
} from '../services/api.js';
import { showNotification, showConfirmation } from '../utils/helpers.js';
import { getDriverImageHtml } from '../utils/image.js';
import { formatDateTime } from '../utils/formatting.js';
import { isValidLapTime } from '../utils/validation.js';
import { t } from '../services/i18n.js';

function getHashParam(name) {
  const hash = window.location.hash || '';
  const query = hash.split('?')[1] || '';
  return new URLSearchParams(query).get(name);
}

const RaceDetail = {
  async render(container) {
    container.innerHTML = '';
    
    const raceId = getHashParam('id');
    const main = document.createElement('main');
    main.className = 'container mt-4';
    
    if (!raceId) {
      main.innerHTML = `
        <div class="alert alert-danger">${t('errors.raceIdMissing')}</div>
        <a href="#/admin/races" class="btn btn-outline-secondary">${t('raceDetail.backToRaces')}</a>
      `;
      container.appendChild(main);
      return;
    }
    
    main.innerHTML = `
      <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
        <div class="w-50">
          <h1 class="h3 mb-0" id="race-title">${t('raceDetail.title')}</h1>
          <p class="mb-0" id="race-subtitle"></p>
        </div>
        <div class="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
          <button class="btn btn-primary w-100 w-sm-auto" id="add-result">${t('raceDetail.addResult')}</button>
          <button class="btn btn-outline-primary w-100 w-sm-auto" id="import-ocr">${t('raceDetail.importResults')}</button>
          <a href="#/admin/races" class="btn btn-outline-secondary w-100 w-sm-auto">${t('raceDetail.backToRaces')}</a>
        </div>
      </div>
      <div class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3" id="race-info"></div>
        </div>
      </div>
      <div class="card shadow-sm">
        <div class="card-header text-white">
          <h2 class="h6 mb-0">${t('raceDetail.resultsTitle')}</h2>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped align-middle">
              <thead>
                <tr>
                  <th>${t('raceDetail.table.position')}</th>
                  <th>${t('raceDetail.table.driver')}</th>
                  <th>${t('raceDetail.table.grid')}</th>
                  <th>${t('raceDetail.table.bestLap')}</th>
                  <th>${t('raceDetail.table.penalties')}</th>
                  <th>${t('raceDetail.table.dq')}</th>
                  <th class="text-end">${t('raceDetail.table.actions')}</th>
                </tr>
              </thead>
              <tbody id="results-table-body">
                <tr>
                  <td colspan="7" class="text-center">
                    <div class="d-flex align-items-center justify-content-center gap-2">
                      <div class="spinner-border spinner-border-sm" role="status"></div>
                      <span>${t('raceDetail.loadingResults')}</span>
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
    const importOcrButton = main.querySelector('#import-ocr');
    
    let race = null;
    let drivers = [];
    let results = [];
    let seasonName = '';
    
    const loadRace = async () => {
      const data = await queryTable('races', {
        filters: [{ column: 'id', operator: 'eq', value: raceId }]
      });
      race = data[0] || null;
    };

    const loadSeason = async () => {
      seasonName = '';
      if (!race || !race.season_id) return;
      const season = await getSeasonById(race.season_id);
      seasonName = season ? season.name : t('common.misc.unknown');
    };
    
    const renderRaceInfo = () => {
      if (!race) {
        raceTitle.textContent = t('errors.raceNotFound');
        raceSubtitle.textContent = '';
        raceInfo.innerHTML = `<div class="col-12 text-danger">${t('errors.raceLoadFailed')}</div>`;
        return;
      }
      raceTitle.textContent = race.name;
      raceSubtitle.textContent = race.location || '';
      const seasonDisplay = race.season_id ? (seasonName || t('common.misc.unknown')) : '-';
      raceInfo.innerHTML = `
        <div class="col-md-4">
          <div class="small">${t('raceDetail.info.dateTime')}</div>
          <div>${race.race_datetime ? formatDateTime(race.race_datetime) : '-'}</div>
        </div>
        <div class="col-md-4">
          <div class="small">${t('raceDetail.info.season')}</div>
          <div>${seasonDisplay}</div>
        </div>
        <div class="col-md-4">
          <div class="small">${t('raceDetail.info.affectsChampionship')}</div>
          <div>${race.affects_championship ? t('common.misc.yes') : t('common.misc.no')}</div>
        </div>
      `;
    };
    
    const renderResults = () => {
      if (!results.length) {
        resultsTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">${t('raceDetail.noResults')}</td>
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
                  alt: result.drivers ? result.drivers.name : t('common.labels.driver'),
                  className: 'rounded-circle',
                  size: 32
                })}
                <span>${result.drivers ? result.drivers.name : result.driver_id}</span>
              </div>
            </td>
            <td>${result.grid_start_position || '-'}</td>
            <td>${result.best_lap_time || '-'}</td>
            <td>${penalties.length ? `${penalties.length} (${penaltyTotal})` : '-'}</td>
            <td>${result.is_disqualified ? t('common.misc.yes') : t('common.misc.no')}</td>
            <td class="text-end">
              <div class="d-flex flex-column flex-md-row justify-content-end gap-2">
                <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${result.id}">${t('common.actions.edit')}</button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${result.id}">${t('common.actions.delete')}</button>
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
          showNotification(t('notifications.raceResultUpdated'), 'success');
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
          showNotification(t('notifications.raceResultCreated'), 'success');
        }
        await loadResults();
      } catch (error) {
        showNotification(error.message, 'error');
      }
    };

    const handleOcrSave = async ({ mode, rows }) => {
      if (!rows.length) {
        showNotification(t('ocrImport.noValidRows'), 'warning');
        return false;
      }
      try {
        if (mode === 'race') {
          if (results.length) {
            showNotification(t('ocrImport.blockedRace'), 'warning');
            return false;
          }
          await Promise.all(rows.map((row) => createRaceResult({
            race_id: raceId,
            driver_id: row.driverId,
            finish_position: row.position,
            grid_start_position: null,
            best_lap_time: isValidLapTime(row.bestLapTime) ? row.bestLapTime : null,
            is_disqualified: false,
            comments: null
          })));
          showNotification(t('ocrImport.saveSuccessRace'), 'success');
          window.location.reload();
          return true;
        }
        if (mode === 'qualifying') {
          if (!results.length) {
            showNotification(t('ocrImport.blockedQualifying'), 'warning');
            return false;
          }
          const resultMap = new Map(results.map((result) => [result.driver_id, result]));
          const positionMap = new Map(rows.map((row) => [row.driverId, row.position]));
          const updates = rows
            .map((row) => resultMap.get(row.driverId))
            .filter(Boolean)
            .map((result) => updateRaceResult(result.id, { grid_start_position: positionMap.get(result.driver_id) }));
          if (updates.length) {
            await Promise.all(updates);
          }
          showNotification(t('ocrImport.saveSuccessQualifying'), 'success');
          window.location.reload();
          return true;
        }
        return false;
      } catch (error) {
        showNotification(error.message || t('ocrImport.saveFailure'), 'error');
        return false;
      }
    };
    
    addResultButton.addEventListener('click', () => {
      openRaceResultModal({
        drivers,
        existingResults: results,
        onSave: handleSave
      });
    });

    importOcrButton.addEventListener('click', () => {
      openOcrImportModal({
        raceId,
        drivers,
        existingResults: results,
        onSave: handleOcrSave
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
        const confirmed = await showConfirmation(t('raceDetail.confirmDelete'));
        if (!confirmed) return;
        try {
          await deleteRaceResult(id);
          showNotification(t('notifications.raceResultDeleted'), 'success');
          await loadResults();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    });
    
    try {
      await loadRace();
      await loadSeason();
      drivers = await listDrivers({ order: { column: 'name', ascending: true } });
      await loadResults();
      renderRaceInfo();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }
};

export default RaceDetail;
