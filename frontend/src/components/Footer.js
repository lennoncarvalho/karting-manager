/**
 * Footer Component
 * Bootstrap-based footer with season theming and language switcher
 */

import { changeLanguage, t, getCurrentLanguage } from '../services/i18n.js';

/**
 * Render footer
 * @returns {HTMLElement} Footer element
 */
export function renderFooter() {
  const currentYear = new Date().getFullYear();
  const currentLang = getCurrentLanguage();

  const footer = document.createElement('footer');
  footer.className = 'mt-auto py-3 text-white';
  footer.style.backgroundColor = 'var(--season-accent)';
  footer.setAttribute('role', 'contentinfo');

  footer.innerHTML = `
    <div class="container-fluid">
      <div class="row align-items-center">
        <!-- Left side: Creator info -->
        <div class="col-12 col-md-6 text-center text-md-start mb-2 mb-md-0">
          <div class="small">
            <div class="mb-1">
              <a href="https://www.linkedin.com/in/lennoncarvalho/"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="text-white text-decoration-none"
                 aria-label="${t('footer.linkedinAria')}">
                ${t('footer.createdBy')}
              </a>
              <span class="mx-2">|</span>
              <a href="https://github.com/lennoncarvalho/karting-manager/blob/main/LICENSE"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="text-white text-decoration-none"
                 aria-label="${t('footer.licenseAria')}">
                ${t('footer.license')}
              </a>
            </div>
            <div>${t('footer.copyright', { year: currentYear })}</div>
          </div>
        </div>

        <!-- Right side: GitHub icon and language flags -->
        <div class="col-12 col-md-6 text-center text-md-end">
          <div class="d-flex align-items-center justify-content-center justify-content-md-end gap-3">
            <a href="https://github.com/lennoncarvalho/karting-manager"
               target="_blank"
               rel="noopener noreferrer"
               class="text-white text-decoration-none"
               aria-label="${t('footer.githubAria')}">
              <i class="bi bi-github" style="font-size: 1.5rem;"></i>
            </a>
            <div class="d-flex align-items-center gap-2" role="group" aria-label="${t('footer.selectLanguage')}">
              <span class="small me-1">${t('footer.selectLanguage')}</span>
              <button type="button"
                      class="btn btn-link text-white p-1 fs-5 ${currentLang === 'pt-BR' ? 'opacity-100' : 'opacity-50'}"
                      id="lang-pt-br"
                      aria-label="${t('footer.languagePortuguese')}"
                      aria-pressed="${currentLang === 'pt-BR'}">
                🇧🇷
              </button>
              <button type="button"
                      class="btn btn-link text-white p-1 fs-5 ${currentLang === 'en' ? 'opacity-100' : 'opacity-50'}"
                      id="lang-en"
                      aria-label="${t('footer.languageEnglish')}"
                      aria-pressed="${currentLang === 'en'}">
                🇺🇸
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach language switcher event listeners
  const ptButton = footer.querySelector('#lang-pt-br');
  const enButton = footer.querySelector('#lang-en');

  if (ptButton) {
    ptButton.addEventListener('click', async () => {
      await changeLanguage('pt-BR');
    });
  }

  if (enButton) {
    enButton.addEventListener('click', async () => {
      await changeLanguage('en');
    });
  }

  return footer;
}

/**
 * Update footer (for language changes, etc.)
 * @param {HTMLElement} footerElement - Current footer element
 */
export function updateFooter(footerElement) {
  const parent = footerElement.parentNode;
  const newFooter = renderFooter();
  if (parent) {
    parent.replaceChild(newFooter, footerElement);
  }
  return newFooter;
}
