## MODIFIED Requirements

### Requirement: Trigger de maintien du statut new pour les absences
Le trigger `handle_sunday_attendance_update` SHALL maintenir le `status='new'` lorsque un nouveau est absent au culte dimanche. Le trigger SHALL uniquement incrémenter `consecutive_absences` sans changer le statut. La graduation automatique en `status='member'` à 4 présences dimanches consécutifs est préservée.

#### Scenario: Nouveau absent le dimanche
- **WHEN** un enregistrement `attendance` est inséré avec `is_present=false`, `program_type='sunday_service'` pour un membre avec `status='new'`
- **THEN** le `consecutive_absences` est incrémenté de 1
- **AND** le `status` reste `'new'` (PAS de transition vers `'absent_to_relaunch'`)
- **AND** le `consecutive_sundays_present` est préservé (pas remis à zéro)

#### Scenario: Nouveau présent le dimanche (progression)
- **WHEN** un enregistrement `attendance` est inséré avec `is_present=true`, `program_type='sunday_service'` pour un membre avec `status='new'` et `consecutive_sundays_present < 4`
- **THEN** le `consecutive_sundays_present` est incrémenté de 1
- **AND** le `consecutive_absences` est remis à 0
- **AND** le `status` reste `'new'`

#### Scenario: Graduation automatique à 4 présences
- **WHEN** un membre avec `status='new'` atteint `consecutive_sundays_present >= 4` suite à un culte dimanche
- **THEN** le `status` change automatiquement en `'member'`
- **AND** le membre disparaît de l'onglet "Nouvelles Âmes" et apparaît dans "Membres Actifs"

#### Scenario: Membre absent_to_relaunch qui revient
- **WHEN** un membre avec `status='absent_to_relaunch'` est présent au culte dimanche
- **THEN** le comportement existant est préservé : retour en `'new'` si `< 4` présences, graduation en `'member'` si `>= 4`
