# Tasks : Export PDF des listes de membres

## 1. Helpers de stockage localStorage
- [x] Créer `src/lib/storage/namedLists.ts` avec les types `NamedList` et fonctions CRUD
- [x] Utiliser la clé `ekklesia:named_lists:v1` (versionnée pour migrations futures)
- [x] Gérer le cas localStorage indisponible (SSR, privé) → fallback en mémoire no-op

## 2. Composant d'impression : ActiveMembersPrint
- [x] **Fusionné avec NamedListPrint** → `MembersListPrint` (générique, voir design)

## 3. Composant d'impression : NamedListPrint
- [x] Créer `src/components/members/MembersListPrint.tsx` (composant unique réutilisable)
  - Props : `title`, `subtitle?`, `members: { fullName, phone }[]`, `trigger`, `onAfterPrint?`
  - A4 portrait, marges 15mm, tableau 3 colonnes (# / Nom & Prénom / Téléphone)
  - `useEffect` déclenche `window.print()` après render
  - Visible uniquement à l'impression (`@media screen { display: none }`)
  - Styles `@media print` intégrés dans `<style>` du composant

## 4. Composant MembersListManager (UI panneau)
- [x] Créer `src/components/members/MembersListManager.tsx`
  - Liste les `NamedList` avec nom éditable en place, compteur, boutons Export / Renommer / Supprimer
  - Bouton "+ Nouvelle liste" avec input inline (Enter pour valider, Escape pour annuler)
  - Confirmation avant suppression via `Modal`
  - Click sur le nom d'une liste → toggle actif/inactif
  - Badge "Active" sur la liste sélectionnée

## 5. Checkbox sur cartes membres
- [x] Créer `src/components/members/MemberCardCheckbox.tsx`
  - Props : `memberId`, `onChange?`
  - Lit l'état actuel via `isMemberInActiveList()`
  - Click → `toggleMemberInActiveList(memberId)` + persistance immédiate
  - Visible uniquement si `activeListId` est défini (rendu conditionnel côté parent)

## 6. Bandeau liste active
- [x] Créer `src/components/members/ActiveListBanner.tsx`
  - Sticky en haut de `/members`, visible si `activeListId` existe
  - Affiche nom de la liste + compteur de membres
  - Bouton "Quitter" → désactive la liste

## 7. Boutons header /members + intégration
- [x] Ajouter 2 boutons dans le header de `/members/page.tsx` :
  - "Membres actifs (PDF)" → filtre `status='member'` + déclenche `MembersListPrint`
  - "Mes listes" → toggle d'affichage du `MembersListManager`
- [x] Bandeau `ActiveListBanner` rendu conditionnellement après les onglets
- [x] `MembersListManager` rendu conditionnellement
- [x] `MemberCardCheckbox` injectée dans les 2 types de cartes (membres normaux + newcomers)
- [x] `MembersListPrint` rendu en bas de page, déclenché par `printTrigger`

## 8. Validation & tests
- [x] `npx eslint` sur tous les nouveaux fichiers → 0 erreur
- [x] `npx tsc --noEmit` sur les nouveaux fichiers → 0 erreur
- [x] `npm run build` complet → réussi, aucune erreur, route `/members` correctement générée
- [x] Créer `e2e/specs/members/lists-pdf-export.spec.ts` :
  - 3 tests smoke : présence boutons, création+activation liste, persistance après reload
  - ⚠️ Non exécutables ici (pas de Supabase live dans cet environnement) — à valider dans la CI / projet en local

## 9. Documentation
- [ ] (Optionnel) Mettre à jour le README si tu veux documenter publiquement la fonctionnalité
- [ ] (Optionnel) Ajouter une entrée AGENTS.md si une règle émerge — non nécessaire ici, le code parle de lui-même

## Notes d'implémentation

### Écart vs plan initial
- **Un seul composant d'impression** au lieu de 2 : `MembersListPrint` est générique avec props `title/subtitle/members`. Plus DRY, plus simple à maintenir. Couvre les 2 cas d'usage (membres actifs + liste nommée) via la même API.

### Choix techniques
- **localStorage clé versionnée** : `ekklesia:named_lists:v1` permet une migration future sans casser les données existantes
- **`crypto.randomUUID()` avec fallback** : support des navigateurs anciens
- **Subscribe cross-tab** : `subscribeToChanges()` via l'event `storage` permet de garder l'UI sync entre onglets
- **Modal de confirmation** : utilise le composant `Modal` existant (cohérent avec le reste du projet)
- **`alert()` pour les états vides** : pragmatique pour la v1, pourra être remplacé par un toast plus tard

### Accessibilité
- Checkbox = `<button>` avec `title` (pas un `<input type="checkbox">` car le design attend une tuile visuelle)
- Tous les boutons ont des `title` pour l'infobulle
- Bandeau sticky respecte le contexte (couleurs à fort contraste)
