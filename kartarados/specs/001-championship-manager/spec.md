# Feature Specification: Kartarados Championship Manager

**Feature Branch**: `001-championship-manager`  
**Created**: 2026-01-26  
**Status**: Draft  
**Input**: User description: "Develop Kartarados, a vanilla JS website aimed to be super simple and fast. This app is a go-kart races and championship manager..."

## Clarifications

### Session 2026-01-26

- Q: How should penalties be structured in race results - single count or by type? → A: Track each penalty type separately with counts per type, plus allow custom penalty creation with name and point deduction amount
- Q: How should data be persisted in this vanilla JS app? → A: Backend API with database, using free-tier hosting services (e.g., Firebase, Supabase, Netlify, Vercel) to keep the app simple and lightweight for free hosting
- Q: What authentication method should be used for admins? → A: Email/password authentication. First admin has random default password documented in app readme. First admin can create other admins with email/password. All admins can change their own password
- Q: How is the "current active season" determined for public rankings? → A: If any seasons are marked as ongoing, use the one with the most recent start date; otherwise use the season with end date >= today (or most recent season if all have ended)
- Q: Can admins edit or delete entities (seasons, drivers, cups, races) after creation? → A: Yes, admins can edit and delete all entities with appropriate safeguards
- Q: What should the interface design and theming approach be? → A: Interface must be nice and modern looking, inspired by Formula 1 theme and color scheme. Each season has an accent color used on home page, table headers, navigation menus, buttons, and other themable parts
- Q: How should driver images behave when the profile picture URL is missing or broken? → A: Always show a placeholder image using a native HTML `onerror` fallback. Use a free image service with URL parameters to generate random 200px headshot-style placeholders (prefer helmet-like variants when available)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Setup and Championship Configuration (Priority: P1)

An admin needs to set up the championship structure before any races can be managed. This includes creating seasons, driver profiles, optional cups, and races. This foundational setup enables all other functionality.

**Why this priority**: Without the ability to create seasons, drivers, and races, the application cannot function. This is the foundation that all other features depend on.

**Independent Test**: Can be fully tested by creating a complete championship setup: one season with a name and date range, multiple driver profiles with all required fields, one optional cup, and at least one race assigned to the season. The system should persist all data and allow viewing the created entities.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they create a new season with name "2026 Championship", start date "2026-01-01", end date "2026-12-31", and accent color "#000000", **Then** the season is saved and appears in the seasons list
2. **Given** an admin is logged in, **When** they create a driver profile with name "John Doe", nickname "JD", email "john@example.com", birth date "1990-05-15", sex "Male", blood type "O+", and upload a picture, **Then** the driver profile is saved with all information and the email is validated as unique
3. **Given** a season exists, **When** an admin creates a cup within that season with name "Summer Cup", start date "2026-06-01", and end date "2026-08-31", **Then** the cup is saved and associated with the season
4. **Given** a season exists, **When** an admin creates a race with name "Race 1", location "São Paulo Circuit", datetime "2026-03-15 14:00", and toggles "affects championship" to true, **Then** the race is saved and associated with the season
5. **Given** a cup exists within a season, **When** an admin creates a race and assigns it to the cup, **Then** the race is saved and associated with the cup

---

### User Story 2 - Race Results Entry and Management (Priority: P2)

After a race occurs, an admin needs to enter results for all participating drivers. The admin views a filtered list of races, navigates to a specific race, and enters driver results including position, lap times, grid position, penalties, if the driver was disqualified from the race, and comments.

**Why this priority**: Once races are created, the ability to record results is essential for tracking championship progress. This enables the ranking calculations in the public view.

**Independent Test**: Can be fully tested by creating a race, navigating to the race detail page, and entering results for multiple drivers. The system should display all entered results in a table, allow editing, and persist all data correctly.

**Acceptance Scenarios**:

1. **Given** an admin is logged in and a season with races exists, **When** they view the races table and select a season filter, **Then** only races for that season are displayed
2. **Given** an admin is logged in, **When** they select both a season and a cup filter, **Then** only races matching both filters are displayed
3. **Given** an admin is viewing a race detail page, **When** they click "Add Driver Result" and select a driver from the dropdown, **Then** a modal dialog opens with fields for finish position, best lap time, grid start position, penalty entries (by type with counts), disqualification flag, and comments
4. **Given** an admin fills out the race results form with valid data, **When** they click "Save", **Then** the driver is added to the race results table with all entered information displayed
5. **Given** multiple driver results have been entered for a race, **When** an admin views the race detail page, **Then** all drivers are displayed in a table showing their results, sorted by finish position
6. **Given** an admin has entered results for a driver, **When** they need to correct an error, **Then** they can edit or delete the driver result entry

