## ADDED Requirements

### Requirement: Super Dashboard Access Control
The system SHALL restrict access to the super dashboard to authorized roles only.

#### Scenario: Authorized user accesses dashboard
- **WHEN** a user with super_admin, admin, or pastor role navigates to /admin/super-dashboard
- **THEN** the system displays the dashboard with full data

#### Scenario: Unauthorized user attempts access
- **WHEN** a user without super_admin, admin, or pastor role navigates to /admin/super-dashboard
- **THEN** the system redirects them to their default page or shows an access denied message

### Requirement: Global KPIs Display
The system SHALL display key performance indicators on the super dashboard.

#### Scenario: KPI cards show current metrics
- **WHEN** the dashboard loads
- **THEN** the system displays KPI cards for: total active members, attendance ratio (dimanche), total shepherds, total departments, active alerts count, and report submission rate

### Requirement: Organization Tree
The system SHALL display an interactive organizational tree showing the church hierarchy.

#### Scenario: Org tree shows groups and shepherds
- **WHEN** the dashboard loads
- **THEN** the system displays a tree with: church → groups (Puissance/Gloire/Sagesse) → shepherds → member counts

#### Scenario: Org tree shows departments
- **WHEN** the dashboard loads
- **THEN** the system displays department cards with member counts and leader names

### Requirement: Weekly Summary
The system SHALL display a summary of the current week's attendance across all programs.

#### Scenario: Week summary shows program attendance
- **WHEN** the dashboard loads
- **THEN** the system displays attendance ratios for each program (Dimanche, Mardi, Mercredi, Jeudi, Vendredi)

### Requirement: Alerts Panel
The system SHALL display active alerts and warnings on the dashboard.

#### Scenario: Alerts show shepherd issues
- **WHEN** the dashboard loads
- **THEN** the system displays alerts for: shepherds with attendance < 70%, members absent 2+ consecutive Sundays, and pending report submissions

#### Scenario: Alerts show newcomer statistics
- **WHEN** the dashboard loads
- **THEN** the system displays the count of newcomers registered this week

### Requirement: Dashboard Navigation
The system SHALL provide navigation links to all admin sections from the dashboard.

#### Scenario: Navigation to sub-pages
- **WHEN** the user clicks navigation links on the dashboard
- **THEN** the system navigates to: departments, newcomers, stats, stats/evolution
