## ADDED Requirements

### Requirement: Evolution Page Access
The system SHALL provide an evolution page at /admin/stats/evolution accessible to authorized roles.

#### Scenario: Authorized user accesses evolution page
- **WHEN** a user with super_admin, admin, or pastor role navigates to /admin/stats/evolution
- **THEN** the system displays the evolution charts page

### Requirement: Granularity Toggle
The system SHALL allow toggling between weekly and monthly granularity.

#### Scenario: Weekly granularity selected
- **WHEN** the user selects "Hebdomadaire" granularity
- **THEN** the system groups data by week (Monday-Sunday) and labels x-axis with week dates

#### Scenario: Monthly granularity selected
- **WHEN** the user selects "Mensuel" granularity
- **THEN** the system groups data by month (1st-last day) and labels x-axis with month names

### Requirement: Custom Date Range
The system SHALL allow selecting a custom date range for evolution charts.

#### Scenario: Custom date range applied
- **WHEN** the user sets a start date and end date
- **THEN** the system filters all evolution data to that date range

### Requirement: Member Growth Evolution
The system SHALL display a line chart showing member count evolution over time.

#### Scenario: Member growth chart
- **WHEN** the user views the evolution page
- **THEN** the system displays a line chart with total active members on y-axis and time (weeks or months) on x-axis

#### Scenario: Member growth by group
- **WHEN** the user filters by a specific group
- **THEN** the system displays separate lines for each group (Puissance, Gloire, Sagesse)

### Requirement: Attendance Evolution
The system SHALL display multi-line charts showing attendance ratios per program over time.

#### Scenario: Attendance trend chart
- **WHEN** the user views the evolution page
- **THEN** the system displays a multi-line chart with attendance ratio on y-axis and time on x-axis, with a separate line for each program (Dimanche, Mardi, Mercredi, Jeudi, Vendredi)

#### Scenario: Attendance trend by entity
- **WHEN** the user filters by a specific group, shepherd, or department
- **THEN** the system displays the attendance trend scoped to that entity

### Requirement: Evolution Facets
The system SHALL allow filtering evolution charts by group, shepherd, or department.

#### Scenario: Filter by group
- **WHEN** the user selects a group from the facet dropdown
- **THEN** the system filters all evolution charts to show data only for that group

#### Scenario: Filter by shepherd
- **WHEN** the user selects a shepherd from the facet dropdown
- **THEN** the system filters all evolution charts to show data only for that shepherd's members

#### Scenario: No filter (all church)
- **WHEN** no facet is selected
- **THEN** the system shows evolution data for the entire church
