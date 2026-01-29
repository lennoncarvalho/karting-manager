/**
 * Driver Management Page
 * CRUD interface for drivers
 */

import { listDrivers, createDriver, updateDriver, deleteDriver, getSupabaseClient } from '../services/api.js';
import { isRequired, isValidEmail } from '../utils/validation.js';
import { showNotification, showConfirmation, setFieldInvalid, clearFieldInvalid } from '../utils/helpers.js';
import { getDriverImageHtml } from '../utils/image.js';

const DriverManagement = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-3">
        <h1 class="h3 mb-0">Drivers</h1>
        <a href="#/admin" class="btn btn-outline-secondary btn-sm w-100 w-sm-auto">Back to Dashboard</a>
      </div>
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0" id="driver-form-title">Create Driver</h2>
            </div>
            <div class="card-body">
              <form id="driver-form" novalidate>
                <input type="hidden" id="driver-id">
                <div class="mb-3">
                  <label class="form-label" for="driver-email">Email</label>
                  <input type="email" class="form-control" id="driver-email" required>
                  <div class="invalid-feedback">Email is required.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-name">Full Name</label>
                  <input type="text" class="form-control" id="driver-name" required>
                  <div class="invalid-feedback">Driver name is required.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-nickname">Nickname</label>
                  <input type="text" class="form-control" id="driver-nickname">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-birthdate">Birth Date</label>
                  <input type="date" class="form-control" id="driver-birthdate">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-sex">Sex</label>
                  <select class="form-select" id="driver-sex">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-blood">Blood Type</label>
                  <input type="text" class="form-control" id="driver-blood" placeholder="O+">
                </div>
                <div class="mb-3">
                  <label class="form-label" for="driver-picture">Picture</label>
                  <input type="file" class="form-control" id="driver-picture" accept="image/*">
                  <div class="form-text">Upload a profile picture (optional).</div>
                </div>
                <div class="d-flex flex-column flex-sm-row gap-2">
                  <button type="submit" class="btn btn-primary w-100 w-sm-auto flex-sm-grow-1" id="driver-submit">Create</button>
                  <button type="button" class="btn btn-outline-secondary d-none w-100 w-sm-auto" id="driver-cancel">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0">Existing Drivers</h2>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped align-middle">
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Email</th>
                      <th>Nickname</th>
                      <th>Birth Date</th>
                      <th class="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="driver-table-body">
                    <tr>
                      <td colspan="5" class="text-center text-muted">
                        <div class="d-flex align-items-center justify-content-center gap-2">
                          <div class="spinner-border spinner-border-sm" role="status"></div>
                          <span>Loading drivers...</span>
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
    
    let drivers = [];
    
    const resetForm = () => {
      form.reset();
      form.querySelector('#driver-id').value = '';
      form.querySelector('#driver-email').disabled = false;
      formTitle.textContent = 'Create Driver';
      submitButton.textContent = 'Create';
      cancelButton.classList.add('d-none');
    };
    
    const renderTable = () => {
      if (!drivers.length) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-muted">No drivers created yet.</td>
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
          <td>${driver.email}</td>
          <td>${driver.nickname || '-'}</td>
          <td>${driver.birth_date || '-'}</td>
          <td class="text-end">
            <div class="d-flex flex-column flex-md-row justify-content-end gap-2">
              <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${driver.id}">Edit</button>
              <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${driver.id}">Delete</button>
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
        throw new Error(error.message || 'Failed to upload image.');
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
      const pictureFile = form.querySelector('#driver-picture').files[0];
      
      [emailInput, nameInput].forEach(clearFieldInvalid);
      let hasError = false;
      if (!isRequired(email) || !isValidEmail(email)) {
        setFieldInvalid(emailInput, 'Valid email is required.');
        hasError = true;
      }
      if (!isRequired(name)) {
        setFieldInvalid(nameInput, 'Driver name is required.');
        hasError = true;
      }
      if (!id && drivers.some(driver => driver.email.toLowerCase() === email.toLowerCase())) {
        setFieldInvalid(emailInput, 'Email already exists.');
        hasError = true;
      }
      if (hasError) {
        showNotification('Please fix the highlighted fields.', 'warning');
        return;
      }
      
      submitButton.disabled = true;
      submitButton.textContent = id ? 'Updating...' : 'Creating...';
      
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
          picture_url: pictureUrl || null
        };
        
        if (id) {
          if (!payload.picture_url) {
            delete payload.picture_url;
          }
          await updateDriver(id, payload);
          showNotification('Driver updated.', 'success');
        } else {
          await createDriver(payload);
          showNotification('Driver created.', 'success');
        }
        
        resetForm();
        await loadDrivers();
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = id ? 'Update' : 'Create';
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
        formTitle.textContent = 'Edit Driver';
        submitButton.textContent = 'Update';
        cancelButton.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      if (action === 'delete') {
        const confirmed = await showConfirmation('Delete this driver? This cannot be undone.');
        if (!confirmed) {
          return;
        }
        try {
          await deleteDriver(id);
          showNotification('Driver deleted.', 'success');
          await loadDrivers();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    });
    
    await loadDrivers();
  }
};

export default DriverManagement;
