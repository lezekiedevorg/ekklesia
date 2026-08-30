# Proposition : Export PDF des listes de membres

## Problème

Le berger doit pouvoir partager/imprimer des listes de membres :
1. **Liste des membres actifs** — un export rapide, prédéfini, toujours disponible
2. **Liste de son choix** — une liste nommée, réutilisable, qu'il constitue au fil de l'eau (ex: "Chorale", "Baptisés mars 2026", "Visites à faire")

Aujourd'hui, aucune de ces fonctionnalités n'existe. La page `/members` (côté berger) affiche les membres mais ne permet ni de les regrouper dans des listes nommées, ni d'exporter quoi que ce soit en PDF.

## Solution

### 1. Liste des membres actifs — bouton d'export PDF
Bouton "Exporter en PDF" en haut de `/members` qui génère instantanément un PDF A4 portrait contenant tous les membres au statut `member` (statut officiel, pas `new` ni `archived`).

### 2. Listes nommées réutilisables
Sur `/members`, panneau latéral ou modal "Mes listes" permettant de :
- Créer une liste nommée (texte libre)
- Ajouter/retirer des membres via checkbox sur chaque carte
- Renommer, supprimer une liste
- Exporter une liste en PDF (nom, prénom, numéro de téléphone)

Persistance : **localStorage** (côté berger, pas besoin de table DB pour ce besoin). Les listes sont propres à chaque navigateur/bergers.

### 3. Génération PDF
**Approche : `@media print` + `window.print()`**, identique au rapport berger existant (`src/components/reports/ShepherdReportPrint.tsx`).
- Composant React caché, visible uniquement à l'impression
- Format A4 portrait, en-tête avec nom de la liste + date
- Colonnes : `#` | Nom & Prénom | Téléphone
- Pas de dépendance ajoutée

## Périmètre

**Inclut :**
- Bouton export "Membres actifs" → PDF
- UI de création/gestion des listes nommées sur `/members`
- Persistance localStorage des listes
- Composant d'impression PDF réutilisable
- Checkboxes d'ajout/retrait sur les cartes membres

**N'inclut pas :**
- Partage/export inter-bergers des listes (local = local)
- Filtres avancés (déjà gérés par la page existante)
- Export Excel/CSV (uniquement PDF dans ce change)
- Migration Supabase (aucune nécessaire)

## Risques

- **localStorage** : limité à 5–10 MB, largement suffisant pour des listes de quelques centaines de membres. Si dépassé, on basculera vers Supabase plus tard.
- **Multi-bergers sur même navigateur** : les listes seront partagées entre bergers sur le même navigateur. Acceptable pour la v1.
- **Mobile** : la sélection par checkbox fonctionne mais l'UI doit être tactile-friendly.
