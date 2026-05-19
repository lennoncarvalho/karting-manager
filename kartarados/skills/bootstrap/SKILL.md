---
name: bootstrap
description: Use Bootstrap 5 (with ng-bootstrap in Angular projects) for UI markup, layout, and components. TRIGGER when laying out pages, building forms, adding buttons/modals/navs/badges/alerts, designing responsive grids, or applying utility classes. Goal — write zero custom CSS by leveraging utility classes; if custom CSS is unavoidable, scope it to a single reusable component.
---

# Bootstrap 5 + ng-bootstrap Skill

This skill encodes the styling conventions for the Kartarados Angular rewrite. The guiding principle is **utility-first** Bootstrap with **ng-bootstrap** for interactive components.

## Core Rules

1. **Bootstrap version**: Bootstrap 5.3+ (CSS only — no jQuery, no Bootstrap JS bundle).
2. **Interactive components**: Use **ng-bootstrap** (`@ng-bootstrap/ng-bootstrap`) for modals, dropdowns, tabs, popovers, tooltips, toasts, accordions, datepickers. ng-bootstrap is Angular-native and tree-shakes well; it does NOT use Bootstrap JS.
3. **Icons**: **Bootstrap Icons** (`bootstrap-icons` npm package). Use `<i class="bi bi-github"></i>` etc. Country flags also from Bootstrap Icons (`bi-flag` variants) or via `flag-icons` package if specific country flags are needed.
4. **No custom CSS by default**: Layout, spacing, typography, colors — all via utility classes (`d-flex`, `gap-2`, `mt-4`, `text-white`, `bg-light`, `rounded-circle`, …).
5. **Custom CSS only when**:
   - The visual cannot be achieved with utilities (e.g. a CSS variable that themes multiple elements), AND
   - It is scoped to a single shared Angular component (`*.component.scss` with `ViewEncapsulation.Emulated` — the default).
6. **No `!important`** in custom styles unless overriding a third-party rule with no alternative.

## Theming via CSS Variables

The app uses Bootstrap 5 CSS variables plus one custom variable for the active season accent color:

```css
:root {
  --kt-season-accent: #000000; /* updated at runtime when the active season changes */
}
```

Set this variable from the `ThemeService` (in TypeScript) whenever the selected season changes:

```ts
document.documentElement.style.setProperty('--kt-season-accent', season.accent_color);
```

Use it in CSS / utility-overrides:

```scss
.kt-navbar { background-color: var(--kt-season-accent); }
.kt-footer  { background-color: var(--kt-season-accent); }
.kt-th-accent { background-color: var(--kt-season-accent); color: #fff; }
```

These three rules are the **only allowed** custom CSS in the entire app for theming (besides component-scoped tweaks).

Preload the cached accent color BEFORE first paint by reading from localStorage in `index.html` and inlining a `<style>` tag — this prevents a color flash on slow networks.

## Layout Patterns

- **App shell**: `min-vh-100 d-flex flex-column` on the root container. Main `<main>` gets `flex-grow-1`. Footer naturally sticks to the bottom.
- **Page container**: `<main class="container mt-4 mb-5">` for centered content with default padding.
- **Section heading**: `<div class="d-flex align-items-center gap-2 mb-3">` with the title and any inline controls.
- **Forms**: Bootstrap `form-control`, `form-select`, `form-check`, `form-label`. Use `form-floating` for compact label-on-top inputs.
- **Tables**: `<table class="table table-striped align-middle">` wrapped in `<div class="table-responsive">`.
- **Buttons**: `btn btn-primary` / `btn-outline-secondary` / `btn-danger`. Inside `kt-button` shared component, derive class from `variant` input.
- **Modals**: Open via `NgbModal.open(MyComponent)` — never hand-roll Bootstrap modal markup in Angular.

## Responsive Rules

- Mobile-first. Build for 320 px width then enhance.
- Use `col-12 col-md-6 col-lg-4` style grids.
- Stack on mobile via `flex-column flex-md-row`.
- Footer mobile: vertical stack, desktop: `justify-content-between`.

## Forms

- Wrap each input in `<div class="mb-3">` with `<label class="form-label">`.
- Use `is-invalid` + `<div class="invalid-feedback">` for errors. The shared `kt-form-error` directive applies these classes from the Angular reactive form state.
- Disabled fields: add `disabled` attribute, never style manually.

## Tables in Rankings (Spec-Critical)

The public rankings page has multiple ranking tables. They must follow this column order:

```
| Pos | Driver | Total Points | Penalties | Best Position |
```

- `Pos` is a 1-based rank (computed, not stored).
- `Driver` cell = `<kt-driver-image>` + `<span>name</span>` flexed with `d-flex align-items-center gap-2`.
- `Total Points` uses `fw-semibold`.
- The table header background can use `var(--kt-season-accent)` via a single utility class `kt-th-accent`.

## ng-bootstrap Setup

```ts
// app.config.ts
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    // … router, http, etc.
  ],
};
```

In `styles.scss`:

```scss
@import 'bootstrap/scss/bootstrap';
@import 'bootstrap-icons/font/bootstrap-icons.css';

:root { --kt-season-accent: #000; }
.kt-navbar, .kt-footer { background-color: var(--kt-season-accent); color: #fff; }
.kt-th-accent { background-color: var(--kt-season-accent); color: #fff; }
```

That is the **whole** custom stylesheet for the app, by design.

## Gotchas

1. **Do NOT import `bootstrap/dist/js/bootstrap.bundle.js`** — ng-bootstrap replaces it entirely. Importing both will create double-handlers on dropdowns/modals.
2. **Datepicker locale**: ng-bootstrap datepickers need explicit locale config for `pt-BR`. Use `NgbDatepickerI18n`.
3. **`form-select` height**: don't override; align surrounding controls with `align-items-center`.
4. **`navbar-dark` text contrast**: when the season accent is light (e.g. yellow), white text on the navbar becomes unreadable. The `ThemeService` must compute a contrasting text color (`#fff` vs `#000`) from the accent and set `--kt-navbar-fg`.
5. **Bootstrap Icons via npm** — add to `angular.json` styles array so they're bundled.
6. **CSS variables in `@media` queries** work as expected; SCSS variables do not.

## Reference Links

- Bootstrap 5.3 docs: https://getbootstrap.com/docs/5.3/
- Utility classes index: https://getbootstrap.com/docs/5.3/utilities/api/
- ng-bootstrap: https://ng-bootstrap.github.io
- Bootstrap Icons: https://icons.getbootstrap.com
- `flag-icons`: https://flagicons.lipis.dev
