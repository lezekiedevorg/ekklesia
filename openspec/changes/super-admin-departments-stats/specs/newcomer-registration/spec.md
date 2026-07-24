## ADDED Requirements

### Requirement: Newcomer Registration Form
The system SHALL provide a registration form for recording newcomers on Sundays.

#### Scenario: Register a newcomer with inviter
- **WHEN** a department member registers a newcomer who was invited by an existing member
- **THEN** the system creates a new member record with status='new', consecutive_sundays_present=1, and assigns the shepherd based on the inviter's shepherd or the inviter's group shepherds

#### Scenario: Register a walk-in newcomer
- **WHEN** a department member registers a newcomer who came by themselves (no inviter)
- **THEN** the system creates a new member record with status='new', consecutive_sundays_present=1, flags is_self_initiated=true, and uses the manually selected shepherd

#### Scenario: Newcomer registration form fields
- **WHEN** the registration form is displayed
- **THEN** the system shows fields for: first_name, last_name, phone, residence_location, invited_by_member_id (optional dropdown), notes (optional), and assigned_shepherd_id (auto-populated or manual selection)

### Requirement: Automatic Shepherd Assignment
The system SHALL automatically assign a shepherd to newcomers based on the inviter relationship.

#### Scenario: Invited by a shepherd
- **WHEN** the newcomer was invited by a member who is a shepherd
- **THEN** the system assigns the newcomer to that shepherd (shepherd_id = inviter's profile id)

#### Scenario: Invited by a non-shepherd member in a group
- **WHEN** the newcomer was invited by a member who is not a shepherd but belongs to a group
- **THEN** the system assigns the newcomer to the first shepherd found in that group

#### Scenario: Walk-in (self-initiated)
- **WHEN** the newcomer has no inviter (is_self_initiated = true)
- **THEN** the system requires manual shepherd selection by the registrar and records the assignment in newcomer_registrations

### Requirement: Newcomer Registration Logging
The system SHALL log all newcomer registrations in a dedicated table.

#### Scenario: Registration logged
- **WHEN** a newcomer is registered
- **THEN** the system creates a newcomer_registrations record with member_id, registered_by, registration_date, invited_by_member_id, residence_location, is_self_initiated, assigned_shepherd_id, and notes

#### Scenario: View registration history
- **WHEN** an authorized user views the newcomers page
- **THEN** the system displays all registrations with date, newcomer name, inviter name, assigned shepherd, and self-initiated flag

### Requirement: Integration with Existing Member System
The system SHALL integrate newcomer registration with the existing member and attendance systems.

#### Scenario: New member triggers integration tracking
- **WHEN** a new member is created via newcomer registration
- **THEN** the existing trigger handle_sunday_attendance_update() begins tracking their consecutive Sundays for the 4-Sunday integration process

#### Scenario: Newcomer auto-assigned to Amis des Nouveaux department
- **WHEN** a newcomer is registered
- **THEN** the system automatically creates a member_departments record linking the newcomer to the "Amis des Nouveaux" department
