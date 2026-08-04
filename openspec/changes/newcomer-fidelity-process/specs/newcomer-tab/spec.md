## ADDED Requirements

### Requirement: Onglet Nouvelles Âmes dans la page membres
La page `/members` SHALL afficher un troisième onglet "Nouvelles Âmes" entre les onglets "Membres Actifs" et "Archives & Purgatoire". L'onglet SHALL afficher un compteur du nombre de nouvelles âmes.

#### Scenario: Affichage de l'onglet Nouvelles Âmes
- **WHEN** un berger, leader ou pasteur ouvre la page `/members`
- **THEN** trois onglets sont visibles : "Membres Actifs", "Nouvelles Âmes", "Archives & Purgatoire"
- **AND** l'onglet "Nouvelles Âmes" affiche le nombre de membres avec `status='new'`

### Requirement: Filtrage des onglets
L'onglet "Membres Actifs" SHALL exclure les membres avec `status='new'`. L'onglet "Nouvelles Âmes" SHALL afficher uniquement les membres avec `status='new'`.

#### Scenario: Nouveau exclu de l'onglet Actifs
- **WHEN** un membre a `status='new'`
- **THEN** il n'apparaît PAS dans l'onglet "Membres Actifs"
- **AND** il apparaît dans l'onglet "Nouvelles Âmes"

#### Scenario: Membre confirmé exclu de l'onglet Nouveaux
- **WHEN** un membre a `status='member'` ou `status='in_integration'`
- **THEN** il n'apparaît PAS dans l'onglet "Nouvelles Âmes"
- **AND** il apparaît dans l'onglet "Membres Actifs"

### Requirement: Carte de progression d'intégration
Chaque carte dans l'onglet "Nouvelles Âmes" SHALL afficher : nom complet, téléphone, date de première visite, personne qui l'a invité, berger assigné, date de dernière venue, progression d'intégration (X/4 dimanches), nombre d'absences consécutives.

#### Scenario: Affichage d'une carte nouveau
- **WHEN** un berger consulte l'onglet "Nouvelles Âmes"
- **THEN** chaque carte affiche la progression sous forme visuelle (barre ou pastilles) montrant X/4 dimanches présents
- **AND** la date de première visite est affichée (depuis `newcomer_registrations.registration_date` ou fallback `members.created_at`)

### Requirement: Boutons d'action sur la carte nouveau
Chaque carte SHALL proposer des boutons "Modifier" et "Stats" (page individuelle du membre).

#### Scenario: Accès aux stats d'un nouveau
- **WHEN** le berger clique sur "Stats" d'un nouveau
- **THEN** il est redirigé vers `/members/[id]` avec les statistiques individuelles du nouveau

### Requirement: Création forcée en status new
La modale de création de fidèle SHALL forcer `status='new'` et ne pas proposer de choix de statut. Un nouveau ne peut être créé qu'en tant que nouvelle âme.

#### Scenario: Création d'un nouveau fidèle
- **WHEN** un berger clique sur "Inscrire une nouvelle âme"
- **THEN** le formulaire crée le membre avec `status='new'` sans radio boutons de choix de statut
- **AND** le membre apparaît dans l'onglet "Nouvelles Âmes" après création
