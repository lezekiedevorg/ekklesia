# Design : Export PDF des listes de membres

## Architecture

### Composants nouveaux

```
src/
  components/
    members/
      MembersListManager.tsx       # Panneau "Mes listes" sur /members
      MemberCardCheckbox.tsx       # Checkbox sur chaque carte membre
      ActiveMembersPrint.tsx       # Composant d'impression (membres actifs)
      NamedListPrint.tsx           # Composant d'impression (liste nommée)
  lib/
    storage/
      namedLists.ts                # Helpers localStorage (CRUD listes)
```

### API & données

**Aucune migration Supabase nécessaire.** Le statut `member` est déjà dans la table `members` (enum `member_status`).

Persistance des listes : `localStorage` sous la clé `ekklesia:named_lists:v1` :
```ts
type NamedList = {
  id: string;          // crypto.randomUUID()
  name: string;        // ex: "Chorale 2026"
  memberIds: string[]; // members.id
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
};
```

### UI / UX

**Page `/members` (existante, modifiée) :**
- Header : 2 boutons
  - `Exporter membres actifs (PDF)` → déclenche `ActiveMembersPrint`
  - `Mes listes` → ouvre `MembersListManager` (modal ou panneau latéral)
- Sur chaque carte membre : `MemberCardCheckbox`
  - Si une liste est active (sélectionnée dans le manager), affiche une checkbox
  - Cochée → ajoute le membre à la liste active
  - Décochée → retire

**MembersListManager :**
- Liste des listes existantes avec :
  - Nom (éditable en place)
  - Compteur de membres
  - Bouton `Exporter PDF`
  - Bouton `Supprimer`
- Bouton `+ Nouvelle liste` → prompt inline pour le nom
- Une liste est "active" (sélectionnée) à la fois — son nom apparaît en bandeau sticky sur `/members` pour qu'on sache dans quoi on ajoute les membres.

### Impression PDF

**ActiveMembersPrint :**
- Titre : "Liste des membres actifs"
- Sous-titre : date du jour (fr-FR long)
- Tableau 3 colonnes : `#` | Nom & Prénom | Téléphone
- Pied de page : nom de l'église (si dispo via props) + compteur

**NamedListPrint :**
- Titre : nom de la liste
- Sous-titre : "X membres — généré le [date]"
- Tableau 3 colonnes : `#` | Nom & Prénom | Téléphone

Les deux composants :
- `<div className="hidden print:block">` (invisible à l'écran)
- `@media print` styles : A4 portrait, marges 15mm, font-size 11pt
- Déclenchement : `setTimeout(() => window.print(), 100)` après que React ait peint

### Réutilisabilité

`NamedListPrint` est générique : il accepte `{ title, members: { fullName, phone }[] }`. Il pourra servir pour d'autres exports dans le futur.

## Cohérence avec le projet

- Suit le pattern existant (`ShepherdReportPrint`)
- Pas de nouvelle dépendance (zéro install npm)
- Pas de migration DB
- Composants client (`"use client"`) comme le reste de `/members`
- TypeScript strict, conforme à `src/types/db.ts`
