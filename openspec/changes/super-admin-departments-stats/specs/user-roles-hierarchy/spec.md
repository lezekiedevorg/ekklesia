## MODIFIED Requirements

### Requirement: Role-Based Permission System
The system SHALL enforce permissions based on user roles with the following hierarchy: super_admin > admin > pastor > leader > shepherd. Each role SHALL have specific permissions that control access to features and data.

#### Scenario: Super admin has all permissions
- **WHEN** a user with role 'super_admin' accesses any feature
- **THEN** the system grants access (super_admin bypasses all permission checks)

#### Scenario: Admin has all permissions
- **WHEN** a user with role 'admin' accesses any feature
- **THEN** the system grants access (admin bypasses all permission checks)

#### Scenario: Pastor has global scope
- **WHEN** a user with role 'pastor' accesses member data
- **THEN** the system allows access to all members across all groups

#### Scenario: Leader scoped to group
- **WHEN** a user with role 'leader' accesses member data
- **THEN** the system restricts access to members in their group only

#### Scenario: Shepherd scoped to own members
- **WHEN** a user with role 'shepherd' accesses member data
- **THEN** the system restricts access to members assigned to them only

## ADDED Requirements

### Requirement: Department Management Permissions
The system SHALL grant department management permissions to specific roles.

#### Scenario: Departments view permission
- **WHEN** a user with departments:view permission navigates to /admin/departments
- **THEN** the system allows viewing department list and details

#### Scenario: Departments edit permission
- **WHEN** a user with departments:edit permission submits department changes
- **THEN** the system allows creating, updating, and deleting departments

#### Scenario: Departments assign permission
- **WHEN** a user with departments:assign permission assigns members to departments
- **THEN** the system allows creating and removing member-department associations

### Requirement: Newcomer Registration Permissions
The system SHALL grant newcomer registration permissions to specific roles.

#### Scenario: Newcomers register permission
- **WHEN** a user with newcomers:register permission submits a newcomer registration
- **THEN** the system allows creating new member records via the registration form

#### Scenario: Newcomers view all permission
- **WHEN** a user with newcomers:view_all permission views the newcomers page
- **THEN** the system displays all newcomer registrations across the church

### Requirement: Statistics Permissions
The system SHALL grant statistics access permissions to specific roles.

#### Scenario: Stats view global permission
- **WHEN** a user with stats:view_global permission accesses /admin/super-dashboard
- **THEN** the system displays global statistics and KPIs

#### Scenario: Stats compare permission
- **WHEN** a user with stats:compare permission accesses /admin/stats
- **THEN** the system allows comparing entities across metrics

#### Scenario: Stats evolution permission
- **WHEN** a user with stats:evolution permission accesses /admin/stats/evolution
- **THEN** the system displays evolution charts with time-series data

### Requirement: Super Dashboard Permission
The system SHALL restrict super dashboard access to authorized roles.

#### Scenario: Super dashboard view permission
- **WHEN** a user with super_dashboard:view permission navigates to /admin/super-dashboard
- **THEN** the system displays the full dashboard with all panels
