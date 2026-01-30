/**
 * Admin Dashboard
 * Navigation hub for admin actions
 */

import { isFirstAdmin, changePassword, createAdmin } from '../services/auth.js';
import { showNotification, setFieldInvalid, clearFieldInvalid } from '../utils/helpers.js';
import { isRequired, isValidEmail } from '../utils/validation.js';
import { t } from '../services/i18n.js';

const AdminDashboard = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 class="h3 mb-1">${t('adminDashboard.title')}</h1>
          <p class="h6 mb-0">${t('adminDashboard.subtitle')}</p>
        </div>
      </div>
      <div class="row g-3">
        <div class="col-md-6 col-lg-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">${t('adminDashboard.cards.races.title')}</h5>
              <p class="card-text">${t('adminDashboard.cards.races.description')}</p>
              <a href="#/admin/races" class="btn btn-outline-primary btn-sm">${t('common.actions.manage')}</a>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">${t('adminDashboard.cards.drivers.title')}</h5>
              <p class="card-text">${t('adminDashboard.cards.drivers.description')}</p>
              <a href="#/admin/drivers" class="btn btn-outline-primary btn-sm">${t('common.actions.manage')}</a>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">${t('adminDashboard.cards.cups.title')}</h5>
              <p class="card-text">${t('adminDashboard.cards.cups.description')}</p>
              <a href="#/admin/cups" class="btn btn-outline-primary btn-sm">${t('common.actions.manage')}</a>
            </div>
          </div>
        </div>
        <div class="col-md-6 col-lg-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">${t('adminDashboard.cards.seasons.title')}</h5>
              <p class="card-text">${t('adminDashboard.cards.seasons.description')}</p>
              <a href="#/admin/seasons" class="btn btn-outline-primary btn-sm">${t('common.actions.manage')}</a>
            </div>
          </div>
        </div>
      </div>
      <div class="row g-3 mt-4">
        <div class="col-lg-6">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0">${t('adminDashboard.changePassword.title')}</h2>
            </div>
            <div class="card-body">
              <form id="password-form" novalidate>
                <div class="mb-3">
                  <label class="form-label" for="new-password">${t('adminDashboard.changePassword.newPassword')}</label>
                  <input type="password" class="form-control" id="new-password" required>
                  <div class="invalid-feedback">${t('validation.newPasswordRequired')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="confirm-password">${t('adminDashboard.changePassword.confirmPassword')}</label>
                  <input type="password" class="form-control" id="confirm-password" required>
                  <div class="invalid-feedback">${t('validation.passwordsMustMatch')}</div>
                </div>
                <button type="submit" class="btn btn-primary" id="password-submit">${t('adminDashboard.changePassword.submit')}</button>
              </form>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h2 class="h6 mb-0">${t('adminDashboard.inviteAdmin.title')}</h2>
            </div>
            <div class="card-body">
              <form id="admin-form" novalidate>
                <div class="mb-3">
                  <label class="form-label" for="admin-email">${t('common.labels.email')}</label>
                  <input type="email" class="form-control" id="admin-email" required>
                  <div class="invalid-feedback">${t('validation.validEmailRequired')}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="admin-password">${t('adminDashboard.inviteAdmin.tempPassword')}</label>
                  <input type="password" class="form-control" id="admin-password" required>
                  <div class="invalid-feedback">${t('validation.tempPasswordRequired')}</div>
                </div>
                <button type="submit" class="btn btn-outline-primary" id="admin-submit">${t('adminDashboard.inviteAdmin.submit')}</button>
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
      adminNote.textContent = t('adminDashboard.inviteAdmin.noteOnlyFirst');
    } else {
      adminNote.textContent = t('adminDashboard.inviteAdmin.noteInfo');
    }
    
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFieldInvalid(newPasswordInput);
      clearFieldInvalid(confirmPasswordInput);
      
      let hasError = false;
      if (!isRequired(newPasswordInput.value)) {
        setFieldInvalid(newPasswordInput, t('validation.newPasswordRequired'));
        hasError = true;
      }
      if (newPasswordInput.value !== confirmPasswordInput.value) {
        setFieldInvalid(confirmPasswordInput, t('validation.passwordsMustMatch'));
        hasError = true;
      }
      if (hasError) {
        showNotification(t('notifications.pleaseFix'), 'warning');
        return;
      }
      
      passwordSubmit.disabled = true;
      passwordSubmit.textContent = t('adminDashboard.changePassword.updating');
      try {
        await changePassword(newPasswordInput.value);
        showNotification(t('notifications.passwordUpdated'), 'success');
        passwordForm.reset();
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        passwordSubmit.disabled = false;
        passwordSubmit.textContent = t('adminDashboard.changePassword.submit');
      }
    });
    
    adminForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!firstAdmin) {
        showNotification(t('notifications.onlyFirstAdmin'), 'warning');
        return;
      }
      clearFieldInvalid(adminEmailInput);
      clearFieldInvalid(adminPasswordInput);
      
      let hasError = false;
      const email = adminEmailInput.value.trim();
      const password = adminPasswordInput.value;
      if (!isRequired(email) || !isValidEmail(email)) {
        setFieldInvalid(adminEmailInput, t('validation.validEmailRequired'));
        hasError = true;
      }
      if (!isRequired(password)) {
        setFieldInvalid(adminPasswordInput, t('validation.tempPasswordRequired'));
        hasError = true;
      }
      if (hasError) {
        showNotification(t('notifications.pleaseFix'), 'warning');
        return;
      }
      
      adminSubmit.disabled = true;
      adminSubmit.textContent = t('adminDashboard.inviteAdmin.creating');
      try {
        await createAdmin(email, password);
        showNotification(t('notifications.adminCreated'), 'success');
        adminForm.reset();
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        adminSubmit.disabled = false;
        adminSubmit.textContent = t('adminDashboard.inviteAdmin.submit');
      }
    });
  }
};

export default AdminDashboard;
