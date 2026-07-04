## ADDED Requirements

### Requirement: Four Level Church Hierarchy
The system SHALL support a four-level hierarchy consisting of Pastor, Leaders (for groups Puissance, Gloire, and Sagesse), Shepherds, and Members.

#### Scenario: Role assignment upon user creation
- **WHEN** an administrator or pastor creates a user profile
- **THEN** they MUST assign one of the valid roles (pastor, leader, shepherd) and associate leaders/shepherds with their respective group (Puissance, Gloire, Sagesse)

### Requirement: Row Level Security Data Privacy
The system SHALL restrict data access via PostgreSQL Row Level Security (RLS) based on the user's role and group assignment.

#### Scenario: Shepherd views member list
- **WHEN** a logged-in Shepherd requests to view members
- **THEN** the system SHALL return ONLY members whose `shepherd_id` matches the logged-in Shepherd's ID

#### Scenario: Leader views shepherd reports
- **WHEN** a logged-in Leader requests to view shepherds and reports
- **THEN** the system SHALL return ONLY shepherds and reports belonging to the Leader's assigned group (Puissance, Gloire, or Sagesse)

#### Scenario: Pastor global access
- **WHEN** a logged-in Pastor requests to view any member, shepherd, leader, or report across all groups
- **THEN** the system SHALL grant full read access to all records
