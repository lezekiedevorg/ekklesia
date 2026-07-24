## ADDED Requirements

### Requirement: Department CRUD
The system SHALL allow authorized users (super_admin, admin, pastor) to create, read, update, and delete departments.

#### Scenario: Create a new department
- **WHEN** an authorized user submits a department creation form with name, description, and icon
- **THEN** the system creates the department and displays it in the department list

#### Scenario: Department name uniqueness
- **WHEN** an authorized user tries to create a department with a name that already exists
- **THEN** the system rejects the creation with an error message indicating the name is taken

#### Scenario: Delete a department
- **WHEN** an authorized user deletes a department
- **THEN** the system removes the department and all member associations (member_departments entries are cascade deleted)

### Requirement: Member-Department Assignment
The system SHALL allow authorized users to assign members to departments and remove them.

#### Scenario: Assign a member to a department
- **WHEN** an authorized user assigns a member to a department with a role (member, leader, or responsible)
- **THEN** the system creates a member_departments record linking the member to the department

#### Scenario: Remove a member from a department
- **WHEN** an authorized user removes a member from a department
- **THEN** the system deletes the member_departments record

#### Scenario: View department members
- **WHEN** an authorized user views a department detail page
- **THEN** the system displays all members assigned to that department with their roles

### Requirement: Department Leader Assignment
The system SHALL allow authorized users to assign a leader to a department.

#### Scenario: Assign a department leader
- **WHEN** an authorized user selects a profile as department leader
- **THEN** the system updates the department's leader_id and displays the leader name on the department card

### Requirement: Department Member Limits
The system SHALL NOT impose any limit on the number of members in a department.

#### Scenario: Unlimited members
- **WHEN** a department already has members assigned
- **THEN** the system allows additional members to be assigned without restriction
