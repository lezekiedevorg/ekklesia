## ADDED Requirements

### Requirement: Prolonged Absence Detection and Alerts
The system SHALL monitor consecutive Sunday absences for each member and automatically generate a high-priority visual alert for the assigned Shepherd when consecutive absences reach 2 or more.

#### Scenario: Triggering an absence alert
- **WHEN** a member accumulates 2 or more consecutive Sunday absences (`consecutive_absences >= 2`)
- **THEN** the system SHALL display a red alert badge ("Visite pastorale requise") on the Shepherd's dashboard for that member

#### Scenario: Clearing an absence alert
- **WHEN** a member with an active absence alert is subsequently marked present at a Sunday service or receives a recorded pastoral visit
- **THEN** the system SHALL reset their `consecutive_absences` counter to 0 and remove the alert badge

### Requirement: Pastoral Visit Logging with Motives
The system SHALL allow Shepherds to log pastoral visits to members, recording the visit date, specific motive/reason, notes, and whether they were accompanied by another member.

#### Scenario: Recording a visit with motive
- **WHEN** a Shepherd submits a pastoral visit log specifying a member, date, motive (`reason`), and optional accompanying member
- **THEN** the system SHALL save the visit record to `member_visits` and update the member's last interaction timestamp
