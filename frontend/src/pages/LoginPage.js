/**
 * Login Page
 * Admin authentication form
 */

import * as Sentry from '@sentry/browser';
import { login } from '../services/auth.js';
import { isRequired } from '../utils/validation.js';
import { showNotification, setFieldInvalid, clearFieldInvalid } from '../utils/helpers.js';
import { t } from '../services/i18n.js';

const LoginPage = {
  async render(container) {
    container.innerHTML = '';
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h1 class="h5 mb-0">${t('login.title')}</h1>
            </div>
            <div class="card-body">
              <form id="login-form" novalidate>
                <div class="mb-3">
                  <label for="email" class="form-label">${t('common.labels.email')}</label>
                  <input type="email" class="form-control" id="email" name="email" required>
                  <div class="invalid-feedback">${t('validation.emailRequired')}</div>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">${t('common.labels.password')}</label>
                  <input type="password" class="form-control" id="password" name="password" required>
                  <div class="invalid-feedback">${t('validation.passwordRequired')}</div>
                </div>
                <button type="submit" class="btn btn-primary w-100" id="login-button">
                  ${t('login.signIn')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(main);
    
    const form = main.querySelector('#login-form');
    const button = main.querySelector('#login-button');
    const emailInput = main.querySelector('#email');
    const passwordInput = main.querySelector('#password');
    
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value;
      
      clearFieldInvalid(emailInput);
      clearFieldInvalid(passwordInput);
      
      let hasError = false;
      if (!isRequired(email)) {
        setFieldInvalid(emailInput, t('validation.emailRequired'));
        hasError = true;
      }
      if (!isRequired(password)) {
        setFieldInvalid(passwordInput, t('validation.passwordRequired'));
        hasError = true;
      }
      if (hasError) {
        showNotification(t('notifications.pleaseFix'), 'warning');
        return;
      }
      
      button.disabled = true;
      button.textContent = t('login.signingIn');
      
      try {
        await login(email, password);
        showNotification(t('notifications.welcomeBack'), 'success');
        window.router.navigate('/admin');
      } catch (error) {
        Sentry.captureException(error);
        showNotification(error.message, 'error');
      } finally {
        button.disabled = false;
        button.textContent = t('login.signIn');
      }
    });
  }
};

export default LoginPage;
