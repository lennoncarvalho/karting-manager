# Tasks: Kartarados Championship Manager

**Input**: Design documents from `/specs/001-championship-manager/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in specification, so no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Reference Documents

When implementing tasks, refer to these detail files for specific information:

- **`spec.md`**: User stories, acceptance scenarios, functional requirements (FR-XXX), success criteria
- **`plan.md`**: Technical context, project structure, technology stack, performance goals
- **`data-model.md`**: Entity structures, fields, relationships, validation rules, database constraints
- **`contracts/api-contracts.md`**: API endpoint specifications, request/response formats, authentication
- **`research.md`**: Technical decisions, implementation approaches, CDN URLs, design patterns
- **`quickstart.md`**: Database setup SQL, RLS policies, Supabase configuration, first admin setup

**Key Sections to Reference**:
- Entity fields: See `data-model.md` → [Entity Name] section
- API endpoints: See `contracts/api-contracts.md` → [Entity] Endpoints section
- Validation rules: See `data-model.md` → [Entity Name] → Validation Rules
- Functional requirements: See `spec.md` → Requirements → Functional Requirements (FR-XXX)
- Bootstrap setup: See `research.md` → Formula 1 Design Theme → CDN Libraries
- Database schema: See `quickstart.md` → Database Setup (SQL)
- Points calculation: See `spec.md` → FR-017 through FR-023

## Implementation Workflow

### Step-by-Step Sequence

1. **Phase 1 (Setup)**: Create project structure and configuration files
   - Start with T001-T002 (directory structure)
   - Then T003-T008 can run in parallel (HTML, config, CSS files)
   - Complete T009 (README)

2. **Phase 2 (Foundational)**: Set up database and core services
   - **CRITICAL**: Complete T010-T011 first (database schema and RLS)
   - Then T012 (first admin - manual step in Supabase dashboard)
   - T013-T020 can run in parallel (API client, auth, utils, components)
   - **BLOCKER**: All user stories depend on Phase 2 completion

3. **Phase 3 (User Story 1)**: Admin setup and championship configuration
   - **IMPORTANT**: Create API service methods FIRST (T047-T050) - pages depend on these
   - Then create page components (T021, T023-T024, T029, T036, T042 can run in parallel)
   - Implement CRUD operations for each entity in order: seasons → drivers → cups → races (due to foreign key relationships)
   - Complete with theme service (T051-T052)
   - **Reference**: For each entity, check `data-model.md` for fields, `contracts/api-contracts.md` for API calls, `spec.md` for requirements

4. **Phase 4 (User Story 2)**: Race results entry
   - Depends on US1 (needs races, drivers, seasons to exist)
   - **IMPORTANT**: Create API methods FIRST (T069-T071) - race detail page depends on these
   - Then create race detail page (T053)
   - Implement race result modal and form (T057-T065)
   - **Reference**: See `data-model.md` → "RaceResult" and "Penalty" entities, `contracts/api-contracts.md` → "Race Result Endpoints"

5. **Phase 5 (User Story 3)**: Public rankings
   - Depends on US1 and US2 (needs races with results)
   - **CRITICAL**: Create points calculation service FIRST (T074-T081) - rankings page depends on this
   - Then implement rankings page (T072, T082-T089)
   - **Reference**: See `spec.md` → FR-017 through FR-023 for complete points calculation rules, `spec.md` → FR-030, FR-030a for active season detection

6. **Phase 6 (Polish)**: Cross-cutting improvements
   - All tasks can run in parallel
   - Focus on responsive design, error handling, performance

### Quick Reference by Task Type

**Database Setup**: T010, T011 → See `quickstart.md` → "Database Setup" and "Row Level Security (RLS) Setup"

**API Implementation**: T047-T050, T069-T070 → See `contracts/api-contracts.md` for endpoint specifications

**Entity Forms**: T025, T030, T037, T043 → See `data-model.md` → [Entity Name] for field structures and validation rules

**Points Calculation**: T074-T081 → See `spec.md` → FR-017 through FR-023 for complete calculation rules

**Theme/Design**: T006-T007, T051-T052 → See `research.md` → "Formula 1 Design Theme" and `spec.md` → FR-035, FR-036, FR-037

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/`, `backend/` at repository root
- All paths follow plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure (frontend/, backend/, specs/)
- [x] T002 Create frontend directory structure (frontend/src/{components,pages,services,utils,styles,assets})
- [x] T003 [P] Create frontend/index.html with Bootstrap CDN links and basic structure - **Reference**: `research.md` → "Formula 1 Design Theme" → "CDN Libraries" for Bootstrap CSS and Icons URLs. See `quickstart.md` → "Initialize Frontend" for HTML structure example.
- [x] T004 [P] Create frontend/src/config.js with Supabase configuration - **Reference**: `quickstart.md` → "Frontend Setup" for config structure. Export SUPABASE_URL and SUPABASE_ANON_KEY constants. **Note**: App runs locally but connects to remote Supabase project. Get credentials from Supabase Dashboard → Settings → API.
- [x] T005 [P] Create frontend/src/styles/main.css with base styles - **Reference**: `research.md` → "Formula 1 Design Theme" → "Design Elements" for F1 color palette and typography.
- [x] T006 [P] Create frontend/src/styles/bootstrap-overrides.css with F1 theme overrides - **Reference**: `research.md` → "Formula 1 Design Theme" → "Implementation Approach" for Bootstrap variable overrides. See `quickstart.md` → "Create Custom CSS Files" for example.
- [x] T007 [P] Create frontend/src/styles/theme.css with season accent color variables - **Reference**: `research.md` → "Formula 1 Design Theme" → "Implementation Approach" for CSS custom properties. See `spec.md` → FR-036, FR-037 for season accent color requirements.
- [x] T008 [P] Create frontend/src/styles/custom.css for custom components - **Reference**: `research.md` → "Formula 1 Design Theme" → "Design Elements" for F1-specific styling patterns.
- [x] T009 Create README.md with first admin password documentation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Setup Supabase project and database schema - **Reference**: `quickstart.md` → "Database Setup" section. Run all SQL CREATE TABLE statements for admins, seasons, cups, drivers, races, race_results, penalties tables. See `data-model.md` for entity structures. **MANUAL STEP**: Must be done in Supabase dashboard.
- [x] T011 Setup Supabase Row Level Security (RLS) policies - **Reference**: `quickstart.md` → "Row Level Security (RLS) Setup" section. Enable RLS on all tables and create public read/admin write policies. See `data-model.md` → "Row Level Security (RLS) Policies" for policy details. **MANUAL STEP**: Must be done in Supabase dashboard.
- [x] T012 Create first admin account in Supabase Auth and document password in README.md - **MANUAL STEP**: Create user in Supabase Auth dashboard, then insert into admins table. Document password in README.md.
- [x] T013 [P] Create frontend/src/services/api.js - Supabase client initialization - **Reference**: `research.md` → "Backend Service Selection" → Supabase JS CDN URL. Use `config.js` for SUPABASE_URL and SUPABASE_ANON_KEY. See `contracts/api-contracts.md` for base URL format.
- [x] T014 [P] Create frontend/src/services/auth.js - Authentication service (login, logout, session management) - **Reference**: `contracts/api-contracts.md` → "Authentication Endpoints" section. Implement login (POST /auth/v1/token), session management. See `research.md` → "Authentication Implementation" for approach.
- [x] T015 [P] Create frontend/src/utils/validation.js - Form validation utilities
- [x] T016 [P] Create frontend/src/utils/formatting.js - Date/time formatting utilities
- [x] T017 [P] Create frontend/src/utils/helpers.js - General helper functions
- [x] T018 Create frontend/src/main.js - Application entry point and routing
- [x] T019 [P] Create frontend/src/components/Navigation.js - Bootstrap navbar component
- [x] T020 [P] Create frontend/src/components/Modal.js - Bootstrap modal wrapper component

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Setup and Championship Configuration (Priority: P1) 🎯 MVP

