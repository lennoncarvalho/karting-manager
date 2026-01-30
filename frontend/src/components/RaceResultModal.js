/**
 * Race Result Modal Component
 * Handles create/edit of race results and penalties
 */

import { isPositiveInteger, isValidLapTime, isRequired } from '../utils/validation.js';
import { showNotification, setFieldInvalid, clearFieldInvalid } from '../utils/helpers.js';
import { t } from '../services/i18n.js';

const standardPenalties = [
  { type: 'disqualification', name: 'Disqualification', labelKey: 'raceResultModal.penalties.disqualification', points: -8 },
  { type: 'cone_tire_warning', name: 'Cone/Tire Warning', labelKey: 'raceResultModal.penalties.coneTireWarning', points: -2 },
  { type: 'race_direction_warning', name: 'Race Direction Warning', labelKey: 'raceResultModal.penalties.raceDirectionWarning', points: -4 },
  { type: 'stop_and_go', name: 'Stop and Go', labelKey: 'raceResultModal.penalties.stopAndGo', points: -6 },
  { type: 'missing_club_shirt', name: 'Missing Club Shirt', labelKey: 'raceResultModal.penalties.missingClubShirt', points: -2 }
];

export function openRaceResultModal(options = {}) {
  const {
    drivers = [],
    existingResults = [],
    initialData = null,
    onSave = null
  } = options;
  
  const modalId = `race-result-modal-${Date.now()}`;
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = modalId;
  modal.setAttribute('tabindex', '-1');
  modal.setAttribute('aria-hidden', 'true');
  
  const isEdit = Boolean(initialData && initialData.id);
  const existingDriverIds = new Set(existingResults.map(result => result.driver_id));
  
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${isEdit ? t('raceResultModal.titleEdit') : t('raceResultModal.titleAdd')}</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="${t('common.actions.close')}"></button>
        </div>
        <div class="modal-body">
          <form id="race-result-form">
            <input type="hidden" id="race-result-id" value="${initialData ? initialData.id || '' : ''}">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="result-driver">${t('raceResultModal.driver')}</label>
                <select class="form-select" id="result-driver" required>
                  <option value="">${t('raceResultModal.selectDriver')}</option>
                  ${drivers.map(driver => {
                    const selected = initialData && driver.id === initialData.driver_id ? 'selected' : '';
                    const disabled = existingDriverIds.has(driver.id) && (!initialData || driver.id !== initialData.driver_id);
                    return `<option value="${driver.id}" ${selected} ${disabled ? 'disabled' : ''}>${driver.name}</option>`;
                  }).join('')}
                </select>
                <div class="invalid-feedback">${t('validation.driverRequired')}</div>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="result-finish">${t('raceResultModal.finishPosition')}</label>
                <input type="number" class="form-control" id="result-finish" min="1" value="${initialData ? initialData.finish_position || '' : ''}" required>
                <div class="invalid-feedback">${t('validation.finishPositionRequired')}</div>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="result-grid">${t('raceResultModal.gridStart')}</label>
                <input type="number" class="form-control" id="result-grid" min="1" value="${initialData ? initialData.grid_start_position || '' : ''}">
                <div class="invalid-feedback">${t('validation.gridStartPositive')}</div>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="result-best-lap">${t('raceResultModal.bestLapTime')}</label>
                <input type="text" class="form-control" id="result-best-lap" placeholder="${t('raceResultModal.bestLapPlaceholder')}" value="${initialData ? initialData.best_lap_time || '' : ''}">
                <div class="invalid-feedback">${t('validation.bestLapInvalid')}</div>
              </div>
              <div class="col-md-6 d-flex align-items-end">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" id="result-disqualified" ${initialData && initialData.is_disqualified ? 'checked' : ''}>
                  <label class="form-check-label" for="result-disqualified">${t('raceResultModal.disqualified')}</label>
                </div>
              </div>
              <div class="col-12">
                <label class="form-label" for="result-comments">${t('raceResultModal.comments')}</label>
                <textarea class="form-control" id="result-comments" rows="2">${initialData ? initialData.comments || '' : ''}</textarea>
              </div>
            </div>
            <hr>
            <div>
              <h6 class="mb-3">${t('raceResultModal.standardPenalties')}</h6>
              <div class="row g-3">
                ${standardPenalties.map((penalty, index) => {
                  const existing = (initialData && initialData.penalties || []).find(item => item.penalty_type === penalty.type);
                  const countValue = existing ? existing.count : '';
                  return `
                    <div class="col-md-4">
                      <label class="form-label">${t(penalty.labelKey)} (${penalty.points})</label>
                      <input type="number" min="0" class="form-control penalty-count" data-penalty-index="${index}" value="${countValue}">
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            <hr>
            <div>
              <div class="d-flex align-items-center justify-content-between mb-2">
                <h6 class="mb-0">${t('raceResultModal.customPenalties')}</h6>
                <button type="button" class="btn btn-outline-primary btn-sm" id="add-custom-penalty">${t('raceResultModal.add')}</button>
              </div>
              <div id="custom-penalties"></div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${t('raceResultModal.cancel')}</button>
          <button type="button" class="btn btn-primary" id="save-race-result">${t('raceResultModal.saveResult')}</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const customContainer = modal.querySelector('#custom-penalties');
  const addCustomButton = modal.querySelector('#add-custom-penalty');
  const saveButton = modal.querySelector('#save-race-result');
  
  const addCustomPenaltyRow = (penalty = {}) => {
    const row = document.createElement('div');
    row.className = 'row g-2 align-items-end mb-2 custom-penalty-row';
    row.innerHTML = `
      <div class="col-md-5">
        <label class="form-label">${t('raceResultModal.customName')}</label>
        <input type="text" class="form-control custom-name" value="${penalty.penalty_name || ''}">
      </div>
      <div class="col-md-3">
        <label class="form-label">${t('raceResultModal.customPoints')}</label>
        <input type="number" class="form-control custom-points" value="${penalty.point_deduction || ''}">
      </div>
      <div class="col-md-3">
        <label class="form-label">${t('raceResultModal.customCount')}</label>
        <input type="number" min="1" class="form-control custom-count" value="${penalty.count || ''}">
      </div>
      <div class="col-md-1">
        <button type="button" class="btn btn-outline-danger btn-sm remove-custom">X</button>
      </div>
    `;
    row.querySelector('.remove-custom').addEventListener('click', () => row.remove());
    customContainer.appendChild(row);
  };
  
  if (initialData && Array.isArray(initialData.penalties)) {
    initialData.penalties
      .filter(penalty => penalty.penalty_type === 'custom')
      .forEach(addCustomPenaltyRow);
  }
  
  addCustomButton.addEventListener('click', () => addCustomPenaltyRow());
  
  saveButton.addEventListener('click', async () => {
    const driverId = modal.querySelector('#result-driver').value;
    const finishPosition = modal.querySelector('#result-finish').value;
    const gridStart = modal.querySelector('#result-grid').value;
    const bestLap = modal.querySelector('#result-best-lap').value.trim();
    const isDisqualified = modal.querySelector('#result-disqualified').checked;
    const comments = modal.querySelector('#result-comments').value.trim();
    
    const driverField = modal.querySelector('#result-driver');
    const finishField = modal.querySelector('#result-finish');
    const gridField = modal.querySelector('#result-grid');
    const bestLapField = modal.querySelector('#result-best-lap');
    
    [driverField, finishField, gridField, bestLapField].forEach(clearFieldInvalid);
    let hasError = false;
    if (!isRequired(driverId)) {
      setFieldInvalid(driverField, t('validation.driverRequired'));
      hasError = true;
    }
    if (!isPositiveInteger(finishPosition)) {
      setFieldInvalid(finishField, t('validation.finishPositionPositive'));
      hasError = true;
    }
    if (gridStart && !isPositiveInteger(gridStart)) {
      setFieldInvalid(gridField, t('validation.gridStartPositive'));
      hasError = true;
    }
    if (bestLap && !isValidLapTime(bestLap)) {
      setFieldInvalid(bestLapField, t('validation.bestLapInvalid'));
      hasError = true;
    }
    if (hasError) {
      showNotification(t('notifications.pleaseFix'), 'warning');
      return;
    }
    
    const penalties = [];
    modal.querySelectorAll('.penalty-count').forEach((input) => {
      const count = parseInt(input.value, 10);
      if (!Number.isNaN(count) && count > 0) {
        const index = parseInt(input.dataset.penaltyIndex, 10);
        const penalty = standardPenalties[index];
        penalties.push({
          penalty_type: penalty.type,
          penalty_name: penalty.name,
          point_deduction: penalty.points,
          count
        });
      }
    });
    
    modal.querySelectorAll('.custom-penalty-row').forEach((row) => {
      const name = row.querySelector('.custom-name').value.trim();
      const points = Number(row.querySelector('.custom-points').value);
      const count = Number(row.querySelector('.custom-count').value);
      if (name && !Number.isNaN(points) && !Number.isNaN(count) && count > 0) {
        penalties.push({
          penalty_type: 'custom',
          penalty_name: name,
          point_deduction: points,
          count
        });
      }
    });
    
    const payload = {
      id: modal.querySelector('#race-result-id').value || null,
      driver_id: driverId,
      finish_position: Number(finishPosition),
      grid_start_position: gridStart ? Number(gridStart) : null,
      best_lap_time: bestLap || null,
      is_disqualified: isDisqualified,
      comments: comments || null,
      penalties
    };
    
    if (onSave) {
      await onSave(payload);
    }
    
    const bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) {
      bsModal.hide();
    }
  });
  
  modal.addEventListener('hidden.bs.modal', () => {
    modal.remove();
  });
  
  const bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
  bsModal.show();
  
  return modal;
}
