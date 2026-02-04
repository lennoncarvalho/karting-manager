# Feature Specification: Public Rankings Calendar Tab

**Feature Branch**: `006-public-rankings-calendar`  
**Created**: 2026-02-04  
**Status**: Draft  
**Input**: User description: "Lets create a new spec, plan, and tasks to make changes on the publicRanking page. Consider existing functionality such as: i18n, cache, user selected season, mobile view. The page has four tabs, and the first task is to reorder these in order to make the Penalties tab the last one. Create a new tab called Calendar. This tab will fetch all races for the selected season(regardless if the races affects the ranking) and display them in a table with race date, name, location, and having it sorted by dates in ascending order. If the race has happened and has race_results, a column named Winner will display the driver name, and there is also the \"Fastest lap\" column with the relevant information from race_results."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Penalties tab last (Priority: P1)

As a viewer of public rankings, I want the Penalties tab to always appear last so I can scan the main standings before penalty details.

**Why this priority**: Tab order is a first-impression navigation decision and should match expectations.

**Independent Test**: Load Public Rankings with multiple tabs and verify Penalties is the last tab.

**Acceptance Scenarios**:

1. **Given** the Public Rankings tabs are rendered, **When** I inspect the tab order, **Then** Penalties is the last tab.
2. **Given** cup tabs exist, **When** the tabs are rendered, **Then** their relative ordering is unchanged and Penalties still appears last.

---

### User Story 2 - Calendar tab for season races (Priority: P1)

As a viewer, I want a Calendar tab that lists all races in the selected season so I can understand the season schedule and past outcomes.

**Why this priority**: The calendar provides essential context across both ranking and non-ranking races.

**Independent Test**: Select a season and verify the Calendar tab is the default active tab showing all races in date order with winners and fastest laps when results exist.

**Acceptance Scenarios**:

1. **Given** a season with races, **When** the Public Rankings page loads, **Then** the Calendar tab is active by default and shows all races for that season sorted by race date ascending.
2. **Given** a race has completed and has race results, **When** I view the Calendar row, **Then** Winner and Fastest lap columns show driver picture and name derived from race results.
3. **Given** a race has no results or is in the future, **When** I view the Calendar row, **Then** Winner and Fastest lap show placeholders.

---

### User Story 3 - Localized, mobile-friendly calendar (Priority: P2)

As a mobile viewer, I want the Calendar tab labels and table to be localized and readable on small screens.

**Why this priority**: Public Rankings is a consumer-facing page and must remain consistent with existing i18n and mobile responsiveness.

**Independent Test**: Switch locale and view the Calendar tab on a narrow viewport; labels translate and the table scrolls horizontally as needed.

**Acceptance Scenarios**:

1. **Given** i18n is enabled, **When** I switch locale, **Then** the Calendar tab label and table headers are translated.
2. **Given** a mobile viewport, **When** I view the Calendar table, **Then** the layout remains readable using the existing responsive table pattern.

---

### Edge Cases

- What happens when a season has no races?
- How are races with missing `race_datetime` sorted and displayed?
- What happens when race results exist but no `best_lap_time` is recorded?
- How are ties handled for fastest lap times in the Calendar view?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Public Rankings MUST render the Penalties tab as the last tab.
- **FR-002**: Public Rankings MUST add a Calendar tab that lists all races for the selected season, including races where `affects_championship` is false.
- **FR-002a**: Calendar MUST be the first tab and the default active tab on load.
- **FR-003**: Calendar entries MUST be sorted by race date ascending; races without dates MUST appear last.
- **FR-004**: Calendar rows MUST show race date, race name, and location.
- **FR-005**: If a race has completed and has race results, Calendar rows MUST show Winner and Fastest lap as driver picture + name; otherwise show placeholders.
- **FR-006**: Calendar tab label and table headers MUST use i18n keys in the existing translation files.
- **FR-007**: Calendar rendering MUST use the existing selected-season flow and storage (season selector + stored season id).
- **FR-008**: Calendar table MUST follow the existing responsive table pattern for mobile.

### Key Entities *(include if feature involves data)*

- **Race**: Season race with `race_datetime`, `name`, `location`, and `affects_championship`.
- **RaceResult**: Contains `finish_position`, `best_lap_time`, and driver association used for Winner/Fastest lap.
- **Driver**: Provides display name for Winner/Fastest lap.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Penalties tab is the last tab in Public Rankings for all seasons.
- **SC-002**: Calendar tab lists all season races in ascending date order and includes non-ranking races.
- **SC-003**: Winner and Fastest lap fields appear for completed races with results and are blank/placeholder otherwise.
- **SC-004**: Calendar labels are localized and the table remains usable on mobile sizes.
