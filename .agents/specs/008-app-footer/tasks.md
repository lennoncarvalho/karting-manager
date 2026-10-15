# Tasks: Application Footer

## Task Breakdown

### Phase 1: Foundation (Core Footer Structure)

#### T001 [P1] Add footer translations
- **File**: `frontend/src/translations/en.json`
- **File**: `frontend/src/translations/pt-BR.json`
- **Description**: Add translation keys for footer text
- **Keys to add**:
  - `footer.createdBy` - "Created by {name}"
  - `footer.license` - "MIT License"
  - `footer.copyright` - "© {year} {name}"
  - `footer.githubAria` - "Visit GitHub repository"
  - `footer.linkedinAria` - "Visit creator's LinkedIn profile"
  - `footer.licenseAria` - "View MIT License"
  - `footer.selectLanguage` - "Select language"
  - `footer.languagePortuguese` - "Portuguese (Brazil)"
  - `footer.languageEnglish` - "English"
- **Acceptance**: Translation files contain all required footer keys in both languages
- **Estimated effort**: 15 minutes

---

#### T002 [P1] Create Footer component
- **File**: `frontend/src/components/Footer.js` (new file)
- **Description**: Create footer component with Bootstrap utilities
- **Requirements**:
  - Export `renderFooter()` function returning HTMLElement
  - Use semantic `<footer>` element
  - Apply `background-color: var(--season-accent)` and `text-white`
  - Left side: Creator text with LinkedIn link, MIT license link, copyright
  - Right side: GitHub icon link
  - Use Bootstrap grid: `container-fluid`, `row`, `col-12 col-md-6`
  - Responsive: center on mobile (`text-center`), left/right on desktop (`text-md-start`/`text-md-end`)
  - All external links: `target="_blank" rel="noopener noreferrer"`
  - Dynamic year calculation: `new Date().getFullYear()`
  - Integrate with i18n service for translations
  - Add proper ARIA labels to all links
- **Links**:
  - LinkedIn: `https://www.linkedin.com/in/lennoncarvalho/`
  - GitHub: `https://github.com/lennoncarvalho/karting-manager`
  - MIT License: `https://github.com/lennoncarvalho/karting-manager/blob/main/LICENSE`
- **Bootstrap classes to use**:
  - Footer: `mt-auto py-3 text-white`
  - Container: `container-fluid`
  - Row: `row align-items-center`
  - Columns: `col-12 col-md-6 text-center text-md-start mb-2 mb-md-0` (left), `col-12 col-md-6 text-center text-md-end` (right)
  - Links: `text-white text-decoration-none`
  - GitHub icon: `bi bi-github fs-4`
- **Acceptance**: Footer component renders with correct content, links, and responsive layout
- **Estimated effort**: 1.5 hours

---

#### T003 [P1] Add footer container to app layout
- **File**: `frontend/src/main.js`
- **Description**: Modify `ensureLayout()` to include footer container
- **Changes**:
  - Add `footerHost` creation: `document.createElement('div')` with `data-app-footer` attribute
  - Append `footerHost` after `mainHost`
  - Return `footerHost` in layout object
  - Add flexbox classes to app container: `d-flex flex-column min-vh-100`
  - Add `flex-grow-1` to `mainHost` to push footer down
- **Acceptance**: App container has three children (navHost, mainHost, footerHost) and uses flexbox layout
- **Estimated effort**: 30 minutes

---

#### T004 [P1] Create footerManager module
- **File**: `frontend/src/components/footerManager.js` (new file)
- **Description**: Create footer manager to handle initialization and updates
- **Requirements**:
  - Export `initFooter(container)` function
  - Export `syncFooter()` function
  - Keep reference to footer DOM element
  - `initFooter()` should call `renderFooter()` and append to container
  - `syncFooter()` should re-render footer (replace existing with new)
  - Pass current language to `renderFooter()` if needed
- **Acceptance**: Footer manager can initialize and update footer dynamically
- **Estimated effort**: 45 minutes

---

#### T005 [P1] Initialize footer in main app
- **File**: `frontend/src/main.js`
- **Description**: Call footer initialization during app startup
- **Changes**:
  - Import `initFooter` and `syncFooter` from `footerManager.js`
  - In `startApp()`, after `initNavigation()`, call `initFooter(layout.footerHost)`
  - In `onLanguageChanged()` callback, call `syncFooter()` after `syncNavigation()`
