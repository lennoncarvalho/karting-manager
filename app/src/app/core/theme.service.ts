import { Injectable } from '@angular/core';

import type { Season } from './models';

const HEX_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

/**
 * Applies a season's accent color to the CSS custom property
 * `--kt-season-accent`. Mirrors v1 `frontend/src/services/theme.js`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  applySeasonTheme(season: Pick<Season, 'accent_color'> | null | undefined): void {
    if (!season || !season.accent_color) return;
    if (!HEX_REGEX.test(season.accent_color)) return;
    document.documentElement.style.setProperty('--kt-season-accent', season.accent_color);
  }

  reset(): void {
    document.documentElement.style.removeProperty('--kt-season-accent');
  }
}
