/**
 * Navigation Component
 * Bootstrap navbar with Formula 1 styling
 */

import logoUrl from '../assets/icons/kartarados_3grays.png';
import { t } from '../services/i18n.js';

/**
 * Render navigation bar
 * @param {Object} options - Navigation options
 * @param {boolean} options.isAuthenticated - Whether user is authenticated
 * @param {string} options.currentUserEmail - Current user email
 * @param {Function} options.onLogout - Logout callback
 * @returns {HTMLElement} Navigation element
 */
export function renderNavigation(options = {}) {
  const { isAuthenticated = false, currentUserEmail = '', onLogout = null } = options;
  
  const nav = document.createElement('nav');
  nav.className = 'navbar navbar-expand-lg navbar-dark';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');
  
  nav.innerHTML = `
    <div class="container-fluid py-0 gap-3">
      <a href="#/rankings" aria-label="${t('nav.brandAria')}">
        <img src="${logoUrl}" alt="Club logo" height="80px">
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
              aria-controls="navbarNav" aria-expanded="false" aria-label="${t('nav.toggle')}">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-lg-auto">
          ${!isAuthenticated ? `
            <li class="nav-item">
              <a class="nav-link" href="#/rankings" aria-current="page">${t('nav.rankings')}</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#/login">${t('nav.adminLogin')}</a>
            </li>
          ` : `
            <li class="nav-item">
              <a class="nav-link" href="#/admin/seasons">${t('nav.seasons')}</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#/admin/drivers">${t('nav.drivers')}</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#/admin/cups">${t('nav.cups')}</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#/admin/races">${t('nav.races')}</a>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" 
                 data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-person-circle me-1"></i>
                ${currentUserEmail || t('nav.adminLabel')}
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li><a class="dropdown-item" href="#/admin/settings">${t('nav.settings')}</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" id="logout-link">${t('nav.logout')}</a></li>
              </ul>
            </li>
          `}
        </ul>
      </div>
    </div>
  `;
  
  // Attach logout handler
  if (isAuthenticated && onLogout) {
    const logoutLink = nav.querySelector('#logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.confirm(t('nav.confirmLogout'))) {
          await onLogout();
          window.location.hash = '/';
        }
      });
    }
  }

  const collapseElement = nav.querySelector('#navbarNav');
  if (collapseElement && window.bootstrap && window.bootstrap.Collapse) {
    const collapse = window.bootstrap.Collapse.getOrCreateInstance(collapseElement, { toggle: false });
    const collapseLinks = nav.querySelectorAll('.navbar-nav .nav-link, .navbar-nav .dropdown-item');
    collapseLinks.forEach((link) => {
      if (link.classList.contains('dropdown-toggle')) {
        return;
      }
      link.addEventListener('click', () => {
        if (collapseElement.classList.contains('show')) {
          collapse.hide();
        }
      });
    });
  }
  
  return nav;
}

/**
 * Update navigation state
 * @param {HTMLElement} navElement - Navigation element
 * @param {Object} options - Navigation options
 */
export function updateNavigation(navElement, options) {
  // Remove old nav and render new one
  const parent = navElement.parentNode;
  const newNav = renderNavigation(options);
  if (parent) {
    parent.replaceChild(newNav, navElement);
  }
}
