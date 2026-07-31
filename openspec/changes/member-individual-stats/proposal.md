# Proposition : Statistiques Individuelles du Fidèle

## Problème

Actuellement, la page "Fidèles" affiche des informations basiques (statut, classe, absences consécutives, dernière venue) mais offre **aucune visibilité sur la tendance de fréquentation** d'un fidèle au fil du temps. Impossible de répondre à :

- "Ce fidèle est-il régulier sur ses programmes ?"
- "Sa fréquentation augmente ou diminue ?"
- "Quels programmes fréquente-t-il le plus ?"
- "Est-il présent en semaine sur les 3 derniers mois ?"

## Solution

Page dédiée `/members/[id]` avec un tableau de bord statistiques individuel.

### Fonctionnalités clés

1. **Sélecteur de période** avec presets (1 mois, 3 mois, 6 mois, 1 an) et plage personnalisée
2. **Cartes KPI** : taux de présence global, niveau de régularité, semaines actives, dernière venue
3. **Courbe d'évolution multi-programmes** : une ligne par programme sur la période
4. **Barres de présence par programme** : taux de présence par programme avec codes couleur
5. **Badge de régularité** : spectre à 4 niveaux (Régulier / Modéré / Irrégulier / Absent)

### Accès

- Depuis la page Fidèles : bouton "Voir stats" sur chaque carte membre
- URL directe partageable : `/members/[id]`

## Périmètre

- **Inclut** : page UI, composants graphiques, fonctions stats backend, navigation
- **N'inclut pas** : modification du modèle de données, exports PDF, comparaison entre fidèles

## Risques

- **Volume de données** : pour un fidèle avec 2 ans de présence, la requête attendance peut contenir ~500 lignes — acceptable
- **Performance** : les stats sont calculées côté serveur (Server Component), pas de souci
- **Bibliothèque graphique** : ajout de `recharts` (~200kb gzippé) — léger et bien maintenu
