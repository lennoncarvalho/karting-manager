/**
 * Race Management Page
 * CRUD interface for races
 */

import { listSeasons, listCups, listRaces, createRace, updateRace, deleteRace } from '../services/api.js';
import { isRequired } from '../utils/validation.js';
import { showNotification, showConfirmation, setFieldInvalid, clearFieldInvalid } from '../utils/helpers.js';
import { resolveSelectedSeason, setStoredSeasonId } from '../services/theme.js';
import { formatDateTime, formatDateTimeForInput, formatDateTimeForStorage } from '../utils/formatting.js';
import { t } from '../services/i18n.js';

const RaceManagement = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <h1 class="h3 mb-0">${t('raceManagement.title')}</h1>
      </div>
      <div class="card mb-4 shadow-sm">
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-md-5">
              <label class="form-label" for="race-filter-season">${t('raceManagement.filters.season')}</label>
              <select class="form-select" id="race-filter-season">
                <option value="">${t('common.misc.allSeasons')}</option>
              </select>
            </div>
            <div class="col-md-5">
              <label class="form-label" for="race-filter-cup">${t('raceManagement.filters.cup')}</label>
              <select class="form-select" id="race-filter-cup">
                <option value="">${t('common.misc.allCups')}</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-primary w-100" id="race-filter-clear">${t('common.actions.clear')}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0" id="race-form-title">${t('raceManagement.form.createTitle')}</h2>
            </div>
            <div class="card-body">
              <form id="race-form" novalidate>
                <input type="hidden" id="race-id">
                <div class="mb-3">
                  <label class="form-label" for="race-season">${t('common.labels.season')}</label>
                  <select class="form-select" id="race-season" required>
                    <option value="">${t('cupManagement.form.selectSeason')}</option>
                  </select>
                  <div class="invalid-feedback">${t('validation.seasonRequired')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="race-cup">${t('raceManagement.form.cupOptional')}</label>
                  <select class="form-select" id="race-cup">
                    <option value="">${t('common.misc.noCup')}</option>
                  </select>
                  <div class="invalid-feedback">${t('validation.cupBelongsSeason')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="race-name">${t('common.labels.name')}</label>
                  <input type="text" class="form-control" id="race-name" required>
                  <div class="invalid-feedback">${t('validation.raceNameRequired')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="race-location">${t('common.labels.location')}</label>
                  <input type="text" class="form-control" id="race-location" required>
                  <div class="invalid-feedback">${t('validation.locationRequired')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="race-datetime">${t('raceManagement.form.raceDateTime')}</label>
                  <input type="datetime-local" class="form-control" id="race-datetime" required>
                  <div class="invalid-feedback">${t('validation.dateTimeRequired')}</div>
                </div>
                <div class="form-check mb-3">
                  <input class="form-check-input" type="checkbox" id="race-affects" checked>
                  <label class="form-check-label" for="race-affects">
                    ${t('raceManagement.form.affectsChampionship')}
                  </label>
                </div>
                <div class="d-flex flex-column flex-sm-row gap-2">
                  <button type="submit" class="btn btn-primary w-100 w-sm-auto flex-sm-grow-1" id="race-submit">${t('common.actions.create')}</button>
                  <button type="button" class="btn btn-outline-secondary d-none w-100 w-sm-auto" id="race-cancel">${t('common.actions.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0">${t('raceManagement.list.title')}</h2>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>${t('raceManagement.table.race')}</th>
                      <th>${t('raceManagement.table.season')}</th>
                      <th>${t('raceManagement.table.cup')}</th>
                      <th>${t('raceManagement.table.date')}</th>
                      <th class="text-end">${t('raceManagement.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody id="race-table-body">
                    <tr>
                      <td colspan="5" class="text-center">
                        <div class="d-flex align-items-center justify-content-center gap-2">
                          <div class="spinner-border spinner-border-sm" role="status"></div>
                          <span>${t('common.status.loadingRaces')}</span>
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
    
    const form = main.querySelector('#race-form');
    const formTitle = main.querySelector('#race-form-title');
    const submitButton = main.querySelector('#race-submit');
    const cancelButton = main.querySelector('#race-cancel');
    const tableBody = main.querySelector('#race-table-body');
    const seasonSelect = main.querySelector('#race-season');
    const cupSelect = main.querySelector('#race-cup');
    const filterSeasonSelect = main.querySelector('#race-filter-season');
    const filterCupSelect = main.querySelector('#race-filter-cup');
    const filterClearButton = main.querySelector('#race-filter-clear');
    const nameInput = main.querySelector('#race-name');
    const locationInput = main.querySelector('#race-location');
    const dateTimeInput = main.querySelector('#race-datetime');
    
    let seasons = [];
    let cups = [];
    let races = [];
    
    const resetForm = () => {
      form.reset();
      form.querySelector('#race-id').value = '';
      formTitle.textContent = t('raceManagement.form.createTitle');
      submitButton.textContent = t('common.actions.create');
      cancelButton.classList.add('d-none');
      cupSelect.innerHTML = `<option value="">${t('common.misc.noCup')}</option>`;
    };
    
    const renderSeasonOptions = () => {
      seasonSelect.innerHTML = `<option value="">${t('cupManagement.form.selectSeason')}</option>` +
        seasons.map(season => `<option value="${season.id}">${season.name}</option>`).join('');
      filterSeasonSelect.innerHTML = `<option value="">${t('common.misc.allSeasons')}</option>` +
        seasons.map(season => `<option value="${season.id}">${season.name}</option>`).join('');
    };
    
    const renderCupOptions = (seasonId) => {
      const filtered = cups.filter(cup => cup.season_id === seasonId);
      cupSelect.innerHTML = `<option value="">${t('common.misc.noCup')}</option>` +
        filtered.map(cup => `<option value="${cup.id}">${cup.name}</option>`).join('');
    };
    
    const renderFilterCupOptions = (seasonId) => {
      const filtered = seasonId ? cups.filter(cup => cup.season_id === seasonId) : cups;
      filterCupSelect.innerHTML = `<option value="">${t('common.misc.allCups')}</option>` +
        filtered.map(cup => `<option value="${cup.id}">${cup.name}</option>`).join('');
    };
    
    const renderTable = () => {
      if (!races.length) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">${t('raceManagement.list.empty')}</td>
          </tr>
        `;
        return;
      }
      
      const seasonMap = Object.fromEntries(seasons.map(season => [season.id, season]));
      const cupMap = Object.fromEntries(cups.map(cup => [cup.id, cup]));
      
      tableBody.innerHTML = races.map((race) => `
        <tr>
          <td>
            <div>
              <a class="fw-semibold text-decoration-underline" href="#/admin/race?id=${race.id}">
                ${race.name}
              </a>
              <small class="d-block">${race.location}</small>
            </div>
          </td>
          <td>${seasonMap[race.season_id] ? seasonMap[race.season_id].name : t('common.misc.unknown')}</td>
          <td>${race.cup_id ? (cupMap[race.cup_id] ? cupMap[race.cup_id].name : t('common.misc.unknown')) : '-'}</td>
          <td>${race.race_datetime ? formatDateTime(race.race_datetime) : '-'}</td>
          <td class="text-end">
            <div class="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${race.id}">${t('common.actions.edit')}</button>
              <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${race.id}">${t('common.actions.delete')}</button>
            </div>
          </td>
        </tr>
      `).join('');
    };

    const loadRaces = async () => {
      const filters = [];
      if (filterSeasonSelect.value) {
        filters.push({ column: 'season_id', operator: 'eq', value: filterSeasonSelect.value });
      }
      if (filterCupSelect.value) {
        filters.push({ column: 'cup_id', operator: 'eq', value: filterCupSelect.value });
      }
      races = await listRaces({ filters, order: { column: 'race_datetime', ascending: true } });
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
            renderCupOptions(selectedId);
            filterSeasonSelect.value = selectedId;
          }
        }
        renderFilterCupOptions(filterSeasonSelect.value || '');
        await loadRaces();
        renderTable();
      } catch (error) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-danger">${error.message}</td>
          </tr>
        `;
      }
    };
    
    seasonSelect.addEventListener('change', (event) => {
      renderCupOptions(event.target.value);
      if (event.target.value) {
        setStoredSeasonId(event.target.value);
      }
    });
    
    filterSeasonSelect.addEventListener('change', async (event) => {
      renderFilterCupOptions(event.target.value);
      if (event.target.value) {
        setStoredSeasonId(event.target.value);
      }
      await loadRaces();
      renderTable();
    });
    
    filterCupSelect.addEventListener('change', async () => {
      await loadRaces();
      renderTable();
    });
    
    filterClearButton.addEventListener('click', async () => {
      filterSeasonSelect.value = '';
      renderFilterCupOptions('');
      filterCupSelect.value = '';
      await loadRaces();
      renderTable();
    });
    
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const id = form.querySelector('#race-id').value;
      const seasonId = seasonSelect.value;
      const cupId = cupSelect.value || null;
      const name = form.querySelector('#race-name').value.trim();
      const location = form.querySelector('#race-location').value.trim();
      const raceDateTime = form.querySelector('#race-datetime').value;
      const affectsChampionship = form.querySelector('#race-affects').checked;
      
      [seasonSelect, cupSelect, nameInput, locationInput, dateTimeInput].forEach(clearFieldInvalid);
      let hasError = false;
      if (!isRequired(seasonId)) {
        setFieldInvalid(seasonSelect, t('validation.seasonRequired'));
        hasError = true;
      }
      if (!isRequired(name)) {
        setFieldInvalid(nameInput, t('validation.raceNameRequired'));
        hasError = true;
      }
      if (!isRequired(location)) {
        setFieldInvalid(locationInput, t('validation.locationRequired'));
        hasError = true;
      }
      if (!isRequired(raceDateTime)) {
        setFieldInvalid(dateTimeInput, t('validation.dateTimeRequired'));
        hasError = true;
      }
      
      if (cupId) {
        const cup = cups.find(item => item.id === cupId);
        if (!cup || cup.season_id !== seasonId) {
          setFieldInvalid(cupSelect, t('validation.cupBelongsSeason'));
          hasError = true;
        }
      }
      
      if (hasError) {
        showNotification(t('notifications.pleaseFix'), 'warning');
        return;
      }
      
      submitButton.disabled = true;
      try {
        const payload = {
          season_id: seasonId,
          cup_id: cupId || null,
          name,
          location,
          race_datetime: formatDateTimeForStorage(raceDateTime),
          affects_championship: affectsChampionship
        };
        
        if (id) {
          await updateRace(id, payload);
          showNotification(t('notifications.raceUpdated'), 'success');
        } else {
          await createRace(payload);
          showNotification(t('notifications.raceCreated'), 'success');
        }
        
        resetForm();
        await loadRaces();
        renderTable();
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        submitButton.disabled = false;
      }
    });
    
    cancelButton.addEventListener('click', () => {
      resetForm();
    });
    
    tableBody.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      
      const id = button.dataset.id;
      const action = button.dataset.action;
      const race = races.find(item => item.id === id);
      if (!race) return;
      
      if (action === 'edit') {
        form.querySelector('#race-id').value = race.id;
        seasonSelect.value = race.season_id;
        renderCupOptions(race.season_id);
        cupSelect.value = race.cup_id || '';
        form.querySelector('#race-name').value = race.name;
        form.querySelector('#race-location').value = race.location;
        form.querySelector('#race-datetime').value = race.race_datetime
          ? formatDateTimeForInput(race.race_datetime)
          : '';
        form.querySelector('#race-affects').checked = race.affects_championship !== false;
        formTitle.textContent = t('raceManagement.form.editTitle');
        submitButton.textContent = t('common.actions.update');
        cancelButton.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      if (action === 'delete') {
        const confirmed = await showConfirmation(t('raceManagement.confirmDelete'));
        if (!confirmed) {
          return;
        }
        try {
          await deleteRace(id);
          showNotification(t('notifications.raceDeleted'), 'success');
          await loadRaces();
          renderTable();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    });
    
    await loadData();
  }
};

export default RaceManagement;
