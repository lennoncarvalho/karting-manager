# Feature Specification: Season Selector Persistence

**Feature Branch**: `003-season-selector`  
**Created**: 2026-01-29  
**Status**: Done  
**Input**: User description: "The app has some logic to load a default season on page load and use that for displaying the ranking, it also writes it to the localstorage to speed up initialization and page transitions. The new feature is about changing the season indicator element #season-name that is on PublicRankings into a select element. And everytime the user changes the season, the user selection is saved to local storage, and the rank is updated with the selected season information including the effective accent color. There are some season select elements on other pages, I also need all of these to load with the selected season already selected as the default value."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch season from rankings page (Priority: P1)

As a user viewing public rankings, I want to select a season from a dropdown so I can see rankings for the season I care about.

**Why this priority**: Public rankings is a primary entry point; season selection must be fast and obvious.

**Independent Test**: Can be tested by changing the season selector on PublicRankings and verifying the rankings and accent color update.

**Acceptance Scenarios**:

1. **Given** multiple seasons exist, **When** I select a different season in the PublicRankings dropdown, **Then** the rankings are recalculated for that season and the accent color updates.
2. **Given** I refresh or navigate away and back, **When** the page loads, **Then** the season dropdown defaults to the previously selected season.
3. **Given** a stored season ID no longer exists, **When** PublicRankings loads, **Then** the app falls back to the existing default-season logic and updates the selector accordingly.
4. **Given** some seasons are marked unavailable, **When** the PublicRankings dropdown renders, **Then** only available seasons appear as options.

---

### User Story 2 - Persist selected season across pages (Priority: P2)

As a user navigating other pages with season selectors, I want the previously selected season to be preselected so I do not need to reselect it.

**Why this priority**: Avoids repetitive selection and keeps the UI consistent across page transitions.

**Independent Test**: Can be tested by selecting a season in PublicRankings and verifying other season selectors default to that value on load.

**Acceptance Scenarios**:

1. **Given** I selected a season in PublicRankings, **When** I open a page with a season selector, **Then** that selector defaults to the stored season.
2. **Given** no season has been selected yet, **When** a page with a season selector loads, **Then** it uses the existing default season logic.

---

### Edge Cases

- What happens when the stored season ID no longer exists?
- How should the selector behave when there is only one season?
- Should the selector be disabled while rankings are loading?
- What happens when stored season data conflicts with the existing default-season logic?
- What happens when no seasons are marked available?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: PublicRankings MUST render `#season-name` as a season `<select>` control instead of static text.
- **FR-002**: Changing the season selection MUST update rankings and apply the selected season accent color.
- **FR-003**: The selected season ID MUST be stored in local storage whenever the user changes it.
- **FR-004**: When loading a page with a season selector, the default selection MUST be the stored season if it exists.
- **FR-005**: When no stored season exists (or it is invalid), the app MUST fall back to the current default-season logic.
- **FR-006**: Rankings tabs MUST only use races belonging to the selected season.
- **FR-007**: PublicRankings MUST only list seasons marked as available.
- **FR-008**: The season admin toggle MUST be labeled as availability, without changing the stored field name.

### Key Entities *(include if feature involves data)*

- **Season**: The selected season, including ID, name, dates, and accent color.
- **LocalStorage Key**: Persisted value used to restore the selected season.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Season selection persists across page refreshes and navigation.
- **SC-002**: Rankings and accent colors update within one interaction after selecting a new season.
- **SC-003**: All season selectors default to the stored season when available.
