---
name: angular
description: Build Angular 19+ frontends using standalone components, signals, the new control-flow syntax (@if/@for/@switch), strict separation of concerns (HTML/CSS/TS in separate files), and reusable directives/components. TRIGGER when working in an Angular project (angular.json present), generating components/directives/services, refactoring template syntax, configuring routing, or wiring Angular i18n.
---

# Angular (v19+) Skill

This skill encodes the conventions used in the Kartarados Angular rewrite. It is intentionally opinionated.

## Core Rules

1. **Angular version**: Target the latest stable Angular (≥ 19). Always use `ng new --standalone --routing --style=scss --strict`.
2. **Standalone everything**: No `NgModule`. Every component, directive, and pipe is `standalone: true` (Angular 19 makes this the default; do not declare it explicitly when on v19+).
3. **Signals over RxJS for state**:
   - Local component state → `signal()` and `computed()`.
   - Async values from services → `toSignal(observable$)` or `resource()` / `httpResource()`.
   - Only use plain RxJS for true streams (events, websockets).
4. **No NgRx**: State lives in `@Injectable({ providedIn: 'root' })` services that expose `signal()` / `computed()` getters and methods that mutate them. Keep services small and focused (one domain each).
5. **New control flow only**: Use `@if`, `@for`, `@switch`, `@let` in templates. Do **not** use `*ngIf`, `*ngFor`, `*ngSwitch`, or `ng-template` wrappers for the same purpose.
6. **Change detection**: Every component must set `changeDetection: ChangeDetectionStrategy.OnPush`. Combined with signals this gives near-zero needless re-renders.
7. **No `any`**: TypeScript `strict` is on. Type every input, output, return value, and HTTP payload.

## File Separation (Hard Rule)

Components MUST be split into three sibling files. **Never** use inline `template:` or `styles:` in `@Component`.

```
src/app/features/drivers/driver-card/
  driver-card.component.ts
  driver-card.component.html
  driver-card.component.scss   ← only if a generic Bootstrap utility cannot do it
  driver-card.component.spec.ts (optional, only if logic is non-trivial)
```

In the `@Component` decorator:

```ts
@Component({
  selector: 'kt-driver-card',
  templateUrl: './driver-card.component.html',
  styleUrl: './driver-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [/* only what this template uses */],
})
export class DriverCardComponent { /* ... */ }
```

If a component has **no custom styles** (preferred — use Bootstrap utilities), omit `styleUrl` entirely and do not create the `.scss` file.

## Naming & Selector Conventions

- **Selector prefix**: `kt-` (Kartarados). Configure in `angular.json` → `prefix: "kt"`.
- **File names**: kebab-case, ending with `.component.ts`, `.directive.ts`, `.service.ts`, `.pipe.ts`, `.guard.ts`.
- **Class names**: `PascalCase` + suffix (`DriverCardComponent`, `AuthService`, `DriverImageDirective`).
- **Folder layout**:
  ```
  src/app/
    core/            ← singletons, guards, interceptors, base services
    shared/          ← reusable components / directives / pipes (kt-button, kt-driver-image, …)
    features/        ← one folder per domain (drivers/, races/, rankings/, ocr/, …)
    layout/          ← navigation, footer
    app.routes.ts
    app.config.ts
  ```

## Reusable Components & Directives (mandatory)

Per project convention, **anything that can be a directive must be a directive**, and **anything used more than once must be a shared component**. Do not duplicate Bootstrap markup.

Always extract these into `shared/`:

- `kt-button` — single button component with `variant`, `size`, `loading`, `iconStart`, `iconEnd` inputs. All buttons in the app go through this.
- `kt-driver-image` — directive (or component) that renders a driver picture with the placeholder fallback rules (see Driver Image rules below).
- `kt-modal` — wraps `ng-bootstrap` modal service with a typed API.
- `kt-spinner`, `kt-badge`, `kt-empty-state`, `kt-loading-overlay`.
- `kt-season-select` — typed signal-driven season dropdown that reads/writes the selected season from `SeasonStore`.
- `kt-table` (optional) — for the rankings tables, if it pays off; otherwise plain `<table class="table">`.

Component inputs/outputs:

```ts
readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
readonly loading = input<boolean>(false);
readonly clicked = output<MouseEvent>();
```

Use Angular's new `input()` / `output()` / `model()` APIs — **not** `@Input()` / `@Output()` decorators.

## Routing

- Lazy-load every feature with `loadComponent` or `loadChildren`:
  ```ts
  { path: 'admin', loadChildren: () => import('./features/admin/admin.routes') }
  ```
- Guards are functional (`CanActivateFn`), not class-based.
- Public landing page (rankings) must be the default route and must NOT require auth.

## HTTP & Supabase

- Use `@supabase/supabase-js` directly through a single `SupabaseService` exposed via DI; do **not** call Supabase from components.
- For non-Supabase calls (e.g. Azure Document Intelligence OCR), use Angular's `HttpClient` with `provideHttpClient(withFetch())`.
- Use `httpResource()` / `resource()` for declarative async data in components.

## Forms

- Use **Reactive Forms** (`FormGroup`, `FormControl`) — never template-driven.
- Build typed forms with `nonNullable: true` defaults.
- Validation errors are surfaced through a shared `kt-form-error` component to keep templates clean.

## i18n

- Use `@angular/localize` (compile-time i18n). See the i18n section of the unified spec.
- Mark template text with `i18n="@@key"` attributes.
- Plurals/select via ICU.
- Locales: `pt-BR` (default), `en`.
- Date/number formatting via Angular's built-in pipes with `LOCALE_ID` injection.

## Performance Targets

- **First Contentful Paint** < 1.8 s on mid-tier mobile + 3G.
- **Largest Contentful Paint** < 2.5 s.
- **JS bundle (initial)** < 250 KB gzipped. Lazy-load admin routes.
- Enable Angular build optimizer, esbuild builder (default in v19), and AOT.

## Testing (minimal)

- Only test the critical paths required by the spec: points engine, OCR parsing/matching, auth guard.
- Use Vitest or Jest (project default). Karma is deprecated.
- E2E is **not required**.

## Gotchas

1. **`zone.js` removal**: Angular 19 supports zoneless. Default to zoneless (`provideZonelessChangeDetection()` in `app.config.ts`) — combined with signals and `OnPush` it cuts startup time.
2. **`afterRenderEffect`**: For DOM-side-effects driven by signals; do not put DOM manipulation inside `effect()`.
3. **Hydration**: Not relevant since we deploy a CSR-only SPA to Cloudflare Pages (no SSR).
4. **Strict templates**: Keep `strictTemplates: true` in `tsconfig.json`.
5. **Never import a feature module from another feature module** — go through `shared/` or `core/`.
6. **`HostBinding`/`HostListener`** are fine but prefer the `host: {}` object in the decorator.

## Reference Links

- Angular docs: https://angular.dev
- Signals guide: https://angular.dev/guide/signals
- Control flow: https://angular.dev/guide/templates/control-flow
- i18n: https://angular.dev/guide/i18n
- ng-bootstrap: https://ng-bootstrap.github.io
