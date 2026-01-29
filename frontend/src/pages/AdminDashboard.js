/**
 * Admin Dashboard
 * Navigation hub for admin actions
 */

import { isFirstAdmin, changePassword, createAdmin } from '../services/auth.js';
import { showNotification, setFieldInvalid, clearFieldInvalid } from '../utils/helpers.js';
import { isRequired, isValidEmail } from '../utils/validation.js';

const AdminDashboard = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 class="h3 mb-1">Admin Dashboard</h1>
          <p class="text-muted mb-0">Manage seasons, drivers, cups, and races.</p>
        </div>
        <a href="#/admin/seasons" class="btn btn-primary w-100 w-md-auto">Create Season</a>
      </div>
      <div class="row g-3">
        <div class="col-md-6 col-lg-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Seasons</h5>
              <p class="card-text">Set up yearly championships and accent colors.</p>
              <a href="#/admin/seasons" class="btn btn-outline-primary btn-sm">Manage</a>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Drivers</h5>
              <p class="card-text">Create driver profiles and upload photos.</p>
              <a href="#/admin/drivers" class="btn btn-outline-primary btn-sm">Manage</a>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Cups</h5>
              <p class="card-text">Optional cup series inside each season.</p>
              <a href="#/admin/cups" class="btn btn-outline-primary btn-sm">Manage</a>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Races</h5>
              <p class="card-text">Create races and assign them to cups.</p>
              <a href="#/admin/races" class="btn btn-outline-primary btn-sm">Manage</a>
            </div>
          </div>
        </div>
      </div>
      <div class="row g-3 mt-4">
        <div class="col-lg-6">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0">Change Password</h2>
            </div>
            <div class="card-body">
              <form id="password-form" novalidate>
                <div class="mb-3">
                  <label class="form-label" for="new-password">New Password</label>
                  <input type="password" class="form-control" id="new-password" required>
                  <div class="invalid-feedback">New password is required.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="confirm-password">Confirm Password</label>
                  <input type="password" class="form-control" id="confirm-password" required>
                  <div class="invalid-feedback">Passwords must match.</div>
                </div>
                <button type="submit" class="btn btn-primary" id="password-submit">Update Password</button>
              </form>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0">Create Admin</h2>
            </div>
            <div class="card-body">
              <form id="admin-form" novalidate>
                <div class="mb-3">
                  <label class="form-label" for="admin-email">Email</label>
                  <input type="email" class="form-control" id="admin-email" required>
                  <div class="invalid-feedback">Valid email is required.</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="admin-password">Temporary Password</label>
                  <input type="password" class="form-control" id="admin-password" required>
                  <div class="invalid-feedback">Temporary password is required.</div>
                </div>
                <button type="submit" class="btn btn-outline-primary" id="admin-submit">Create Admin</button>
                <div class="form-text mt-2" id="admin-note"></div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(main);
    
    const passwordForm = main.querySelector('#password-form');
    const newPasswordInput = main.querySelector('#new-password');
    const confirmPasswordInput = main.querySelector('#confirm-password');
    const passwordSubmit = main.querySelector('#password-submit');
    
    const adminForm = main.querySelector('#admin-form');
    const adminEmailInput = main.querySelector('#admin-email');
    const adminPasswordInput = main.querySelector('#admin-password');
    const adminSubmit = main.querySelector('#admin-submit');
    const adminNote = main.querySelector('#admin-note');
    
    const firstAdmin = await isFirstAdmin();
    if (!firstAdmin) {
      adminSubmit.disabled = true;
      adminNote.textContent = 'Only the first admin can create new admin accounts.';
    } else {
      adminNote.textContent = 'New admins will receive the temporary password you provide.';
    }
    
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFieldInvalid(newPasswordInput);
      clearFieldInvalid(confirmPasswordInput);
      
      let hasError = false;
      if (!isRequired(newPasswordInput.value)) {
        setFieldInvalid(newPasswordInput, 'New password is required.');
        hasError = true;
      }
      if (newPasswordInput.value !== confirmPasswordInput.value) {
        setFieldInvalid(confirmPasswordInput, 'Passwords must match.');
        hasError = true;
      }
      if (hasError) {
        showNotification('Please fix the highlighted fields.', 'warning');
        return;
      }
      
      passwordSubmit.disabled = true;
      passwordSubmit.textContent = 'Updating...';
      try {
        await changePassword(newPasswordInput.value);
        showNotification('Password updated.', 'success');
        passwordForm.reset();
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        passwordSubmit.disabled = false;
        passwordSubmit.textContent = 'Update Password';
      }
    });
    
    adminForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!firstAdmin) {
        showNotification('Only the first admin can create new admins.', 'warning');
        return;
      }
      clearFieldInvalid(adminEmailInput);
      clearFieldInvalid(adminPasswordInput);
      
      let hasError = false;
      const email = adminEmailInput.value.trim();
      const password = adminPasswordInput.value;
      if (!isRequired(email) || !isValidEmail(email)) {
        setFieldInvalid(adminEmailInput, 'Valid email is required.');
        hasError = true;
      }
      if (!isRequired(password)) {
        setFieldInvalid(adminPasswordInput, 'Temporary password is required.');
        hasError = true;
      }
      if (hasError) {
        showNotification('Please fix the highlighted fields.', 'warning');
        return;
      }
      
      adminSubmit.disabled = true;
      adminSubmit.textContent = 'Creating...';
      try {
        await createAdmin(email, password);
        showNotification('Admin created successfully.', 'success');
        adminForm.reset();
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        adminSubmit.disabled = false;
        adminSubmit.textContent = 'Create Admin';
      }
    });
  }
};

export default AdminDashboard;
