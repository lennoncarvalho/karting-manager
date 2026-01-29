/**
 * Season Management Page
 * CRUD interface for seasons
 */

import { listSeasons, createSeason, updateSeason, deleteSeason } from '../services/api.js';
import { isRequired, isValidDateRange, isValidHexColor } from '../utils/validation.js';
import { showNotification, showConfirmation, setFieldInvalid, clearFieldInvalid } from '../utils/helpers.js';

const SeasonManagement = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <h1 class="h3 mb-0">Seasons</h1>
        <a href="#/admin" class="btn btn-outline-secondary btn-sm w-100 w-sm-auto">Back to Dashboard</a>
      </div>
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0" id="season-form-title">Create Season</h2>
            </div>
            <div class="card-body">
              <form id="season-form" novalidate>
                <input type="hidden" id="season-id">
                <div class="mb-3">
                  <label class="form-label" for="season-name">Name</label>
                  <input type="text" class="form-control" id="season-name" required>
                  <div class="invalid-feedback">Season name is required.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="season-start">Start Date</label>
                  <input type="date" class="form-control" id="season-start" required>
                  <div class="invalid-feedback">Start date is required.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="season-end">End Date</label>
                  <input type="date" class="form-control" id="season-end" required>
                  <div class="invalid-feedback">End date must be after start date.</div>
                </div>
                <div class="mb-3">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="season-ongoing">
                    <label class="form-check-label" for="season-ongoing">Ongoing season</label>
                  </div>
                  <div class="form-text">Marked seasons are preferred on the public rankings page.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="season-color">Accent Color</label>
                  <input type="color" class="form-control form-control-color" id="season-color" value="#000000" required>
                  <div class="invalid-feedback">Accent color is required.</div>
                </div>
                <div class="d-flex flex-column flex-sm-row gap-2">
                  <button type="submit" class="btn btn-primary w-100 w-sm-auto flex-sm-grow-1" id="season-submit">Create</button>
                  <button type="button" class="btn btn-outline-secondary d-none w-100 w-sm-auto" id="season-cancel">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0">Existing Seasons</h2>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Accent</th>
                      <th class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="season-table-body">
                    <tr>
                      <td colspan="5" class="text-center text-muted">
                        <div class="d-flex align-items-center justify-content-center gap-2">
                          <div class="spinner-border spinner-border-sm" role="status"></div>
                          <span>Loading seasons...</span>
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
    
    const form = main.querySelector('#season-form');
    const formTitle = main.querySelector('#season-form-title');
    const submitButton = main.querySelector('#season-submit');
    const cancelButton = main.querySelector('#season-cancel');
    const tableBody = main.querySelector('#season-table-body');
    const nameInput = main.querySelector('#season-name');
    const startInput = main.querySelector('#season-start');
    const endInput = main.querySelector('#season-end');
    const colorInput = main.querySelector('#season-color');
    
    let seasons = [];
    
    const resetForm = () => {
      form.reset();
      form.querySelector('#season-id').value = '';
      form.querySelector('#season-color').value = '#000000';
      form.querySelector('#season-ongoing').checked = false;
      formTitle.textContent = 'Create Season';
      submitButton.textContent = 'Create';
      cancelButton.classList.add('d-none');
    };
    
    const renderTable = () => {
      if (!seasons.length) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-muted">No seasons created yet.</td>
          </tr>
        `;
        return;
      }
      
      tableBody.innerHTML = seasons.map((season) => `
        <tr>
          <td>${season.name}</td>
          <td>${season.start_date}</td>
          <td>${season.end_date}</td>
          <td>
            <span class="badge" style="background-color:${season.accent_color}; color:#fff;">${season.accent_color}</span>
          </td>
          <td class="text-end">
            <div class="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${season.id}">Edit</button>
              <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${season.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
    };
    
    const loadSeasons = async () => {
      try {
        seasons = await listSeasons({ order: { column: 'start_date', ascending: true } });
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
      const id = form.querySelector('#season-id').value;
      const payload = {
        name: form.querySelector('#season-name').value.trim(),
        start_date: form.querySelector('#season-start').value,
        end_date: form.querySelector('#season-end').value,
        accent_color: form.querySelector('#season-color').value,
        is_ongoing: form.querySelector('#season-ongoing').checked
      };
      
      [nameInput, startInput, endInput, colorInput].forEach(clearFieldInvalid);
      let hasError = false;
      if (!isRequired(payload.name)) {
        setFieldInvalid(nameInput, 'Season name is required.');
        hasError = true;
      }
      if (!isRequired(payload.start_date)) {
        setFieldInvalid(startInput, 'Start date is required.');
        hasError = true;
      }
      if (!isRequired(payload.end_date) || !isValidDateRange(payload.start_date, payload.end_date)) {
        setFieldInvalid(endInput, 'End date must be after start date.');
        hasError = true;
      }
      if (!isValidHexColor(payload.accent_color)) {
        setFieldInvalid(colorInput, 'Accent color must be valid.');
        hasError = true;
      }
      if (hasError) {
        showNotification('Please fix the highlighted fields.', 'warning');
        return;
      }
      
      submitButton.disabled = true;
      try {
        if (id) {
          await updateSeason(id, payload);
          showNotification('Season updated.', 'success');
        } else {
          await createSeason(payload);
          showNotification('Season created.', 'success');
        }
        resetForm();
        await loadSeasons();
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
      const season = seasons.find(item => item.id === id);
      
      if (!season) return;
      
      if (action === 'edit') {
        form.querySelector('#season-id').value = season.id;
        form.querySelector('#season-name').value = season.name;
        form.querySelector('#season-start').value = season.start_date;
        form.querySelector('#season-end').value = season.end_date;
        form.querySelector('#season-color').value = season.accent_color;
        form.querySelector('#season-ongoing').checked = !!season.is_ongoing;
        formTitle.textContent = 'Edit Season';
        submitButton.textContent = 'Update';
        cancelButton.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      if (action === 'delete') {
        const confirmed = await showConfirmation('Delete this season? This cannot be undone.');
        if (!confirmed) {
          return;
        }
        try {
          await deleteSeason(id);
          showNotification('Season deleted.', 'success');
          await loadSeasons();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    });
    
    await loadSeasons();
  }
};

export default SeasonManagement;