---

### User Story 3 - Public Driver Rankings Display (Priority: P3)

Public users (unauthenticated) can view driver rankings for the current season. The rankings are calculated using a complex points system based on race positions, pole positions, fastest laps, and penalties. Rankings are displayed in tabs for each cup and an overall championship tab that is the first one displayed by default.

**Why this priority**: The public-facing rankings are the primary value proposition for viewers. However, this depends on having race results entered (P2), so it comes after the core admin functionality.

**Independent Test**: Can be fully tested by having a season with races that have results entered, then viewing the public landing page. The system should display tabs for each cup and an overall championship tab, calculate points correctly according to the scoring system, and display drivers sorted by total points with tie-breaker rules applied.

**Acceptance Scenarios**:

1. **Given** a public user visits the landing page, **When** the current season has races with results, **Then** they see tabs for each cup in the season plus an "Overall Championship" tab
2. **Given** a public user selects a cup tab, **When** the cup has races with results, **Then** they see a ranked list of drivers with name, profile picture, best position, and total points, sorted from highest to lowest points
3. **Given** multiple drivers have the same total points, **When** the system calculates rankings, **Then** tie-breakers are applied in order: most 1st places, most 2nd places, most 3rd places, most pole positions, most fastest laps, fewest penalties, earliest to reach highest points
4. **Given** a race has a driver who started in pole position (grid position 1), **When** points are calculated, **Then** that driver receives +1 bonus point
5. **Given** a race has a driver with the fastest lap time, **When** points are calculated, **Then** that driver receives +1 bonus point
6. **Given** a driver has penalties recorded, **When** points are calculated, **Then** penalty points are deducted according to the penalty type (disqualification: -8, cone/tire warning: -2, race direction warning: -4, stop and go: -6, missing club shirt: -2)
7. **Given** a driver accumulates 20 or more penalty points from race direction, **When** viewing rankings, **Then** the system indicates automatic suspension for the next race (or 2 dropped races if it's the last race)

---

### Edge Cases

- What happens when a season has no races yet? The public rankings page should display an appropriate message indicating no data is available
- How does the system handle a race with no results entered? The race should appear in the admin's race list but show no driver results
- What happens when a driver is entered in multiple races with the same finish position? Each race result is independent and points are cumulative
- How does the system handle a race where no driver achieved pole position (grid position 1)? No bonus point is awarded for pole position
- What happens when multiple drivers have identical lap times for fastest lap? The system should award the bonus point to the driver who finished in the better position, or if tied, the first one entered
- How does the system handle a driver who is disqualified? They receive -8 penalty points and that race result cannot be used as a dropped race
- What happens when a season has cups but some races are not assigned to any cup? Those races appear only in the "Overall Championship" tab
- How does the system handle date ranges where a cup's dates overlap with the season dates? The system validates that cup dates fall within the season date range
- What happens when an admin tries to create a driver with an email that already exists? The system rejects the creation and displays an error message
- How does the system handle a race that affects championship results vs one that doesn't? Only races with "affects championship" enabled are included in points calculations for the overall championship tabs

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow admin users to authenticate using email and password
- **FR-001a**: System MUST have a first admin account with a randomly generated default password that is documented in the application README
- **FR-001b**: System MUST allow the first admin (or any admin with appropriate permissions) to create additional admin accounts by providing an email address and password
- **FR-001c**: System MUST allow all admin users to change their own password
- **FR-002**: System MUST allow authenticated admins to create championship seasons with name, start date, end date, and accent color
- **FR-002a**: System MUST allow authenticated admins to edit existing seasons (name, start date, end date, accent color)
- **FR-002b**: System MUST allow authenticated admins to delete seasons, with appropriate safeguards (e.g., confirmation prompt, handling of associated races and cups)
- **FR-002c**: System MUST preload the last-known active season accent color before first paint and refresh the cached accent only when the active season changes
- **FR-003**: System MUST allow authenticated admins to create driver profiles with picture, name, nickname, birth date, sex, blood type, and unique email address
- **FR-003a**: System MUST allow authenticated admins to edit existing driver profiles (all fields except email, which must remain unique)
- **FR-003b**: System MUST allow authenticated admins to delete driver profiles, with appropriate safeguards (e.g., confirmation prompt, handling of associated race results)
- **FR-004**: System MUST validate that driver email addresses are unique across all drivers
- **FR-005**: System MUST allow authenticated admins to optionally create cups within a season, with name, start date, and end date
- **FR-005a**: System MUST allow authenticated admins to edit existing cups (name, start date, end date)
- **FR-005b**: System MUST allow authenticated admins to delete cups, with appropriate safeguards (e.g., confirmation prompt, handling of associated races)
- **FR-006**: System MUST validate that cup date ranges fall within the parent season's date range
- **FR-007**: System MUST allow authenticated admins to create races with name, location name, date and time, and a toggle to indicate if the race affects overall championship results
- **FR-007a**: System MUST allow authenticated admins to edit existing races (name, location, date/time, championship impact toggle, season/cup assignment)
- **FR-007b**: System MUST allow authenticated admins to delete races, with appropriate safeguards (e.g., confirmation prompt, handling of associated race results)
- **FR-008**: System MUST allow authenticated admins to assign races to either a season or a cup
- **FR-009**: System MUST display a table of all races for a season to authenticated admins
- **FR-010**: System MUST provide filter controls allowing admins to filter races by season and/or cup
- **FR-011**: System MUST allow authenticated admins to navigate to a race detail page by clicking on a race in the table
- **FR-012**: System MUST display race details (name, location, date/time, championship impact status) on the race detail page
- **FR-013**: System MUST allow authenticated admins to add driver results to a race by selecting a driver and opening a results entry form
- **FR-014**: System MUST collect the following data for each driver race result: finish position, best lap time, grid start position (after qualifying), penalty entries (tracking each penalty type separately with counts), disqualification flag, and comments
- **FR-014a**: System MUST allow admins to select from standard penalty types (disqualification, cone/tire warning, race direction warning, stop and go, missing club shirt) and specify count for each type
- **FR-014b**: System MUST allow admins to create custom penalty entries with a name and point deduction amount when entering race results
- **FR-015**: System MUST save driver race results and display them in a table on the race detail page
- **FR-016**: System MUST allow authenticated admins to edit or delete existing driver race results
- **FR-017**: System MUST calculate driver points based on finish position using the standard points table (1st: 35, 2nd: 30, 3rd: 26, 4th: 23, 5th: 21, 6th: 19, 7th: 18, 8th: 17, 9th: 16, 10th: 15, 11th: 14, 12th: 13, 13th: 12, 14th: 11, 15th: 10, 16th: 9, 17th: 8, 18th: 7, 19th: 6, 20th: 5, 21st: 4, 22nd: 3, 23rd: 2, 24th: 1)
- **FR-018**: System MUST award +1 bonus point to the driver who started in pole position (grid position 1) for each race
- **FR-019**: System MUST award +1 bonus point to the driver with the fastest lap time for each race
- **FR-020**: System MUST apply penalty point deductions according to penalty type: disqualification (-8), cone/tire warning (-2), race direction warning (-4), stop and go (-6), missing club shirt (-2), plus any custom penalties with their specified point deduction amounts
- **FR-020a**: System MUST calculate total penalty points by summing (penalty type point value × count) for each penalty type, including custom penalties
- **FR-021**: System MUST handle disqualifications by preventing that race result from being used as a dropped race
- **FR-022**: System MUST automatically suspend drivers who accumulate 20 or more penalty points from race direction, suspending them from the next race (or applying 2 dropped races if it's the last race)
- **FR-023**: System MUST apply tie-breaker rules in this order when drivers have equal total points: most 1st place finishes, most 2nd place finishes, most 3rd place finishes, continuing through all positions, then most pole positions, then most fastest laps, then fewest penalties, then earliest to reach highest points
- **FR-024**: System MUST display public driver rankings on an unauthenticated landing page
- **FR-025**: System MUST display tabs on the public rankings page: one tab for each cup in the current season, plus one "Overall Championship" tab
- **FR-026**: System MUST calculate and display rankings separately for each cup tab using only races assigned to that cup
- **FR-027**: System MUST calculate and display rankings for the "Overall Championship" tab using all races that have "affects championship" enabled, regardless of cup assignment
- **FR-028**: System MUST display for each driver in rankings: name, profile picture, best position achieved, and total points
- **FR-029**: System MUST sort drivers in rankings from highest total points to lowest, applying tie-breaker rules
- **FR-030**: System MUST automatically determine and load the current active season for public rankings display
- **FR-030a**: System MUST identify the current active season as the season marked as ongoing; if multiple are marked ongoing, use the one with the most recent start date
- **FR-030b**: If no seasons are marked ongoing, system MUST identify the current active season as the season with end date >= today's date, or if all seasons have ended, the season with the most recent end date
- **FR-031**: System MUST be built as a vanilla JavaScript website optimized for simplicity and speed
- **FR-031a**: System MUST display a placeholder image for drivers whenever the profile picture URL is missing or fails to load, using a native HTML image fallback mechanism (e.g., `<img onerror>` swap to a placeholder URL)
- **FR-031b**: Placeholder images MUST be generated via a free service with URL parameters (seed + size) to produce 200px headshot-style images, preferring helmet-like variants when available (e.g., DiceBear `avataaars` style with `size=200` and seeded variations)
- **FR-034**: System MUST use a backend API with database for data persistence, leveraging free-tier hosting services to enable free hosting while maintaining simplicity
- **FR-034a**: System MUST store driver profile images in Supabase Storage with public read access and Storage CORS entries that allow image retrieval from the app's origins (GET/HEAD for `driver-pictures` bucket)
- **FR-032**: System MUST be mobile-friendly and responsive across all screen sizes (320px to 4K displays)
- **FR-033**: System MUST meet performance targets: First Contentful Paint under 1.8 seconds, Largest Contentful Paint under 2.5 seconds
- **FR-035**: System MUST have a modern, visually appealing interface inspired by Formula 1 theme and color scheme
- **FR-036**: System MUST apply the current season's accent color to themable UI elements including: home page, table headers, navigation menus, buttons, and other interactive components
- **FR-037**: System MUST allow admins to specify an accent color when creating or editing a season
- **FR-038**: System MUST allow admins to mark a season as ongoing when creating or editing a season

### Key Entities *(include if feature involves data)*

- **Admin**: Represents an authenticated user who can manage championships, drivers, races, and results. Has email address and password. The first admin account is created with a default random password documented in the README. Admins can create other admin accounts and change their own passwords.
- **Season**: Represents a championship season, typically one per year. Has name, start date, end date, accent color (used for theming UI elements), and a boolean flag indicating if it is marked as ongoing. Contains multiple races and optionally multiple cups.
- **Driver**: Represents a racing driver. Has picture, name, nickname, birth date, sex, blood type, and unique email. Participates in races and accumulates points.
- **Cup**: Represents an optional event within a season that may or may not impact overall championship rankings. Has name, start date, end date. Belongs to one season. Contains multiple races.
- **Race**: Represents a single race event. Has name, location name, date and time, and a boolean flag indicating if it affects overall championship results. Belongs to either a season directly or to a cup within a season. Contains multiple race results.
- **Race Result**: Represents a driver's performance in a specific race. Has finish position, best lap time, grid start position, penalty entries (each with type and count, including custom penalties with name and point deduction), disqualification flag, and comments. Belongs to one race and one driver. Used to calculate points and rankings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can complete the initial championship setup (create season, 10 drivers, 1 cup, 5 races) in under 10 minutes
- **SC-002**: Admins can enter race results for 20 drivers in under 5 minutes
- **SC-003**: Public users can view driver rankings with all calculations completed in under 2 seconds from page load
- **SC-004**: The application loads and becomes interactive on mobile devices (3G network simulation) within 5 seconds
- **SC-005**: Points calculations are accurate for 100% of race results when validated against manual calculations
- **SC-006**: The system correctly applies tie-breaker rules for drivers with equal points in 100% of test cases
- **SC-007**: The application displays correctly and is fully functional on screen sizes from 320px to 2560px width
- **SC-011**: The interface presents a modern, Formula 1-inspired design that is visually appealing and professional
- **SC-012**: Season accent colors are consistently applied across all themable UI elements (table headers, navigation, buttons) when viewing that season's data
- **SC-008**: All data entered by admins persists correctly in the backend database and is retrievable after page refresh, browser restart, or from different devices
- **SC-009**: Public rankings update automatically when new race results are entered (within 1 second of data change)
- **SC-010**: The application maintains performance (FCP < 1.8s, LCP < 2.5s) even when displaying rankings for seasons with 50+ drivers and 20+ races
