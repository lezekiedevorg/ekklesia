## ADDED Requirements

### Requirement: Global Statistics Aggregation
The system SHALL compute aggregated statistics across the entire church.

#### Scenario: Get global stats for current week
- **WHEN** the system computes global stats without a period parameter
- **THEN** it returns: totalMembers, activeMembers, newMembersThisWeek, totalShepherds, totalGroups, totalDepartments, attendanceByProgram (ratio for each of the 5 programs), disciplineScores (prayer, meditation, evangelism, fasting percentages), reportSubmissionRate, and alertCount

#### Scenario: Get global stats for custom period
- **WHEN** the system computes global stats with start and end dates
- **THEN** it returns the same metrics scoped to that date range

### Requirement: Group Statistics
The system SHALL compute statistics scoped to a specific group.

#### Scenario: Get group stats
- **WHEN** the system computes stats for a specific group_id
- **THEN** it returns: memberCount, shepherdsInGroup, attendanceByProgram, disciplineScores, reportStatus — all scoped to members in that group

### Requirement: Shepherd Statistics
The system SHALL compute statistics for a specific shepherd.

#### Scenario: Get shepherd stats
- **WHEN** the system computes stats for a specific shepherd_id
- **THEN** it returns: memberCount, attendanceRatios, disciplineScores, soulsWon, visitsCount, callsCount, reportStatus, and computedScore (0-5 stars)

### Requirement: Department Statistics
The system SHALL compute statistics for a specific department.

#### Scenario: Get department stats
- **WHEN** the system computes stats for a specific department_id
- **THEN** it returns: memberCount, memberNames, and for "Amis des Nouveaux": newcomerRegistrationsThisPeriod

### Requirement: Attendance Trend
The system SHALL compute attendance trends over time for any entity.

#### Scenario: Get weekly attendance trend
- **WHEN** the system computes attendance trend with granularity='week' for a group, shepherd, or department
- **THEN** it returns an array of objects with: week (date string), programs (object with ratio for each program type)

#### Scenario: Get monthly attendance trend
- **WHEN** the system computes attendance trend with granularity='month'
- **THEN** it returns an array of objects with: month (date string), programs (object with ratio for each program type)

### Requirement: Discipline Scores
The system SHALL compute discipline scores for shepherds.

#### Scenario: Get discipline scores
- **WHEN** the system computes discipline scores for a shepherd in a period
- **THEN** it returns percentages for: prayer (Q/I done), meditation (Q/I done), evangelism, fasting, and monthly activities

### Requirement: Configurable Shepherd Score
The system SHALL compute a composite shepherd score using configurable weights.

#### Scenario: Compute shepherd score with default weights
- **WHEN** the system computes a shepherd score and no custom weights are set in app_settings
- **THEN** it uses default weights: attendance=30, discipline=25, evangelism=20, reports=15, pastoral_care=10

#### Scenario: Compute shepherd score with custom weights
- **WHEN** the system computes a shepherd score and custom weights exist in app_settings under 'shepherd_score_weights'
- **THEN** it uses the custom weights (summing to 100)

#### Scenario: Score normalization
- **WHEN** a metric is normalized to 0-5 scale
- **THEN** the system applies: 0-40% → 1★, 40-60% → 2★, 60-75% → 3★, 75-90% → 4★, 90-100% → 5★
