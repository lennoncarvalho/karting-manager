/**
 * Main Application Entry Point
 * Handles routing and page initialization
 */

import { isAuthenticated } from './services/auth.js';
import { showNotification } from './utils/helpers.js';
import { applyThemeForActiveSeason } from './services/theme.js';

import LoginPage from './pages/LoginPage.js';
import AdminDashboard from './pages/AdminDashboard.js';
import SeasonManagement from './pages/SeasonManagement.js';
import DriverManagement from './pages/DriverManagement.js';
import CupManagement from './pages/CupManagement.js';
import RaceManagement from './pages/RaceManagement.js';
import RaceDetail from './pages/RaceDetail.js';
import PublicRankings from './pages/PublicRankings.js';

/**
 * Simple hash-based router
 */
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.init();
  }
  
  init() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }
  
  /**
   * Register a route
   * @param {string} path - Route path (e.g., '/', '/login', '/admin')
   * @param {Function} handler - Route handler function
   */
  register(path, handler) {
    this.routes[path] = handler;
  }
  
  /**
   * Handle current route
   */
  async handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const path = hash.split('?')[0] || '/';
    const route = this.routes[path] || this.routes['/'];
    
    if (route) {
      try {
        await route();
      } catch (error) {
        console.error('Route error:', error);
        showNotification('Error loading page: ' + error.message, 'error');
      }
    }
  }
  
  /**
   * Navigate to a route
   * @param {string} path - Route path
   */
  navigate(path) {
    window.location.hash = path;
  }
}

// Initialize router
const router = new Router();

async function ensureAuthenticated() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    router.navigate('/login');
    return false;
  }
  return true;
}

/**
 * Default route - show public rankings or login
 */
router.register('/', async () => {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App container not found');
    return;
  }
  
  const authenticated = await isAuthenticated();
  
  if (authenticated) {
    // Redirect to admin dashboard
    router.navigate('/admin');
  } else {
    // Show public rankings
    router.navigate('/rankings');
  }
});

/**
 * Public rankings route
 */
router.register('/rankings', async () => {
  const app = document.getElementById('app');
  await PublicRankings.render(app);
});

/**
 * Login route
 */
router.register('/login', async () => {
  const app = document.getElementById('app');
  await LoginPage.render(app);
});

/**
 * Admin dashboard route
 */
router.register('/admin', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  const app = document.getElementById('app');
  await AdminDashboard.render(app);
});

router.register('/admin/seasons', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  const app = document.getElementById('app');
  await SeasonManagement.render(app);
});

router.register('/admin/drivers', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  const app = document.getElementById('app');
  await DriverManagement.render(app);
});

router.register('/admin/cups', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  const app = document.getElementById('app');
  await CupManagement.render(app);
});

router.register('/admin/races', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  const app = document.getElementById('app');
  await RaceManagement.render(app);
});

router.register('/admin/race', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  const app = document.getElementById('app');
  await RaceDetail.render(app);
});

// Export router for use in other modules
window.router = router;

// Initialize app
console.log('Kartarados Championship Manager initialized');
applyThemeForActiveSeason();
