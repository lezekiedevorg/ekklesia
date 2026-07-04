## ADDED Requirements

### Requirement: Four Sunday Attendance Progression for New Members
The system SHALL track consecutive Sunday attendance for newly registered persons (`status = 'new'`) using a counter (`consecutive_sundays_present`) initialized at 1 upon registration.

#### Scenario: Incrementing Sunday attendance counter
- **WHEN** a newly registered person (`status = 'new'`) is marked present on a Sunday service
- **THEN** the system SHALL increment their `consecutive_sundays_present` counter by 1

#### Scenario: Graduation to full member status
- **WHEN** a person's `consecutive_sundays_present` counter reaches 4
- **THEN** the system SHALL automatically transition their status from `new` to `member`

### Requirement: Suspension and Relaunch Without Counter Reset
The system SHALL suspend tracking without resetting the attendance counter if a new person misses a Sunday during their 4-week integration period.

#### Scenario: Missing a Sunday during integration
- **WHEN** a person with `status = 'new'` and `consecutive_sundays_present < 4` is marked absent on a Sunday
- **THEN** the system SHALL change their status to `absent_to_relaunch` while preserving their exact `consecutive_sundays_present` count

#### Scenario: Resuming attendance after suspension
- **WHEN** a person with `status = 'absent_to_relaunch'` returns and is marked present on a subsequent Sunday
- **THEN** the system SHALL restore their status to `new` (if count < 3) or `member` (if count reaches 4) and increment their preserved counter by 1
