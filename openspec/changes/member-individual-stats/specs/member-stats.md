# Spec : Statistiques Individuelles du Fidèle

## Vue d'ensemble

Page dédiée affichant les statistiques de fréquentation d'un fidèle spécifique, accessible via `/members/[id]`.

## Comportements

### Sélecteur de période

- **ÉTANT DONNÉ** un utilisateur sur la page stats d'un fidèle
- **QUAND** il sélectionne un preset (1 mois, 3 mois, 6 mois, 1 an)
- **ALORS** toutes les données de la page se recalculent pour cette période
- **ET** l'URL reflète la période via search params (`?from=...&to=...`)

- **ÉTANT DONNÉ** un utilisateur sur la page stats d'un fidèle
- **QUAND** il sélectionne "Personnalisé" et entre une date de début et de fin
- **ALORS** les données se recalculent pour cette plage personnalisée
- **ET** le preset actif se met en surbrillance si la plage correspond à un preset

### Cartes KPI

- **ÉTANT DONNÉ** une période sélectionnée
- **QUAND** la page se charge
- **ALORS** 4 cartes s'affichent :
  1. **Taux de présence global** : moyenne des taux de tous les programmes éligibles
  2. **Niveau de régularité** : badge avec le spectre (voir ci-dessous)
  3. **Semaines actives** : `X/Y semaines` où Y = semaines totales dans la période
  4. **Dernière venue** : date de la dernière présence enregistrée

### Spectre de régularité

- **Régulier** : taux global ≥ 75% → badge vert
- **Modéré** : 50% ≤ taux < 75% → badge ambre
- **Irrégulier** : 25% ≤ taux < 50% → badge orange
- **Absent** : taux < 25% → badge rouge

Le taux est calculé en pondérant chaque programme selon l'éligibilité du membre.

### Courbe d'évolution

- **ÉTANT DONNÉ** une période et un membre
- **QUAND** la page se charge
- **ALORS** un graphique en courbes s'affiche avec :
  - X = semaines (ou mois si période > 6 mois)
  - Y = taux de présence (0-100%)
  - Une ligne colorée par programme éligible
  - Légende interactive (cliquer pour masquer/afficher)
  - Tooltip au survol avec détail (date, programme, taux)

### Barres de présence par programme

- **ÉTANT DONNÉ** une période et un membre
- **QUAND** la page se charge
- **ALORS** une barre horizontale s'affiche par programme :
  - Icône + label du programme
  - Barre de progression colorée (vert > 75%, ambre 50-75%, rouge < 50%)
  - Pourcentage à droite
  - Les programmes non éligibles pour ce membre sont grisés avec mention "Non éligible"

### Navigation

- **ÉTANT DONNÉ** un utilisateur sur la page Fidèles (`/members`)
- **QUAND** il clique sur "Voir stats" d'une carte membre
- **ALORS** il est redirigé vers `/members/[id]`
- **ET** la page affiche les stats avec la période par défaut (3 mois)

- **ÉTANT DONNÉ** un utilisateur sur la page stats d'un fidèle
- **QUAND** il clique sur "← Retour"
- **ALORS** il revient à la liste des fidèles

## Calculs

### getMemberStats(memberId, period)

```
Entrée : memberId, { start: string, end: string }
Sortie : {
  totalProgramsEligible: number,
  overallAttendanceRate: number,      // 0-100
  regularityLevel: "regular" | "moderate" | "irregular" | "absent",
  regularityLabel: string,            // "Régulier", "Modéré", etc.
  activeWeeksCount: number,
  totalWeeksCount: number,
  lastSeenDate: string | null,
  byProgram: {
    programId: string,
    label: string,
    icon: string,
    eligible: boolean,
    presentCount: number,
    totalCount: number,
    rate: number,                      // 0-100
  }[]
}
```

### getMemberAttendanceTrend(memberId, period, granularity)

```
Entrée : memberId, { start, end }, "week" | "month"
Sortie : {
  period: string,                     // "2026-W27" ou "2026-07"
  programs: Record<string, number>    // programId → taux 0-100
}[]
```

## Contraintes

- Uniquement pour les membres non archivés
- Les membres archivés voient un message "Statistiques non disponibles pour les membres archivés"
- Les programmes avec `eligibility_class` ne comptent que si `member.current_class` correspond
- La granularité passe automatiquement de "semaine" à "mois" si la période > 6 mois
