## ADDED Requirements

### Requirement: Section Nouveaux à relancer dans la page d'alertes
La page `/alerts` SHALL afficher une section distincte "Nouveaux à relancer" pour les membres avec `status='new'` et `consecutive_absences >= 1`.

#### Scenario: Alerte pour un nouveau absent 1 dimanche
- **WHEN** un membre a `status='new'` et `consecutive_absences >= 1`
- **THEN** il apparaît dans la section "Nouveaux à relancer" de la page d'alertes
- **AND** l'alerte indique le nombre d'absences consécutives et la progression d'intégration (X/4)

#### Scenario: Nouveau non alerté s'il est présent
- **WHEN** un membre a `status='new'` et `consecutive_absences = 0`
- **THEN** il n'apparaît PAS dans les alertes

### Requirement: Section Membres à relancer
La page `/alerts` SHALL conserver la section existante "Membres à relancer" avec les règles actuelles : `status='absent_to_relaunch'` OU (`status != 'new'` ET `consecutive_absences >= 2`).

#### Scenario: Membre absent depuis 2 semaines
- **WHEN** un membre a `status='member'` et `consecutive_absences >= 2`
- **THEN** il apparaît dans la section "Membres à relancer"

#### Scenario: Nouveau exclu de la section Membres
- **WHEN** un membre a `status='new'`
- **THEN** il n'apparaît JAMAIS dans la section "Membres à relancer", même avec `consecutive_absences >= 2`

### Requirement: Visite pastorale pour les nouveaux
L'enregistrement d'une visite pastorale pour un nouveau SHALL réinitialiser `consecutive_absences` à 0 et mettre à jour `last_seen_date`, sans changer le statut (`status` reste `'new'`).

#### Scenario: Visite pastorale d'un nouveau
- **WHEN** un berger enregistre une visite pastorale pour un nouveau avec `consecutive_absences = 2`
- **THEN** `consecutive_absences` passe à 0
- **AND** `last_seen_date` est mis à jour
- **AND** `status` reste `'new'`
- **AND** le nouveau disparaît de la section "Nouveaux à relancer"

### Requirement: Visuel différencié des alertes nouveaux
Les alertes de la section "Nouveaux à relancer" SHALL utiliser un style visuel distinct (couleur, icône, badge) de la section "Membres à relancer".

#### Scenario: Distinction visuelle
- **WHEN** le berger consulte la page d'alertes
- **THEN** les alertes nouveaux ont un badge "🌟 Nouveau" et un fond de couleur distinct
- **AND** les alertes membres ont un badge "🔴 Membre" avec un autre style
