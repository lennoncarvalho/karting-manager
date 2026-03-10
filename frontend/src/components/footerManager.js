/**
 * Footer Manager
 * Keeps a persistent footer and syncs when language changes
 */

import { renderFooter, updateFooter } from './Footer.js';

let currentFooter = null;
let currentContainer = null;

/**
 * Initialize footer in the given container
 * @param {HTMLElement} container - Footer container element
 */
export function initFooter(container) {
  if (!container) {
    return;
  }
  currentContainer = container;
  currentFooter = renderFooter();
  container.innerHTML = '';
  container.appendChild(currentFooter);
}

/**
 * Sync footer (re-render after language or theme changes)
 */
export function syncFooter() {
  if (!currentContainer || !currentFooter) {
    return;
  }
  currentFooter = updateFooter(currentFooter);
}
