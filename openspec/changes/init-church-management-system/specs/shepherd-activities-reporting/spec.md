## ADDED Requirements

### Requirement: Shepherd Personal Spiritual Discipline Tracking
The system SHALL allow Shepherds to log their weekly personal spiritual activities, including daily meditation count (0-7), daily prayer hours count (0-7), weekly evangelization completion, monthly prayer vigil completion, and monthly in-person prayer completion.

#### Scenario: Logging weekly spiritual activities
- **WHEN** a Shepherd accesses their weekly activity form
- **THEN** they SHALL be able to input and save counts for daily meditation and 1h+ prayer days, along with boolean toggles for evangelization, monthly vigil, and monthly in-person prayer

### Requirement: Consolidated Sunday Weekly Report Generation
The system SHALL compile and freeze a consolidated weekly report table (`weekly_reports`) for each Shepherd every Sunday evening, aggregating attendance statistics, Sunday absences with motives, new member tracking, and the Shepherd's personal activities.

#### Scenario: Submitting the weekly report
- **WHEN** a Shepherd clicks submit on their weekly report on Sunday evening
- **THEN** the system SHALL generate a JSONB snapshot of all attendance ratios, absent members with reasons, new members invited/progressing, and personal discipline metrics, saving it with status `submitted`

#### Scenario: Leader review and approval
- **WHEN** a Leader reviews a submitted weekly report from a Shepherd in their group and clicks approve
- **THEN** the system SHALL update the report status to `approved` and make it visible in the Pastor's executive summary
