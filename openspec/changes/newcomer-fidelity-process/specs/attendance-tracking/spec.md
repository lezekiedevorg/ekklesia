## MODIFIED Requirements

### Requirement: Séparation visuelle des nouveaux dans l'appel de présence du berger
La feuille de présence du berger sur `/attendance` SHALL distinguer visuellement les nouvelles âmes (`status='new'`) des membres confirmés. Les nouveaux SHALL apparaître en premier dans la liste avec un en-tête de section dédié.

#### Scenario: Badge Nouveau dans la feuille de présence
- **WHEN** un berger consulte sa feuille de présence sur `/attendance`
- **THEN** les membres avec `status='new'` affichent un badge "Nouveau" à côté de leur nom
- **AND** les membres avec un autre statut n'ont pas ce badge

#### Scenario: Séparation visuelle dans la liste
- **WHEN** le berger consulte sa feuille de présence sans filtre
- **THEN** les nouvelles âmes sont regroupées en haut de liste avec un en-tête "Nouvelles Âmes (X)"
- **AND** les membres confirmés sont regroupés en dessous avec un en-tête "Membres Confirmés (Y)"

#### Scenario: Progression d'intégration visible dans l'appel
- **WHEN** le berger consulte sa feuille de présence
- **THEN** chaque nouveau affiche sa progression d'intégration (X/4 dimanches) à côté de son nom
- **AND** cette information est visible dans la vue Semaine, la vue Jour et le mode Wizard

#### Scenario: Filtrage par population
- **WHEN** le berger sélectionne le filtre "Nouveaux" dans la feuille de présence
- **THEN** seuls les membres avec `status='new'` sont affichés
