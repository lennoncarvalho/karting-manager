/**
 * Navigation Manager
 * Keeps a persistent navbar and syncs auth state.
 */

import { renderNavigation } from './Navigation.js';
import { getCurrentUser, isAuthenticated, logout } from '../services/auth.js';
import { showNotification } from '../utils/helpers.js';

let navHost = null;
let lastState = { isAuthenticated: null, email: null };

function buildNavOptions(isAuth, email) {
  return {
    isAuthenticated: isAuth,
    currentUserEmail: email || '',
    onLogout: async () => {
      await logout();
      showNotification('Logged out successfully.', 'success');
      await syncNavigation();
      window.location.hash = '/';
    }
  };
}

export function initNavigation(host) {
  navHost = host;
  if (!navHost) {
    return;
  }
  navHost.replaceChildren(renderNavigation(buildNavOptions(false, '')));
  lastState = { isAuthenticated: false, email: '' };
}

export async function syncNavigation() {
  if (!navHost) {
    return;
  }
  const isAuth = await isAuthenticated();
  const user = isAuth ? await getCurrentUser() : null;
  const email = user && user.email ? user.email : '';
  if (lastState.isAuthenticated === isAuth && lastState.email === email) {
    return;
  }
  navHost.replaceChildren(renderNavigation(buildNavOptions(isAuth, email)));
  lastState = { isAuthenticated: isAuth, email };
}