- **Acceptance**: Footer appears on all pages and updates when language changes
- **Estimated effort**: 15 minutes

---

### Phase 2: Language Switcher Migration

#### T006 [P1] Add language switcher to Footer
- **File**: `frontend/src/components/Footer.js`
- **Description**: Add language flag icons to footer right side
- **Requirements**:
  - Use Unicode flags: 🇧🇷 (Brazil) and 🇺🇸 (US)
  - Place flags after GitHub icon
  - Add click handlers that call `changeLanguage('pt-BR')` or `changeLanguage('en')`
  - Highlight active language (e.g., higher opacity or subtle border)
  - Wrap flags in buttons with proper ARIA labels
  - Import `changeLanguage` from `i18n.js`
  - Handle language change: re-render footer to update active state
- **Layout**: `[GitHub Icon] [BR Flag Button] [US Flag Button]`
- **Bootstrap classes**:
  - Flags container: `d-flex align-items-center gap-2 ms-3`
  - Flag buttons: `btn btn-link text-white p-1` with opacity classes
  - Active flag: `opacity-100`
  - Inactive flag: `opacity-50`
- **Acceptance**: Language flags appear in footer and switch language when clicked
- **Estimated effort**: 1 hour

---

#### T007 [P1] Remove language switcher from Navigation
- **File**: `frontend/src/components/Navigation.js`
- **Description**: Remove language select element from navbar
- **Changes**:
  - Remove lines 69-76 (language switcher HTML in template)
  - Remove lines 94-100 (language select event listener)
  - Remove `currentLanguage` parameter from `renderNavigation()` if no longer used
- **Acceptance**: Navigation component no longer contains language switcher
- **Estimated effort**: 15 minutes

---

#### T008 [P2] Update navigationManager for language switcher removal
- **File**: `frontend/src/components/navigationManager.js`
- **Description**: Remove language-related logic if no longer needed
- **Changes**:
  - Check if `currentLanguage` is still passed to `renderNavigation()`
  - Remove if not needed
  - Ensure nav still re-renders on language change for translated text
- **Acceptance**: Navigation manager works without language switcher logic
- **Estimated effort**: 15 minutes

---

### Phase 3: Testing & Refinement

#### T009 [P1] Test footer on all pages
- **Pages to test**:
  - Login page (`/login`)
  - Public rankings (`/rankings`)
  - Admin dashboard (`/admin`)
  - Season management (`/admin/seasons`)
  - Driver management (`/admin/drivers`)
  - Cup management (`/admin/cups`)
  - Race management (`/admin/races`)
  - Race detail (`/admin/race`)
- **Verification**:
  - Footer appears on each page
  - Footer color matches navbar color
  - All links work and open in new tabs
  - Footer is positioned correctly (bottom of viewport or after content)
- **Acceptance**: Footer displays consistently across all pages
- **Estimated effort**: 45 minutes

---

#### T010 [P1] Test footer responsive behavior
- **Screen sizes to test**:
  - 320px (small mobile)
  - 375px (mobile)
  - 768px (tablet breakpoint)
  - 1024px (desktop)
  - 1920px (large desktop)
- **Verification**:
  - Content stacks vertically on mobile (< 768px)
  - Content displays horizontally on desktop (≥ 768px)
  - Text alignment: center on mobile, left/right on desktop
  - No horizontal scrolling
  - Links are touch-friendly on mobile
- **Acceptance**: Footer layout adapts correctly to all screen sizes
- **Estimated effort**: 30 minutes

---

#### T011 [P1] Test language switching via footer
- **Test scenarios**:
  - Start with Portuguese, switch to English via footer flag
  - Start with English, switch to Portuguese via footer flag
  - Verify footer text updates (creator, license, copyright)
  - Verify page content updates (if on translated page)
  - Verify flag active state updates
  - Navigate to another page and verify language persists
  - Refresh page and verify language persists
- **Acceptance**: Language switching works identically to previous header switcher
- **Estimated effort**: 30 minutes

---