**Goal**: Enable admins to create seasons, driver profiles, cups, and races. This foundational setup enables all other functionality.

**Independent Test**: Create a complete championship setup: one season with name and date range, multiple driver profiles with all required fields, one optional cup, and at least one race assigned to the season. System should persist all data and allow viewing the created entities.

### Implementation for User Story 1

- [x] T021 [P] [US1] Create frontend/src/pages/LoginPage.js - Admin login page with Bootstrap form
- [x] T022 [US1] Implement login functionality in frontend/src/pages/LoginPage.js (integrate with auth.js)
- [x] T023 [P] [US1] Create frontend/src/pages/AdminDashboard.js - Main admin dashboard with navigation
- [x] T024 [P] [US1] Create frontend/src/pages/SeasonManagement.js - Season CRUD interface
- [x] T025 [US1] Implement season creation form in frontend/src/pages/SeasonManagement.js (name, dates, accent color) - **Reference**: `data-model.md` → "Season" entity for fields (name, start_date, end_date, accent_color). See `spec.md` → FR-002. Use Bootstrap form components. Validate end_date >= start_date per `data-model.md` → "Validation Rules".
- [x] T026 [US1] Implement season list display in frontend/src/pages/SeasonManagement.js with Bootstrap table - **Reference**: `contracts/api-contracts.md` → "Season Endpoints" → GET /seasons for API call. Display all Season fields from `data-model.md`.
- [x] T027 [US1] Implement season edit functionality in frontend/src/pages/SeasonManagement.js - **Reference**: `contracts/api-contracts.md` → "Season Endpoints" → PATCH /seasons?id=eq.{id}. See `spec.md` → FR-002a for editable fields.
- [x] T028 [US1] Implement season delete functionality in frontend/src/pages/SeasonManagement.js with confirmation - **Reference**: `contracts/api-contracts.md` → "Season Endpoints" → DELETE /seasons. See `spec.md` → FR-002b for safeguards. Check `data-model.md` → "Foreign Key Constraints" for CASCADE behavior.
- [x] T029 [P] [US1] Create frontend/src/pages/DriverManagement.js - Driver CRUD interface
- [x] T030 [US1] Implement driver creation form in frontend/src/pages/DriverManagement.js (all fields including picture upload) - **Reference**: `data-model.md` → "Driver" entity for all fields (email, name, nickname, birth_date, sex, blood_type, picture_url). See `spec.md` → FR-003. Use Bootstrap form components.
- [x] T031 [US1] Implement driver picture upload to Supabase Storage in frontend/src/pages/DriverManagement.js - **Reference**: `contracts/api-contracts.md` → "Storage Endpoints" → POST /storage/v1/object/driver-pictures. See `research.md` → "Image Storage" → "Implementation Approach" for upload process. Store URL in picture_url field.
- [x] T032 [US1] Implement driver list display in frontend/src/pages/DriverManagement.js with Bootstrap table - **Reference**: `contracts/api-contracts.md` → "Driver Endpoints" → GET /drivers. Display all Driver fields from `data-model.md`.
- [x] T033 [US1] Implement driver edit functionality in frontend/src/pages/DriverManagement.js - **Reference**: `contracts/api-contracts.md` → "Driver Endpoints" → PATCH /drivers?id=eq.{id}. See `spec.md` → FR-003a (all fields editable except email).
- [x] T034 [US1] Implement driver delete functionality in frontend/src/pages/DriverManagement.js with confirmation - **Reference**: `contracts/api-contracts.md` → "Driver Endpoints" → DELETE /drivers. See `spec.md` → FR-003b for safeguards. Check `data-model.md` → "Foreign Key Constraints" (RESTRICT if has race results).
- [x] T035 [US1] Implement email uniqueness validation in frontend/src/pages/DriverManagement.js - **Reference**: `data-model.md` → "Driver" → "Validation Rules" (email must be unique). See `spec.md` → FR-004. Validate before submit and handle 409 Conflict error from API.
- [x] T036 [P] [US1] Create frontend/src/pages/CupManagement.js - Cup CRUD interface
- [x] T037 [US1] Implement cup creation form in frontend/src/pages/CupManagement.js (name, dates, season selection) - **Reference**: `data-model.md` → "Cup" entity for fields (season_id, name, start_date, end_date). See `spec.md` → FR-005. Use Bootstrap form with season dropdown.
- [x] T038 [US1] Implement cup date validation (within season range) in frontend/src/pages/CupManagement.js - **Reference**: `data-model.md` → "Cup" → "Validation Rules" (cup dates must fall within parent season's date range). See `spec.md` → FR-006. Validate end_date >= start_date and both within season range.
- [x] T039 [US1] Implement cup list display in frontend/src/pages/CupManagement.js with Bootstrap table
- [x] T040 [US1] Implement cup edit functionality in frontend/src/pages/CupManagement.js
- [x] T041 [US1] Implement cup delete functionality in frontend/src/pages/CupManagement.js with confirmation
- [x] T042 [P] [US1] Create frontend/src/pages/RaceManagement.js - Race CRUD interface
- [x] T043 [US1] Implement race creation form in frontend/src/pages/RaceManagement.js (name, location, datetime, season/cup assignment, championship toggle) - **Reference**: `data-model.md` → "Race" entity for fields (season_id, cup_id, name, location, race_datetime, affects_championship). See `spec.md` → FR-007, FR-008. Validate cup_id season matches season_id per `data-model.md` → "Validation Rules".
- [x] T044 [US1] Implement race list display in frontend/src/pages/RaceManagement.js with Bootstrap table
- [x] T045 [US1] Implement race edit functionality in frontend/src/pages/RaceManagement.js
- [x] T046 [US1] Implement race delete functionality in frontend/src/pages/RaceManagement.js with confirmation
- [x] T047 [US1] Create API service methods in frontend/src/services/api.js for seasons (create, read, update, delete) - **Reference**: `contracts/api-contracts.md` → "Season Endpoints" for all CRUD operations. Use Supabase client from T013. Include error handling per contracts error responses.
- [x] T048 [US1] Create API service methods in frontend/src/services/api.js for drivers (create, read, update, delete) - **Reference**: `contracts/api-contracts.md` → "Driver Endpoints" for all CRUD operations. Handle email uniqueness errors (409 Conflict).
- [x] T049 [US1] Create API service methods in frontend/src/services/api.js for cups (create, read, update, delete) - **Reference**: `contracts/api-contracts.md` → "Cup Endpoints" for all CRUD operations. Include season_id in queries.
- [x] T050 [US1] Create API service methods in frontend/src/services/api.js for races (create, read, update, delete) - **Reference**: `contracts/api-contracts.md` → "Race Endpoints" for all CRUD operations. Support filtering by season_id and cup_id per FR-009, FR-010.
- [x] T051 [US1] Create frontend/src/services/theme.js - Season accent color management and theme application - **Reference**: `research.md` → "Formula 1 Design Theme" → "Implementation Approach" for CSS custom properties. See `spec.md` → FR-036, FR-037 for theming requirements.
- [x] T052 [US1] Implement theme application based on current season in frontend/src/services/theme.js - **Reference**: `spec.md` → FR-036. Apply season.accent_color to CSS custom property `--season-accent`. Update table headers, navigation, buttons per theming requirements. See `data-model.md` → "Season" entity for accent_color field.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Admins can create and manage seasons, drivers, cups, and races.

---

## Phase 4: User Story 2 - Race Results Entry and Management (Priority: P2)

**Goal**: Enable admins to enter race results for drivers after races occur. Admin views filtered races, navigates to race detail, and enters driver results with penalties and disqualification flags.

**Independent Test**: Create a race, navigate to race detail page, and enter results for multiple drivers. System should display all entered results in a table, allow editing, and persist all data correctly.

### Implementation for User Story 2

- [x] T053 [P] [US2] Create frontend/src/pages/RaceDetail.js - Race detail page with results table
- [x] T054 [US2] Implement race filter functionality in frontend/src/pages/RaceManagement.js (filter by season and/or cup)
- [x] T055 [US2] Implement navigation to race detail page from race list in frontend/src/pages/RaceManagement.js
- [x] T056 [US2] Display race details (name, location, datetime, championship impact) in frontend/src/pages/RaceDetail.js
- [x] T057 [US2] Create race result entry modal component in frontend/src/components/RaceResultModal.js with Bootstrap modal
- [x] T058 [US2] Implement driver selection dropdown in frontend/src/components/RaceResultModal.js
- [x] T059 [US2] Implement finish position input in frontend/src/components/RaceResultModal.js
- [x] T060 [US2] Implement best lap time input in frontend/src/components/RaceResultModal.js
- [x] T061 [US2] Implement grid start position input in frontend/src/components/RaceResultModal.js
- [x] T062 [US2] Implement penalty entry interface in frontend/src/components/RaceResultModal.js (standard types with counts + custom penalties) - **Reference**: `data-model.md` → "Penalty" entity for structure. See `spec.md` → FR-014a, FR-014b. Standard types: disqualification (-8), cone_tire_warning (-2), race_direction_warning (-4), stop_and_go (-6), missing_club_shirt (-2) per `data-model.md` → "Validation Rules". Allow custom penalty with name and point_deduction.
- [x] T063 [US2] Implement disqualification flag checkbox in frontend/src/components/RaceResultModal.js
- [x] T064 [US2] Implement comments textarea in frontend/src/components/RaceResultModal.js
- [x] T065 [US2] Implement save race result functionality in frontend/src/components/RaceResultModal.js
- [x] T066 [US2] Display race results table in frontend/src/pages/RaceDetail.js (sorted by finish position)
- [x] T067 [US2] Implement edit race result functionality in frontend/src/pages/RaceDetail.js
- [x] T068 [US2] Implement delete race result functionality in frontend/src/pages/RaceDetail.js with confirmation
- [x] T069 [US2] Create API service methods in frontend/src/services/api.js for race results (create, read, update, delete) - **Reference**: `contracts/api-contracts.md` → "Race Result Endpoints" for all CRUD operations. See `data-model.md` → "RaceResult" entity for fields. Include penalties in select query (join).
- [x] T070 [US2] Create API service methods in frontend/src/services/api.js for penalties (create, read, update, delete) - **Reference**: `contracts/api-contracts.md` → "Race Result Endpoints" → POST /penalties. See `data-model.md` → "Penalty" entity. Create penalties after race result creation.
- [x] T071 [US2] Implement penalty calculation logic in frontend/src/services/api.js (sum penalty points by type and count) - **Reference**: `spec.md` → FR-020a (sum penalty type point value × count). See `data-model.md` → "Penalty" → "Validation Rules" for standard penalty point values.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Admins can create races and enter race results with penalties.

---

## Phase 5: User Story 3 - Public Driver Rankings Display (Priority: P3)

**Goal**: Public users can view driver rankings for current season. Rankings calculated using complex points system with tie-breakers. Displayed in tabs for each cup and overall championship.

**Independent Test**: Have a season with races that have results entered, then view public landing page. System should display tabs for each cup and overall championship tab, calculate points correctly, and display drivers sorted by total points with tie-breaker rules applied.

### Implementation for User Story 3

- [x] T072 [P] [US3] Create frontend/src/pages/PublicRankings.js - Public rankings landing page
- [x] T073 [US3] Implement current active season detection in frontend/src/pages/PublicRankings.js (end_date >= today or most recent) - **Reference**: `spec.md` → FR-030, FR-030a. Query seasons where end_date >= today, or if none, select season with most recent end_date. See `contracts/api-contracts.md` → "Season Endpoints" → GET /seasons?end_date=gte.2026-01-26.
- [x] T074 [US3] Create frontend/src/services/points.js - Points calculation service - **Reference**: `research.md` → "Points Calculation Strategy" → "Implementation Approach" for client-side calculation approach. See `data-model.md` → "Calculated Fields" for what to calculate.
- [x] T075 [US3] Implement position points calculation in frontend/src/services/points.js (1st: 35, 2nd: 30, etc.) - **Reference**: `spec.md` → FR-017 for complete points table (1st: 35, 2nd: 30, 3rd: 26, 4th: 23, 5th: 21, 6th: 19, 7th: 18, 8th: 17, 9th: 16, 10th: 15, 11th: 14, 12th: 13, 13th: 12, 14th: 11, 15th: 10, 16th: 9, 17th: 8, 18th: 7, 19th: 6, 20th: 5, 21st: 4, 22nd: 3, 23rd: 2, 24th: 1).
- [x] T076 [US3] Implement pole position bonus (+1 point) in frontend/src/services/points.js - **Reference**: `spec.md` → FR-018. Award +1 point if grid_start_position === 1.
- [x] T077 [US3] Implement fastest lap bonus (+1 point) in frontend/src/services/points.js - **Reference**: `spec.md` → FR-019. Find driver with minimum best_lap_time. Handle ties per `spec.md` → "Edge Cases" (award to better finish position).
- [x] T078 [US3] Implement penalty point deduction in frontend/src/services/points.js (by type and count) - **Reference**: `spec.md` → FR-020, FR-020a. Sum (penalty type point value × count) for each penalty type. See `data-model.md` → "Penalty" → "Validation Rules" for standard penalty values.
- [x] T079 [US3] Implement disqualification handling in frontend/src/services/points.js (prevent dropped race usage) - **Reference**: `spec.md` → FR-021. Mark disqualified race results (is_disqualified = true) as non-droppable.
- [x] T080 [US3] Implement tie-breaker calculation in frontend/src/services/points.js (1st places, 2nd places, 3rd places, poles, fastest laps, penalties, earliest highest points) - **Reference**: `spec.md` → FR-023 for complete tie-breaker order. Calculate counts for each position, poles, fastest laps, total penalties. Track earliest highest points achievement.
- [x] T081 [US3] Implement suspension detection in frontend/src/services/points.js (20+ penalty points from race direction) - **Reference**: `spec.md` → FR-022. Sum penalty points where penalty_type = "race_direction_warning" (count × -4). If >= 20, mark for suspension (next race or 2 dropped races if last race).
- [x] T082 [US3] Create tabs component for cups and overall championship in frontend/src/pages/PublicRankings.js with Bootstrap tabs
- [x] T083 [US3] Implement cup rankings calculation in frontend/src/pages/PublicRankings.js (races assigned to cup only) - **Reference**: `spec.md` → FR-026. Filter races where cup_id matches selected cup. Calculate rankings using points.js service. See `data-model.md` → "Race" entity for cup_id relationship.
- [x] T084 [US3] Implement overall championship rankings calculation in frontend/src/pages/PublicRankings.js (all races with affects_championship=true) - **Reference**: `spec.md` → FR-027. Filter races where affects_championship = true, regardless of cup_id. Calculate rankings using points.js service.
- [x] T085 [US3] Display driver rankings table in frontend/src/pages/PublicRankings.js (name, picture, best position, total points)
- [x] T086 [US3] Sort drivers by total points with tie-breakers in frontend/src/pages/PublicRankings.js
- [x] T087 [US3] Apply season accent color to rankings page theming in frontend/src/pages/PublicRankings.js
- [x] T088 [US3] Implement empty state message when no races/results exist in frontend/src/pages/PublicRankings.js
- [x] T089 [US3] Update routing in frontend/src/main.js to show PublicRankings.js as landing page for unauthenticated users

**Checkpoint**: All user stories should now be independently functional. Public users can view rankings, admins can manage everything.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T090 [P] Implement responsive design for all pages (mobile-first, 320px to 4K)
- [ ] T091 [P] Apply Bootstrap responsive utilities and mobile navigation patterns
- [x] T093 [P] Implement error handling and user-friendly error messages across all pages
- [x] T094 [P] Implement loading states and spinners for async operations
- [x] T095 [P] Add form validation feedback (Bootstrap validation classes) across all forms
- [ ] T097 [P] Performance optimization - code splitting by page, lazy loading
- [x] T099 [P] Add admin password change functionality in frontend/src/pages/AdminDashboard.js - **Reference**: `contracts/api-contracts.md` → "Authentication Endpoints" → PUT /auth/v1/user. See `spec.md` → FR-001c. Use Supabase Auth password change API.
- [x] T100 [P] Add admin creation functionality (first admin only) in frontend/src/pages/AdminDashboard.js - **Reference**: `contracts/api-contracts.md` → "Authentication Endpoints" → POST /auth/v1/user. See `spec.md` → FR-001b. Check if current admin is first admin (is_first_admin = true) per `data-model.md` → "Admin" entity. Create user in Supabase Auth, then insert into admins table.
- [ ] T101 [P] Update README.md with complete setup instructions and first admin password
- [ ] T104 [P] Run quickstart.md validation - verify all setup steps work correctly
- [x] T105 [P] Add `is_ongoing` boolean column to Supabase `seasons` table (default false) - **Reference**: `data-model.md` → "Season"
- [x] T106 [P] Add Bootstrap switch toggle to season create/edit form to set `is_ongoing`, persist to backend in frontend/src/pages/SeasonManagement.js - **Reference**: `spec.md` → FR-038
- [x] T107 [P] Update active season selection logic to prefer `is_ongoing` seasons (most recent `start_date` wins) before date-based fallback in frontend/src/services/theme.js or equivalent - **Reference**: `spec.md` → FR-030a, FR-030b
- [x] T108 [P] Define placeholder image URL builder using DiceBear (seed + size=200) for headshot-style placeholders; document any helmet-like variant options if supported - **Reference**: `spec.md` → FR-031b, `research.md` → "Placeholder Images"
- [x] T109 [P] Implement native image fallback handling (`onerror` swap to placeholder) and ensure lazy loading/decoding for driver pictures in frontend/src/pages/PublicRankings.js, frontend/src/pages/DriverManagement.js, frontend/src/pages/RaceDetail.js - **Reference**: `spec.md` → FR-031a, FR-031b
- [x] T110 [P] Fix Supabase Storage access for driver images: ensure `driver-pictures` bucket is public, add Storage CORS entries for app origins (GET/HEAD), and verify public URL format in upload flow - **Reference**: `spec.md` → FR-034a

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 (needs races, drivers, seasons)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US1 and US2 (needs races with results)

### Within Each User Story

- API service methods before pages that use them
- Components before pages that use them
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T008)
- All Foundational tasks marked [P] can run in parallel (T013-T020)
- Once Foundational phase completes:
  - User Story 1 tasks marked [P] can run in parallel (T021, T023-T024, T029, T036, T042)
  - User Story 2 tasks marked [P] can run in parallel (T053)
  - User Story 3 tasks marked [P] can run in parallel (T072)
- Polish phase tasks marked [P] can all run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all parallel page components together:
Task: "Create frontend/src/pages/LoginPage.js"
Task: "Create frontend/src/pages/AdminDashboard.js"
Task: "Create frontend/src/pages/SeasonManagement.js"
Task: "Create frontend/src/pages/DriverManagement.js"
Task: "Create frontend/src/pages/CupManagement.js"
Task: "Create frontend/src/pages/RaceManagement.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add Polish → Final deployment

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (seasons, drivers, cups, races)
   - Developer B: Can start User Story 2 prep (race detail page structure)
   - Developer C: Can start User Story 3 prep (points calculation service)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All Bootstrap components should use CDN-loaded Bootstrap CSS
- Custom CSS overrides in bootstrap-overrides.css and theme.css
- Season accent colors applied dynamically via CSS custom properties
