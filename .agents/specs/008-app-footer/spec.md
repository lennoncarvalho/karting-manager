# Feature Specification: Application Footer

**Feature Branch**: `008-app-footer`
**Created**: 2026-03-09
**Status**: Planning
**Input**: User description: "Add a footer to the app that appears below every page content. Use Bootstrap CSS utilities (avoid custom CSS). Footer should have the same color as the header (changes with season). Right side: GitHub icon link to repository. Left side: creator info with LinkedIn link, MIT license mention, and copyright notice with current year. Footer should be smart about placement - adjust to page content height and always at bottom of viewport if not much content. Move language switcher from header to footer using country flags instead of select element."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View footer information on all pages (Priority: P1)

As a user browsing the application, I want to see consistent footer information on every page so I can easily access creator info, license details, and repository link.

**Why this priority**: Footer provides essential attribution, legal information, and external links that should be accessible from any page.

**Independent Test**: Can be tested by navigating to different pages (login, public rankings, admin pages) and verifying footer appears with correct content.

**Acceptance Scenarios**:

1. **Given** I am on any page of the application, **When** the page loads, **Then** the footer is visible at the bottom with creator info, license, copyright, GitHub link, and language switcher.
2. **Given** I am viewing the footer, **When** I click the LinkedIn link, **Then** it opens the creator's LinkedIn profile (https://www.linkedin.com/in/lennoncarvalho/) in a new tab.
3. **Given** I am viewing the footer, **When** I click the GitHub icon, **Then** it opens the repository (https://github.com/lennoncarvalho/karting-manager) in a new tab.
4. **Given** I am viewing the footer, **When** I click the MIT license text, **Then** it opens the LICENSE file in the GitHub repository in a new tab.
5. **Given** the current year changes, **When** the footer renders, **Then** the copyright notice displays the current year dynamically.

---

### User Story 2 - Footer adapts to season color (Priority: P1)

As a user who selected a specific season, I want the footer background color to match the header color so the UI feels cohesive and consistent.

**Why this priority**: Visual consistency is key to professional UI; season theming should apply throughout the app.

**Independent Test**: Can be tested by changing the selected season and verifying the footer background color updates to match the header.

**Acceptance Scenarios**:

1. **Given** a season with a specific accent color is active, **When** any page loads, **Then** the footer background color matches the navbar background color.
2. **Given** I change the selected season, **When** the page updates, **Then** the footer background color changes to match the new season's accent color.

---

### User Story 3 - Footer placement adapts to content height (Priority: P2)

As a user viewing pages with varying content heights, I want the footer to always appear at the bottom without awkward spacing so the layout feels natural.

**Why this priority**: Prevents footer from floating mid-page on short content or overlapping on long content.

**Independent Test**: Can be tested by viewing pages with minimal content (login) and pages with lots of content (rankings with many tabs) and verifying footer placement.

**Acceptance Scenarios**:

1. **Given** a page has minimal content (e.g., login page), **When** the page loads, **Then** the footer stays at the bottom of the viewport.
2. **Given** a page has lots of content requiring scrolling, **When** I scroll to the bottom, **Then** the footer appears after all content.
3. **Given** I resize the browser window, **When** the layout adjusts, **Then** the footer remains properly positioned at the bottom.

---

### User Story 4 - Switch language using country flags (Priority: P2)

As a user, I want to change the application language by clicking country flags in the footer so I have an intuitive, visual way to switch languages without using the header.

**Why this priority**: Improves UX by providing visual language selection and frees up header space.

**Independent Test**: Can be tested by clicking flag icons in footer and verifying language changes and flag icons update accordingly.

**Acceptance Scenarios**:

1. **Given** the application is in Portuguese, **When** I click the US/UK flag icon in the footer, **Then** the application switches to English.
2. **Given** the application is in English, **When** I click the Brazil flag icon in the footer, **Then** the application switches to Portuguese.
3. **Given** I change the language, **When** the page re-renders, **Then** the footer text updates to the new language.
4. **Given** I navigate to a different page after changing language, **When** the page loads, **Then** the footer shows the correct language selection.

---

### User Story 5 - Mobile-responsive footer layout (Priority: P2)

As a mobile user, I want the footer content to stack vertically so it remains readable and accessible on small screens.

**Why this priority**: Ensures usability on mobile devices where horizontal space is limited.

**Independent Test**: Can be tested by resizing browser to mobile width or viewing on actual mobile device.

**Acceptance Scenarios**:

1. **Given** I am viewing on a mobile device, **When** the footer renders, **Then** the left-side content (creator info) appears above the right-side content (GitHub link and flags).
2. **Given** I am on mobile, **When** I tap any footer link, **Then** the link works correctly without layout issues.
3. **Given** I switch from mobile to desktop view, **When** the layout adjusts, **Then** the footer returns to horizontal layout with left/right alignment.

---

### Edge Cases

- What happens when JavaScript fails to calculate current year?
- How should the footer behave during initial page load before theme is applied?
- What if the GitHub icon fails to load?
- Should footer links have hover states that respect the season accent color?
- What happens if localStorage is unavailable for language preference?
- How should RTL languages be handled if added in the future?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Footer MUST appear on every page of the application (public and authenticated).
- **FR-002**: Footer background color MUST use the `--season-accent` CSS variable to match the navbar.
- **FR-003**: Footer MUST display creator text "Created by Lennon Carvalho" with a link to https://www.linkedin.com/in/lennoncarvalho/.
- **FR-004**: Footer MUST display "MIT License" text with a link to the LICENSE file on GitHub (https://github.com/lennoncarvalho/karting-manager/blob/main/LICENSE).
- **FR-005**: Footer MUST display copyright notice "© {current_year} Lennon Carvalho" where {current_year} is calculated dynamically.
- **FR-006**: Footer MUST display a GitHub icon (Bootstrap icon `bi-github`) linking to https://github.com/lennoncarvalho/karting-manager.
- **FR-007**: Footer MUST include language switcher with country flag icons (Brazil flag for Portuguese, US/UK flag for English).
- **FR-008**: Language switcher MUST be removed from the Navigation component.
- **FR-009**: Footer MUST use Bootstrap CSS utility classes exclusively (no custom CSS unless absolutely necessary).
- **FR-010**: Footer MUST stick to the bottom of viewport when content height is less than viewport height.
- **FR-011**: Footer MUST appear after content when content height exceeds viewport height.
- **FR-012**: On mobile viewports (< 768px), footer content MUST stack vertically (left content above right content).
- **FR-013**: All footer external links MUST open in a new tab (`target="_blank"` with `rel="noopener noreferrer"`).
- **FR-014**: Footer MUST update its language-specific text when the user changes language.

### Non-Functional Requirements

- **NFR-001**: Footer MUST render without causing layout shift or flash of unstyled content.
- **NFR-002**: Footer color transitions MUST be smooth when season changes (inherit from existing theme transitions).
- **NFR-003**: Footer MUST be accessible with proper ARIA labels and semantic HTML.
- **NFR-004**: Footer MUST maintain consistent styling across all browsers (Chrome, Firefox, Safari, Edge).

### Key Entities *(include if feature involves data)*

- **Footer Component**: New JavaScript module that renders the footer HTML.
- **Language Flags**: Visual indicators for language selection (Unicode flags or Bootstrap Icons).
- **Season Accent**: CSS variable `--season-accent` that controls footer background color.
- **Current Year**: Dynamically calculated year for copyright notice.

## Technical Constraints

- MUST use Bootstrap 5 utility classes for layout and styling.
- MUST use existing `--season-accent` CSS variable for theming.
- MUST integrate with existing i18n service for translations.
- MUST work with existing layout structure (navHost and mainHost containers).
- MUST not break existing navigation functionality.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Footer appears on 100% of application pages (login, public rankings, all admin pages).
- **SC-002**: Footer background color matches navbar background color at all times.
- **SC-003**: Footer remains at bottom of viewport on short pages and after content on long pages.
- **SC-004**: Language switching via footer flags works identically to previous header select element.
- **SC-005**: All footer links are functional and open in new tabs with correct security attributes.
- **SC-006**: Footer layout stacks vertically on mobile viewports (< 768px) and horizontally on desktop.
- **SC-007**: Footer text updates correctly when language is changed.
- **SC-008**: Copyright year updates automatically each calendar year without code changes.

## Design Notes

### Layout Structure
```
[Left Side]                                [Right Side]
Created by Lennon Carvalho                 [GitHub Icon]
MIT License | © 2026 Lennon Carvalho      [BR Flag] [US Flag]
```

### Mobile Layout
```
[Center-aligned, stacked]
Created by Lennon Carvalho
MIT License | © 2026 Lennon Carvalho
[GitHub Icon] [BR Flag] [US Flag]
```

### Color Application
- Footer background: `var(--season-accent)`
- Footer text: White (`#fff` or Bootstrap `text-white`)
- Link hover: Lighter shade of season accent (use Bootstrap hover utilities)

## Out of Scope

- Additional social media links beyond GitHub and LinkedIn
- Footer customization by users
- Multiple language flags beyond Portuguese and English
- Footer collapse/expand functionality
- Dark mode toggle in footer
- Back-to-top button
- Site statistics or visitor counter

## Dependencies

- Bootstrap 5 (already integrated)
- Existing i18n service (`src/services/i18n.js`)
- Existing theme service (`src/services/theme.js`)
- Bootstrap Icons (already integrated)

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Footer overlaps content on some pages | High | Medium | Use flexbox with `min-height: 100vh` on app container |
| Language flags don't render on some devices | Medium | Low | Fallback to text labels if Unicode flags fail |
| Footer color transition is jarring | Low | Medium | Inherit CSS transitions from existing theme |
| Mobile layout breaks on very small screens | Medium | Low | Test on 320px width and adjust spacing |

## Future Enhancements

- Add social media icons if additional profiles are created
- Include app version number in footer
- Add "last updated" timestamp for transparency
- Support additional languages with more flag options
- Add subtle animations on link hover
