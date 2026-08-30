## ADDED Requirements

### Requirement: Active Members PDF Export
The system SHALL provide a one-click PDF export of all members whose `status` is `member` (official active members), accessible from the `/members` page for Shepherds and Leaders.

#### Scenario: Exporting active members as PDF
- **WHEN** a Shepherd or Leader clicks the "Exporter membres actifs (PDF)" button on `/members`
- **THEN** the system SHALL generate a print-ready PDF (A4 portrait) containing every member with `status = 'member'`, displaying their full name and phone number in a 3-column table (# / Nom & Prénom / Téléphone), with the export date in the header

#### Scenario: Empty active members list
- **WHEN** a Shepherd triggers the export and no member has `status = 'member'`
- **THEN** the system SHALL display an empty-state toast/message instead of generating an empty PDF

### Requirement: Named Member Lists
The system SHALL allow Shepherds to create, name, edit, and delete reusable member lists on the `/members` page, persisting them in localStorage.

#### Scenario: Creating a new list
- **WHEN** a Shepherd clicks "+ Nouvelle liste" and provides a name
- **THEN** the system SHALL create a new named list with an empty member set and make it the active list

#### Scenario: Adding a member to the active list
- **WHEN** a Shepherd checks the checkbox on a member card while a list is active
- **THEN** the system SHALL add that member's id to the active list and persist the change immediately

#### Scenario: Removing a member from the active list
- **WHEN** a Shepherd unchecks the checkbox on a member card while a list is active
- **THEN** the system SHALL remove that member's id from the active list and persist the change

#### Scenario: Renaming a list
- **WHEN** a Shepherd edits the name of an existing list
- **THEN** the system SHALL update the name in place and persist the change

#### Scenario: Deleting a list
- **WHEN** a Shepherd clicks "Supprimer" on a list and confirms
- **THEN** the system SHALL remove the list from localStorage and deselect it if it was active

### Requirement: Named List PDF Export
The system SHALL allow Shepherds to export any named member list as a PDF, with the list name as the title and the same 3-column layout (full name + phone number).

#### Scenario: Exporting a named list
- **WHEN** a Shepherd clicks "Exporter PDF" on a named list with at least one member
- **THEN** the system SHALL generate a print-ready PDF (A4 portrait) containing only the members in that list, with the list name as title and the export date as subtitle

#### Scenario: Exporting an empty named list
- **WHEN** a Shepherd tries to export a named list that has zero members
- **THEN** the system SHALL display an empty-state toast and NOT trigger print

### Requirement: Active List Visual Indicator
The system SHALL display the name of the currently active list as a sticky banner on `/members` so the Shepherd always knows which list they are adding members to.

#### Scenario: Active list banner
- **WHEN** a list is active and visible on `/members`
- **THEN** the system SHALL display a sticky banner showing the list name and a member count, plus a "Quitter" action to deselect

#### Scenario: No active list
- **WHEN** no list is selected
- **THEN** the system SHALL NOT show the banner and member card checkboxes SHALL be hidden or disabled
