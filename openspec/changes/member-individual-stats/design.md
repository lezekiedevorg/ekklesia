# Design : Statistiques Individuelles du Fidèle

## Architecture

```
src/app/members/[id]/
  └── page.tsx                    ← Server Component (données + layout)

src/components/members/
  ├── MemberStatsKPIs.tsx         ← 4 cartes KPI
  ├── MemberAttendanceChart.tsx   ← Courbe multi-programmes (Recharts)
  ├── MemberProgramBars.tsx       ← Barres horizontales par programme
  ├── MemberRegularityBadge.tsx   ← Badge spectre 4 niveaux
  └── PeriodSelector.tsx          ← Presets + date range custom

src/lib/utils/stats.ts
  ├── getMemberStats(memberId, period)         ← KPIs + régularité
  └── getMemberAttendanceTrend(memberId, period, granularity)  ← courbe
```

## Modèle de données (pas de changement de schéma)

On réutilise les tables existantes :
- `attendance` (member_id, program_type, is_present, date)
- `members` (current_class pour l'éligibilité)
- `PROGRAM_DEFINITIONS` (eligibility_class pour filtrer)

## Calcul de la régularité

```
taux = présences réelles / présences attendues (selon éligibilité)

┌─────────────┬──────────────────────────────┐
│ Niveau      │ Seuil                        │
├─────────────┼──────────────────────────────┤
│ Régulier    │ taux ≥ 75%                   │
│ Modéré      │ 50% ≤ taux < 75%             │
│ Irrégulier  │ 25% ≤ taux < 50%             │
│ Absent      │ taux < 25%                   │
└─────────────┴──────────────────────────────┘
```

L'éligibilité par programme respecte `eligibility_class` des `PROGRAM_DEFINITIONS` :
- sunday_service, thursday_online, friday_service → tous éligibles
- tuesday_class → seuls `current_class === "tuesday_class"`
- wednesday_class → seuls `current_class === "wednesday_class"`

## Courbe d'évolution

Recharts `<LineChart>` avec :
- X = semaines (ou mois selon granularité)
- Y = taux de présence (%)
- Une ligne colorée par programme (5 programmes = 5 lignes)
- Légende interactive (cliquer pour masquer/afficher une ligne)
- Tooltip au survol avec détail

## Présence en semaine

```
semaines_actives = nombre de semaines où le fidèle a été présent
                   à au moins 1 programme en semaine (mar/mer/jeu/ven)
semaines_totales = nombre de semaines dans la période

taux_présence_semaine = semaines_actives / semaines_totales
```

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ ← Retour   Fiche de Jean Dupont    [Statistiques]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ Période ──────────────────────────────────────┐ │
│  │ [1 mois] [3 mois] [6 mois] [1 an]  du: _ au: _│ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │ 78%  │ │Régul.│ │12/16 │ │28/07 │              │
│  │Prés. │ │ ✅   │ │sem.  │ │Dern. │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                     │
│  ┌─ Courbe d'évolution ───────────────────────────┐ │
│  │  100% ┤                                        │ │
│  │   75% ┤   ╭──╮    ╭─╮                         │ │
│  │   50% ┤──╯    ╰──╯   ╰───                     │ │
│  │   25% ┤                                        │ │
│  │       └──┬──┬──┬──┬──┬──┬──                   │ │
│  │         S1 S2 S3 S4 S5 S6 S7                   │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Présence par programme ───────────────────────┐ │
│  │  🌞 Dimanche    ████████████████████░░░  85%   │ │
│  │  📘 Mardi       ████████████░░░░░░░░░░  55%   │ │
│  │  📗 Mercredi    ██████████████████░░░░  75%   │ │
│  │  🌐 Jeudi       ████████░░░░░░░░░░░░░  40%   │ │
│  │  🔥 Vendredi    ██████████████████████  95%   │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Choix techniques

| Décision | Choix | Raison |
|----------|-------|--------|
| Graphiques | Recharts | Léger, SVG, bon support React, responsive |
| Rendu | Server Component | Stats calculées côté serveur, pas de loading spinner |
| Navigation | Lien depuis carte membre | Bouton "Voir stats" ouvre `/members/[id]` |
| Période | URL search params | `?from=2026-04-01&to=2026-07-31` — partageable |