#### T012 [P2] Test footer with season color changes
- **Test scenarios**:
  - Change selected season on PublicRankings
  - Verify footer background color updates to match navbar
  - Test with multiple seasons with different accent colors
  - Verify smooth color transition (no jarring flash)
- **Acceptance**: Footer color always matches navbar color
- **Estimated effort**: 20 minutes

---

#### T013 [P2] Test footer sticky positioning
- **Test scenarios**:
  - View login page (minimal content) - footer should be at bottom of viewport
  - View rankings with many tabs (lots of content) - footer should be after content
  - Resize browser window - footer should remain properly positioned
  - Test with browser zoom at 50%, 100%, 150%, 200%
- **Acceptance**: Footer stays at bottom appropriately based on content height
- **Estimated effort**: 20 minutes

---

#### T014 [P2] Cross-browser testing
- **Browsers to test**:
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)
- **Verification**:
  - Footer renders correctly
  - Colors applied properly
  - Links work
  - Responsive layout works
  - Unicode flags display (or fallback if needed)
- **Acceptance**: Footer works consistently across major browsers
- **Estimated effort**: 30 minutes

---

#### T015 [P3] Accessibility testing
- **Tests**:
  - Navigate footer with keyboard (Tab key)
  - Ensure all links are keyboard-accessible
  - Test with screen reader (VoiceOver/NVDA)
  - Verify ARIA labels are read correctly
  - Check color contrast (white on accent color) - should be at least 4.5:1
  - Ensure focus indicators are visible
- **Acceptance**: Footer is fully accessible to keyboard and screen reader users
- **Estimated effort**: 45 minutes

---

### Phase 4: Polish & Documentation

#### T016 [P3] Add hover states to footer links
- **File**: `frontend/src/components/Footer.js`
- **Description**: Ensure links have appropriate hover states
- **Changes**:
  - Links should use `text-white` with Bootstrap hover utilities
  - Consider adding `text-white-50` on hover for subtle effect
  - Or use `opacity-75` on hover
  - Test that hover states are visible but not distracting
- **Acceptance**: Footer links have clear hover states
- **Estimated effort**: 15 minutes

---

#### T017 [P3] Handle Unicode flag fallback (if needed)
- **File**: `frontend/src/components/Footer.js`
- **Description**: Add fallback if Unicode flags don't render
- **Changes**:
  - Test Unicode flags (🇧🇷 🇺🇸) on various platforms
  - If flags don't render well, fallback to:
    - Bootstrap Icons (if available)
    - Or text labels: "PT" / "EN"
  - Use feature detection or conditional rendering
- **Acceptance**: Language switcher works even if Unicode flags aren't supported
- **Estimated effort**: 30 minutes

---

#### T018 [P3] Update README or documentation
- **File**: `README.md` or documentation file
- **Description**: Document footer feature
- **Content to add**:
  - Footer includes creator attribution, license info, and GitHub link
  - Language switching moved to footer with flag icons
  - Footer adapts to season accent color
  - Footer is responsive and accessible
- **Acceptance**: Documentation reflects new footer feature
- **Estimated effort**: 20 minutes

---

## Summary

**Total Tasks**: 18
- **Priority 1 (P1)**: 12 tasks - Core functionality and essential testing
- **Priority 2 (P2)**: 4 tasks - Important testing and refinement
- **Priority 3 (P3)**: 2 tasks - Polish and documentation

**Total Estimated Effort**: ~11-12 hours

**Critical Path**:
1. T001 (Translations)
2. T002 (Footer component)
3. T003 (Layout integration)
4. T004 (Footer manager)
5. T005 (Initialize footer)
6. T006 (Language switcher in footer)
7. T007 (Remove from Navigation)
8. T009 (Test all pages)
9. T010 (Test responsive)
10. T011 (Test language switching)

**Dependencies**:
- T002 depends on T001
- T004 depends on T002
- T005 depends on T003, T004
- T006 depends on T002
- T007 depends on T006
- T009-T015 depend on T005, T006, T007

**Recommended Implementation Order**:
Phase 1 → Phase 2 → Phase 3 → Phase 4

This ensures core functionality is built first, language switcher is migrated safely, thorough testing validates everything works, and final polish improves UX.
