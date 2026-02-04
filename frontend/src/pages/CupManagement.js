/**
 * Cup Management Page
 * CRUD interface for cups
 */

import { listSeasons, listCups, createCup, updateCup, deleteCup } from '../services/api.js';
import { isRequired, isValidDateRange, isValidCupDateRange } from '../utils/validation.js';
import { formatDisplayDate } from '../utils/formatting.js';
import { showNotification, showConfirmation, setFieldInvalid, clearFieldInvalid } from '../utils/helpers.js';
import { resolveSelectedSeason, setStoredSeasonId } from '../services/theme.js';
import { t } from '../services/i18n.js';

const CupManagement = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <h1 class="h3 mb-0">${t('cupManagement.title')}</h1>
      </div>
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0" id="cup-form-title">${t('cupManagement.form.createTitle')}</h2>
            </div>
            <div class="card-body">
              <form id="cup-form" novalidate>
                <input type="hidden" id="cup-id">
                <div class="mb-3">
                  <label class="form-label" for="cup-season">${t('common.labels.season')}</label>
                  <select class="form-select" id="cup-season" required>
                    <option value="">${t('cupManagement.form.selectSeason')}</option>
                  </select>
                  <div class="invalid-feedback">${t('validation.seasonRequired')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="cup-name">${t('common.labels.name')}</label>
                  <input type="text" class="form-control" id="cup-name" required>
                  <div class="invalid-feedback">${t('validation.cupNameRequired')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="cup-start">${t('common.labels.startDate')}</label>
                  <input type="date" class="form-control" id="cup-start" required>
                  <div class="invalid-feedback">${t('validation.startDateRequired')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="cup-end">${t('common.labels.endDate')}</label>
                  <input type="date" class="form-control" id="cup-end" required>
                  <div class="invalid-feedback">${t('validation.endDateAfterStart')}</div>
                </div>
                <div class="d-flex flex-column flex-sm-row gap-2">
                  <button type="submit" class="btn btn-primary w-100 w-sm-auto flex-sm-grow-1" id="cup-submit">${t('common.actions.create')}</button>
                  <button type="button" class="btn btn-outline-secondary d-none w-100 w-sm-auto" id="cup-cancel">${t('common.actions.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0">${t('cupManagement.list.title')}</h2>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>${t('cupManagement.table.cup')}</th>
                      <th>${t('cupManagement.table.season')}</th>
                      <th>${t('cupManagement.table.start')}</th>
                      <th>${t('cupManagement.table.end')}</th>
                      <th class="text-end">${t('cupManagement.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody id="cup-table-body">
                    <tr>
                      <td colspan="5" class="text-center">
                        <div class="d-flex align-items-center justify-content-center gap-2">
                          <div class="spinner-border spinner-border-sm" role="status"></div>
                          <span>${t('common.status.loadingCups')}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(main);
    
    const form = main.querySelector('#cup-form');
    const formTitle = main.querySelector('#cup-form-title');
    const submitButton = main.querySelector('#cup-submit');
    const cancelButton = main.querySelector('#cup-cancel');
    const tableBody = main.querySelector('#cup-table-body');
    const seasonSelect = main.querySelector('#cup-season');
    const nameInput = main.querySelector('#cup-name');
    const startInput = main.querySelector('#cup-start');
    const endInput = main.querySelector('#cup-end');
    
    let seasons = [];
    let cups = [];
    
    const resetForm = () => {
      form.reset();
      form.querySelector('#cup-id').value = '';
      formTitle.textContent = t('cupManagement.form.createTitle');
      submitButton.textContent = t('common.actions.create');
      cancelButton.classList.add('d-none');
    };
    
    const renderSeasonOptions = () => {
      seasonSelect.innerHTML = `<option value="">${t('cupManagement.form.selectSeason')}</option>` +
        seasons.map(season => `<option value="${season.id}">${season.name}</option>`).join('');
    };
    
    const renderTable = () => {
      if (!cups.length) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">${t('cupManagement.list.empty')}</td>
          </tr>
        `;
        return;
      }
      
      const seasonMap = Object.fromEntries(seasons.map(season => [season.id, season]));
      
      tableBody.innerHTML = cups.map((cup) => `
        <tr>
          <td>${cup.name}</td>
          <td>${seasonMap[cup.season_id] ? seasonMap[cup.season_id].name : t('common.misc.unknown')}</td>
          <td>${cup.start_date ? formatDisplayDate(cup.start_date) : '-'}</td>
          <td>${cup.end_date ? formatDisplayDate(cup.end_date) : '-'}</td>
          <td class="text-end">
            <div class="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${cup.id}">${t('common.actions.edit')}</button>
              <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${cup.id}">${t('common.actions.delete')}</button>
            </div>
          </td>
        </tr>
      `).join('');
    };
    
    const loadData = async () => {
      try {
        seasons = await listSeasons({ order: { column: 'start_date', ascending: true } });
        cups = await listCups({ order: { column: 'start_date', ascending: true } });
        renderSeasonOptions();
        const selectedSeason = await resolveSelectedSeason(seasons);
        if (selectedSeason) {
          const selectedId = String(selectedSeason.id);
          if (seasons.some(season => String(season.id) === selectedId)) {
            seasonSelect.value = selectedId;
          }
        }
        renderTable();
      } catch (error) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-danger">${error.message}</td>
          </tr>
        `;
      }
    };
    
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const id = form.querySelector('#cup-id').value;
      const seasonId = seasonSelect.value;
      const name = form.querySelector('#cup-name').value.trim();
      const startDate = form.querySelector('#cup-start').value;
      const endDate = form.querySelector('#cup-end').value;
      
      [seasonSelect, nameInput, startInput, endInput].forEach(clearFieldInvalid);
      let hasError = false;
      if (!isRequired(seasonId)) {
        setFieldInvalid(seasonSelect, t('validation.seasonRequired'));
        hasError = true;
      }
      if (!isRequired(name)) {
        setFieldInvalid(nameInput, t('validation.cupNameRequired'));
        hasError = true;
      }
      if (!isRequired(startDate)) {
        setFieldInvalid(startInput, t('validation.startDateRequired'));
        hasError = true;
      }
      if (!isRequired(endDate) || !isValidDateRange(startDate, endDate)) {
        setFieldInvalid(endInput, t('validation.endDateAfterStart'));
        hasError = true;
      }
      
      const season = seasons.find(item => item.id === seasonId);
      if (season && !isValidCupDateRange(season.start_date, season.end_date, startDate, endDate)) {
        setFieldInvalid(endInput, t('validation.cupDatesWithinSeason'));
        hasError = true;
      }
      
      if (hasError) {
        showNotification(t('notifications.pleaseFix'), 'warning');
        return;
      }
      
      submitButton.disabled = true;
      try {
        const payload = {
          season_id: seasonId,
          name,
          start_date: startDate,
          end_date: endDate
        };
        
        if (id) {
          await updateCup(id, payload);
          showNotification(t('notifications.cupUpdated'), 'success');
        } else {
          await createCup(payload);
          showNotification(t('notifications.cupCreated'), 'success');
        }
        
        resetForm();
        await loadData();
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        submitButton.disabled = false;
      }
    });
    
    cancelButton.addEventListener('click', () => {
      resetForm();
    });

    seasonSelect.addEventListener('change', (event) => {
      if (event.target.value) {
        setStoredSeasonId(event.target.value);
      }
    });
    
    tableBody.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      
      const id = button.dataset.id;
      const action = button.dataset.action;
      const cup = cups.find(item => item.id === id);
      if (!cup) return;
      
      if (action === 'edit') {
        form.querySelector('#cup-id').value = cup.id;
        seasonSelect.value = cup.season_id;
        form.querySelector('#cup-name').value = cup.name;
        form.querySelector('#cup-start').value = cup.start_date;
        form.querySelector('#cup-end').value = cup.end_date;
        formTitle.textContent = t('cupManagement.form.editTitle');
        submitButton.textContent = t('common.actions.update');
        cancelButton.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      if (action === 'delete') {
        const confirmed = await showConfirmation(t('cupManagement.confirmDelete'));
        if (!confirmed) {
          return;
        }
        try {
          await deleteCup(id);
          showNotification(t('notifications.cupDeleted'), 'success');
          await loadData();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    });
    
    await loadData();
  }
};

export default CupManagement;
