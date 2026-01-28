/**
 * Login Page
 * Admin authentication form
 */

import { login } from '../services/auth.js';
import { renderNavigation } from '../components/Navigation.js';
import { isRequired } from '../utils/validation.js';
import { showNotification, setFieldInvalid, clearFieldInvalid } from '../utils/helpers.js';

const LoginPage = {
  async render(container) {
    container.innerHTML = '';
    
    const nav = renderNavigation({ isAuthenticated: false });
    container.appendChild(nav);
    
    const main = document.createElement('main');
    main.className = 'container mt-4';
    main.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow-sm">
            <div class="card-header text-white">
              <h1 class="h5 mb-0">Admin Login</h1>
            </div>
            <div class="card-body">
              <form id="login-form" novalidate>
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="email" name="email" required>
                  <div class="invalid-feedback">Email is required.</div>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input type="password" class="form-control" id="password" name="password" required>
                  <div class="invalid-feedback">Password is required.</div>
                </div>
                <button type="submit" class="btn btn-primary w-100" id="login-button">
                  Sign in
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
        setFieldInvalid(emailInput, 'Email is required.');
        hasError = true;
      }
      if (!isRequired(password)) {
        setFieldInvalid(passwordInput, 'Password is required.');
        hasError = true;
      }
      if (hasError) {
        showNotification('Please fix the highlighted fields.', 'warning');
        return;
      }
      
      button.disabled = true;
      button.textContent = 'Signing in...';
      
      try {
        await login(email, password);
        showNotification('Welcome back!', 'success');
        window.router.navigate('/admin');
      } catch (error) {
        showNotification(error.message, 'error');
      } finally {
        button.disabled = false;
        button.textContent = 'Sign in';
      }
    });
  }
};

export default LoginPage;
