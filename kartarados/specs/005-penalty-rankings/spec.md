# Feature Specification: Penalty Rankings Tab

**Feature Branch**: `005-penalty-rankings`  
**Created**: 2026-01-30  
**Status**: Draft  
**Input**: User description: "On the public rankings page, add a new ranking tab for the drivers penalties. The drivers are ranked from top(most penalties) to bottom. If there is a tie, the topmost driver will be the one that got the penalty before the other, that can be based on race result date. If they also tie at the same race result, the driver that finished after the other is considered the first on the penalty ranking. Also, add a penalties colum to all the tables on the drivers ranking page. Make sure that the \"Total Points\" column is always the first one after the driver name."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Penalty rankings tab (Priority: P1)

As a user viewing public rankings, I want a penalties tab so I can see which drivers received the most penalties.

**Why this priority**: Penalties are an important dimension of performance and should be visible in rankings.

**Independent Test**: Load the penalties tab and verify ordering for drivers with different penalty totals and tie-breaks.

**Acceptance Scenarios**:

1. **Given** drivers with different penalty totals, **When** I open the Penalties tab, **Then** drivers are ordered from most penalties to least.
2. **Given** two drivers have the same penalty total, **When** their first penalties occurred in different races, **Then** the driver who received the penalty earlier ranks higher.
3. **Given** two drivers have the same penalty total and received their first penalty in the same race, **When** I view the penalties tab, **Then** the driver with the worse finish position ranks higher.

---

### User Story 2 - Show penalties column in rankings (Priority: P1)

As a user reviewing rankings, I want to see a penalties column on every rankings table to understand deductions at a glance.

**Why this priority**: Penalty points affect standings and should be visible everywhere rankings are shown.

**Independent Test**: View overall and cup tabs and verify the penalties column is present, with Total Points directly after Driver.

**Acceptance Scenarios**:

1. **Given** any rankings tab, **When** the table renders, **Then** the columns include Driver, Total Points, Penalties, and Best Position.
2. **Given** penalties exist for a driver, **When** the table renders, **Then** the penalties value is shown for that driver.

---

### Edge Cases

- How should penalties be ranked when all totals are zero?
- What happens when a driver never received penalties (no penalty date)?
- How are ties handled when penalty totals and first penalty race are identical?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: PublicRankings MUST include a Penalties tab for the selected season.
- **FR-002**: Penalty rankings MUST sort by total penalties (most to least), then by earliest penalty date, then by worst finish position in that race.
- **FR-003**: All rankings tables MUST include a Penalties column.
- **FR-004**: The Total Points column MUST be the first column after Driver in all rankings tables.

### Key Entities *(include if feature involves data)*

- **Driver**: Aggregated penalties and finish positions.
- **RaceResult**: Source of penalty points and race date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Penalties tab renders with correct ordering according to penalty totals and tie-breakers.
- **SC-002**: All ranking tables show Total Points immediately after Driver and include penalties.
