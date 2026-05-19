import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

/**
 * App routes. Public routes are eager-loaded for the rankings landing
 * page (LCP target); everything admin-side is lazy-loaded.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/public-rankings/public-rankings.component').then(
        (m) => m.PublicRankingsComponent,
      ),
    title: 'Kartarados',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    title: 'Login — Kartarados',
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'seasons',
        loadComponent: () =>
          import('./features/seasons/seasons.component').then(
            (m) => m.SeasonsComponent,
          ),
      },
      {
        path: 'cups',
        loadComponent: () =>
          import('./features/cups/cups.component').then((m) => m.CupsComponent),
      },
      {
        path: 'drivers',
        loadComponent: () =>
          import('./features/drivers/drivers.component').then(
            (m) => m.DriversComponent,
          ),
      },
      {
        path: 'races',
        loadComponent: () =>
          import('./features/races/races.component').then(
            (m) => m.RacesComponent,
          ),
      },
      {
        path: 'races/:raceId',
        loadComponent: () =>
          import('./features/race-detail/race-detail.component').then(
            (m) => m.RaceDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'races/:raceId',
    loadComponent: () =>
      import('./features/race-detail/race-detail.component').then(
        (m) => m.RaceDetailComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
