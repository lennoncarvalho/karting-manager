# Feature Specification: Ranking Calculations With Discards

**Feature Branch**: `002-ranking-calculations-discard`  
**Created**: 2026-01-28  
**Status**: Draft  
**Input**: User description: "The new feature Is about ranking calculations. For each of the cups within a season, the worst driver result for a race is discarded from calculations. If a driver has no race_results for a race, meaning he missed that for some reason, that can count as a discarted race_result. When calculating a cup tab ranking, discard the (worst finish position OR a missed race) for every driver. When calculating the overall championship, if it has two cups and each cup grants a bad result exclusion(discard), the overall points will not sum two races, or do nothing if driver missed one race at each cup. Penalties received should still detuct from driver points. Pole position and fastest lap should not sum up to driver points."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cup rankings discard worst/missed result (Priority: P1)

As a fan or admin viewing a cup tab, I want each driver's lowest scoring race (or a missed race) discarded so cup standings reflect the best results.

**Why this priority**: Cup rankings are the primary standings shown per competition and must reflect the discard rule correctly.

**Independent Test**: Can be fully tested by calculating a single cup tab with known results and verifying one discard per driver.

**Acceptance Scenarios**:

1. **Given** a cup with 4 races and a driver with race points [35, 26, 15, 0], **When** rankings are calculated, **Then** the 0-point race is discarded and the total reflects only the top 3 races.
2. **Given** a cup with 1 race and a driver has a result for it, **When** rankings are calculated, **Then** no discard is applied and the total equals that race's points.
3. **Given** a cup with 3 races and a driver who missed one race, **When** rankings are calculated, **Then** the missed race counts as the discard and the total equals the sum of the two completed races.

---

### User Story 2 - Overall championship applies one discard per cup (Priority: P2)

As a fan or admin viewing the overall championship, I want the standings to discard one bad result per cup so the championship total aligns with cup rules.

**Why this priority**: Overall standings must be consistent with cup rules and expectations of total race counts.

**Independent Test**: Can be fully tested by calculating overall standings for a season with multiple cups and verifying discard count equals the number of cups.

**Acceptance Scenarios**:

1. **Given** a season with 2 cups and 6 races total, **When** overall standings are calculated, **Then** each driver has their 2 lowest race scores (including missed races) discarded from the total.
2. **Given** a driver who missed one race in each cup, **When** overall standings are calculated, **Then** the discards apply to those missed races and the total is unchanged.

---

### User Story 3 - Points reflect finishes and penalties only (Priority: P3)

As a user reviewing rankings, I want points to be based on finish position and penalties only, without bonus points for pole or fastest lap.

**Why this priority**: The scoring system should match the updated rules that remove bonus points while still applying penalties.

**Independent Test**: Can be tested by verifying a single race result with pole/fastest flags and penalties.

**Acceptance Scenarios**:

1. **Given** a race where a driver earns pole and fastest lap, **When** points are calculated, **Then** no bonus points are added for those achievements.
2. **Given** a race where a driver receives a penalty, **When** points are calculated, **Then** the penalty deducts from the driver's total points.

---

### Edge Cases

- What happens when a cup has only one race (discard should be skipped)?
- How are races without a cup assignment treated in overall discard counts (exclude from discard count)?
- How should disqualified results be treated when selecting the discard?
- How are ties handled when multiple races share the same lowest points?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST discard exactly one race result per driver when calculating a cup tab ranking.
- **FR-002**: System MUST treat a missing race result as a 0-point race that is eligible for discard in cup rankings.
- **FR-003**: System MUST skip the cup discard when a cup has only one race.
- **FR-004**: System MUST discard a number of races per driver in the overall championship equal to the number of cups included in the championship standings.
- **FR-005**: System MUST treat missing race results as 0-point races eligible for discard in overall standings.
- **FR-006**: System MUST exclude races with no cup assignment from the overall discard count.
- **FR-007**: System MUST calculate race points using finish position only; pole position and fastest lap MUST NOT add points.
- **FR-008**: System MUST apply penalty point deductions to driver totals even when a race is discarded.
- **FR-009**: Tie-breakers (finish counts, poles, fastest laps, penalties, reached-at) MUST continue to use all recorded race results unless otherwise specified.

### Key Entities *(include if feature involves data)*

- **Season**: A collection of cups and races that can affect overall championship standings.
- **Cup**: A subset of races within a season with its own standings and discard rule.
- **Race**: An event associated with a cup and season, with ordered results.
- **RaceResult**: A driver's finish position, penalties, and metadata for a race.
- **Driver**: Competitor accumulating points across races.
- **Penalty**: A point deduction associated with a race result.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cup standings totals equal the sum of all race points minus exactly one discarded race per driver.
- **SC-002**: Overall standings totals equal the sum of all championship race points minus the number of discards equal to cup count.
- **SC-003**: Pole position and fastest lap do not change total points compared to finish-position-only scoring.
- **SC-004**: Penalties always reduce a driver's total points regardless of discards.
