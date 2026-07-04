## ADDED Requirements

### Requirement: Member Class Enrollment and Progression Management
The system SHALL allow Shepherds to update the teaching class status (`current_class`) of their members to one of four states: `none`, `tuesday_class`, `wednesday_class`, or `completed`.

#### Scenario: Enrolling a member in Tuesday class
- **WHEN** a Shepherd sets a member's class status to `tuesday_class`
- **THEN** the member SHALL appear in Tuesday attendance rosters and be excluded from Wednesday attendance rosters

#### Scenario: Promoting a member to Wednesday class
- **WHEN** a Shepherd promotes a member from `tuesday_class` to `wednesday_class`
- **THEN** the member's status SHALL update to `wednesday_class`, appearing in Wednesday attendance rosters and being removed from Tuesday rosters

#### Scenario: Completing all classes
- **WHEN** a Shepherd marks a member's class status as `completed`
- **THEN** the member SHALL no longer appear in Tuesday or Wednesday class rosters while remaining active in general church service rosters
