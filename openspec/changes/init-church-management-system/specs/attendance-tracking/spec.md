## ADDED Requirements

### Requirement: Service Attendance Recording
The system SHALL allow Shepherds to record presence or absence for their members across five program types: Tuesday class, Wednesday class, Thursday online prayer, Friday service, and Sunday service.

#### Scenario: Recording Sunday service attendance
- **WHEN** a Shepherd selects Sunday service for the current date
- **THEN** the system SHALL display all members assigned to that Shepherd and allow toggling presence status

### Requirement: Filtered Attendance Lists by Program Type
The system SHALL filter the attendance roster based on the selected program type to show only eligible members.

#### Scenario: Recording Tuesday class attendance
- **WHEN** a Shepherd selects the Tuesday class program
- **THEN** the system SHALL display ONLY members whose `current_class` is set to `tuesday_class`

#### Scenario: Recording Wednesday class attendance
- **WHEN** a Shepherd selects the Wednesday class program
- **THEN** the system SHALL display ONLY members whose `current_class` is set to `wednesday_class`

#### Scenario: Recording General program attendance
- **WHEN** a Shepherd selects Thursday online prayer, Friday service, or Sunday service
- **THEN** the system SHALL display ALL members assigned to that Shepherd regardless of their class enrollment
