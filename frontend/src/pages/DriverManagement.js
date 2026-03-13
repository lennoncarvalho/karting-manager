/**
 * Driver Management Page
 * CRUD interface for drivers
 */

import { listDrivers, createDriver, updateDriver, deleteDriver, getSupabaseClient } from '../services/api.js';
import { isRequired, isValidEmail } from '../utils/validation.js';
import { showNotification, showConfirmation, setFieldInvalid, clearFieldInvalid, withGlobalLoading } from '../utils/helpers.js';
import { getDriverImageHtml } from '../utils/image.js';
import { t } from '../services/i18n.js';

const DriverManagement = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <h1 class="h3 mb-0">${t('driverManagement.title')}</h1>
      </div>
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0" id="driver-form-title">${t('driverManagement.form.createTitle')}</h2>
            </div>
            <div class="card-body">
              <form id="driver-form" novalidate>
                <input type="hidden" id="driver-id">
                <div class="mb-3">
                  <label class="form-label" for="driver-email">${t('common.labels.email')}</label>
                  <input type="email" class="form-control" id="driver-email" required>
                  <div class="invalid-feedback">${t('validation.emailRequired')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-name">${t('driverManagement.form.fullName')}</label>
                  <input type="text" class="form-control" id="driver-name" required>
                  <div class="invalid-feedback">${t('validation.driverNameRequired')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-nickname">${t('driverManagement.form.nickname')}</label>
                  <input type="text" class="form-control" id="driver-nickname">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-birthdate">${t('driverManagement.form.birthDate')}</label>
                  <input type="date" class="form-control" id="driver-birthdate">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-sex">${t('driverManagement.form.sex')}</label>
                  <select class="form-select" id="driver-sex">
                    <option value="">${t('driverManagement.form.sexSelect')}</option>
                    <option value="Male">${t('driverManagement.form.sexMale')}</option>
                    <option value="Female">${t('driverManagement.form.sexFemale')}</option>
                    <option value="Other">${t('driverManagement.form.sexOther')}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-blood">${t('driverManagement.form.bloodType')}</label>
                  <input type="text" class="form-control" id="driver-blood" placeholder="${t('driverManagement.form.bloodPlaceholder')}">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-weight">${t('common.labels.weight')}</label>
                  <input type="number" class="form-control" id="driver-weight" min="0" step="0.1" placeholder="${t('driverManagement.form.weightPlaceholder')}">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-picture">${t('common.labels.picture')}</label>
                  <input type="file" class="form-control" id="driver-picture" accept="image/*">
                  <div class="form-text">${t('driverManagement.form.pictureHelp')}</div>
                </div>
                <div class="d-flex flex-column flex-sm-row gap-2">
                  <button type="submit" class="btn btn-primary w-100 w-sm-auto flex-sm-grow-1" id="driver-submit">${t('common.actions.create')}</button>
                  <button type="button" class="btn btn-outline-secondary d-none w-100 w-sm-auto" id="driver-cancel">${t('common.actions.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0">${t('driverManagement.list.title')}</h2>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>${t('driverManagement.table.driver')}</th>
                      <th>${t('driverManagement.table.weight')}</th>
                      <th>${t('driverManagement.table.nickname')}</th>
                      <th>${t('driverManagement.table.birthDate')}</th>
                      <th class="text-end">${t('driverManagement.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody id="driver-table-body">
                    <tr>
                      <td colspan="5" class="text-center">
                        <div class="d-flex align-items-center justify-content-center gap-2">
                          <div class="spinner-border spinner-border-sm" role="status"></div>
                          <span>${t('common.status.loadingDrivers')}</span>
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
    
    const form = main.querySelector('#driver-form');
    const formTitle = main.querySelector('#driver-form-title');
    const submitButton = main.querySelector('#driver-submit');
    const cancelButton = main.querySelector('#driver-cancel');
    const tableBody = main.querySelector('#driver-table-body');
    const emailInput = main.querySelector('#driver-email');
    const nameInput = main.querySelector('#driver-name');
    const weightInput = main.querySelector('#driver-weight');
    
    let drivers = [];
    
    const resetForm = () => {
      form.reset();
      form.querySelector('#driver-id').value = '';
      form.querySelector('#driver-email').disabled = false;
      formTitle.textContent = t('driverManagement.form.createTitle');
      submitButton.textContent = t('common.actions.create');
      cancelButton.classList.add('d-none');
    };
    
    const renderTable = () => {
      if (!drivers.length) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center">${t('driverManagement.list.empty')}</td>
          </tr>
        `;
        return;
      }
      
      tableBody.innerHTML = drivers.map((driver) => `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              ${getDriverImageHtml({
                src: driver.picture_url,
                seed: driver.id || driver.email || driver.name,
                alt: driver.name,
                className: 'rounded-circle',
                size: 36
              })}
              <span>${driver.name}</span>
            </div>
          </td>
          <td>${driver.weight !== null && driver.weight !== undefined ? driver.weight : '-'}</td>
          <td>${driver.nickname || '-'}</td>
          <td>${driver.birth_date || '-'}</td>
          <td class="text-end">
            <div class="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${driver.id}">${t('common.actions.edit')}</button>
              <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${driver.id}">${t('common.actions.delete')}</button>
            </div>
          </td>
        </tr>
      `).join('');
    };
    
    const loadDrivers = async () => {
      try {
        drivers = await listDrivers({ order: { column: 'name', ascending: true } });
        renderTable();
      } catch (error) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-danger">${error.message}</td>
          </tr>
        `;
      }
    };
    
    const uploadPicture = async (file) => {
      if (!file) {
        return null;
      }
      const supabase = getSupabaseClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('driver-pictures')
        .upload(fileName, file);
      
      if (error) {
        throw new Error(error.message || t('errors.uploadFailed'));
      }
      
      const { data: publicData } = supabase.storage
        .from('driver-pictures')
        .getPublicUrl(data.path);
      
      return publicData.publicUrl;
    };
    
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const id = form.querySelector('#driver-id').value;
      const email = form.querySelector('#driver-email').value.trim();
      const name = form.querySelector('#driver-name').value.trim();
      const nickname = form.querySelector('#driver-nickname').value.trim();
      const birthDate = form.querySelector('#driver-birthdate').value;
      const sex = form.querySelector('#driver-sex').value;
      const bloodType = form.querySelector('#driver-blood').value.trim();
      const weightValue = form.querySelector('#driver-weight').value;
      const weight = weightValue ? Number(weightValue) : null;
      const pictureFile = form.querySelector('#driver-picture').files[0];
      
      [emailInput, nameInput, weightInput].forEach(clearFieldInvalid);
      let hasError = false;
      if (!isRequired(email) || !isValidEmail(email)) {
        setFieldInvalid(emailInput, t('validation.validEmailRequired'));
        hasError = true;
      }
      if (!isRequired(name)) {
        setFieldInvalid(nameInput, t('validation.driverNameRequired'));
        hasError = true;
      }
      if (weightValue && Number.isNaN(weight)) {
        setFieldInvalid(weightInput, t('validation.weightMustBeNumber'));
        hasError = true;
      }
      if (!id && drivers.some(driver => driver.email.toLowerCase() === email.toLowerCase())) {
        setFieldInvalid(emailInput, t('validation.emailExists'));
        hasError = true;
      }
      if (hasError) {
        showNotification(t('notifications.pleaseFix'), 'warning');
        return;
      }
      
      submitButton.disabled = true;
      submitButton.textContent = id ? t('common.status.updating') : t('common.status.creating');
      
      try {
        let pictureUrl = null;
        if (pictureFile) {
          pictureUrl = await uploadPicture(pictureFile);
        }
        
        const payload = {
          email,
          name,
          nickname: nickname || null,
          birth_date: birthDate || null,
          sex: sex || null,
          blood_type: bloodType || null,
          weight: weight,
          picture_url: pictureUrl || null
        };
        
        if (id) {
          if (!payload.picture_url) {
            delete payload.picture_url;
          }
          await updateDriver(id, payload);
          showNotification(t('notifications.driverUpdated'), 'success');
        } else {
          await createDriver(payload);
          showNotification(t('notifications.driverCreated'), 'success');
        }
        
        resetForm();
        await loadDrivers();
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = id ? t('common.actions.update') : t('common.actions.create');
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
      const driver = drivers.find(item => item.id === id);
      if (!driver) return;
      
      if (action === 'edit') {
        form.querySelector('#driver-id').value = driver.id;
        form.querySelector('#driver-email').value = driver.email;
        form.querySelector('#driver-email').disabled = true;
        form.querySelector('#driver-name').value = driver.name;
        form.querySelector('#driver-nickname').value = driver.nickname || '';
        form.querySelector('#driver-birthdate').value = driver.birth_date || '';
        form.querySelector('#driver-sex').value = driver.sex || '';
        form.querySelector('#driver-blood').value = driver.blood_type || '';
        form.querySelector('#driver-weight').value = driver.weight || '';
        formTitle.textContent = t('driverManagement.form.editTitle');
        submitButton.textContent = t('common.actions.update');
        cancelButton.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      if (action === 'delete') {
        const confirmed = await showConfirmation(t('driverManagement.confirmDelete'));
        if (!confirmed) {
          return;
        }
        await withGlobalLoading(async () => {
          try {
            await deleteDriver(id);
            showNotification(t('notifications.driverDeleted'), 'success');
            await loadDrivers();
          } catch (error) {
            showNotification(error.message, 'error');
          }
        });
      }
    });
    
    await loadDrivers();
  }
};

export default DriverManagement;
