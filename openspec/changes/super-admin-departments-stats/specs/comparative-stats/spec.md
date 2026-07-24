## ADDED Requirements

### Requirement: Entity Comparison
The system SHALL allow comparing multiple entities (groups, shepherds, or departments) across selected metrics.

#### Scenario: Compare shepherds
- **WHEN** the user selects multiple shepherds and metrics to compare
- **THEN** the system displays a comparison table with each shepherd's values for the selected metrics

#### Scenario: Compare groups
- **WHEN** the user selects multiple groups and metrics to compare
- **THEN** the system displays a comparison table with each group's values for the selected metrics

#### Scenario: Compare departments
- **WHEN** the user selects multiple departments and metrics to compare
- **THEN** the system displays a comparison table with each department's values for the selected metrics

### Requirement: Comparison Metrics
The system SHALL support the following metrics for comparison.

#### Scenario: Available comparison metrics
- **WHEN** the user opens the comparison interface
- **THEN** the system shows available metrics: memberCount, attendanceSunday, attendanceTuesday, attendanceWednesday, attendanceThursday, attendanceFriday, disciplinePrayer, disciplineMeditation, disciplineEvangelism, soulsWon, reportSubmissionRate, shepherdScore

### Requirement: Comparison Visualization
The system SHALL display comparison results using appropriate visualizations.

#### Scenario: Bar chart comparison
- **WHEN** the user views a comparison of a single metric across entities
- **THEN** the system displays a horizontal bar chart showing each entity's value

#### Scenario: Table comparison
- **WHEN** the user views a comparison of multiple metrics
- **THEN** the system displays a table with entities as rows and metrics as columns

### Requirement: Period Selection for Comparison
The system SHALL allow selecting a time period for comparisons.

#### Scenario: Compare with period filter
- **WHEN** the user selects a period (week, month, trimester, or custom)
- **THEN** the system filters all comparison data to that period
