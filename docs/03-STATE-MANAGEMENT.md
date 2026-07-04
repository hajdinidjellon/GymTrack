# 03 — State management

## Vue d'ensemble

Zustand v5, 6 stores, **pas de Context custom, pas de Redux**. React Query est installé mais inutilisé (candidat à suppression — voir roadmap).

| Store | État | Persistance | Rôle |
|---|---|---|---|
| `workoutStore` | `workouts[]`, `isLoading` | SQLite (`workouts`) | Historique des séances, CRUD, sélecteurs (`getWorkoutById`, `getWorkoutsThisWeek`, `getLastWorkoutForExercise`) |
| `sessionStore` | `activeSession`, `restInterval` | ⚠️ **AUCUNE** (bug critique — voir ci-dessous) | Séance en cours : exercices, séries, chrono, timer de repos, haptics |
| `profileStore` | `profile`, `goals` | SQLite (`profile`, `goals`) | Profil, PRs, body stats + sélecteurs gamification (`getTotalXP`, `getStreak`, `getCurrentRank`, `getXPProgress`) |
| `settingsStore` | `settings` | AsyncStorage (`@gymtrack/settings`) | Unités, rest time, thème, langue, notifications, mode d'entraînement |
| `badgeQueueStore` | `queue`, `seenIds` | AsyncStorage | File des badges à célébrer, déduplication |
| `celebrationStore` | overlays PR / rank-up / toast | Aucune (éphémère, voulu) | Pilote les overlays globaux de `_layout.tsx` |

## Quel état va où — règle de décision

```
L'état survit-il à la fermeture de l'app ?
├─ NON, purement visuel (modal ouvert, tab actif, champ en cours de saisie)
│    → useState local dans le composant. PAS de store.
├─ NON, mais partagé entre écrans (célébration en cours)
│    → store Zustand non persisté (celebrationStore)
├─ OUI, donnée métier (workout, profil, plan, goal)
│    → store Zustand + SQLite via lib/db.ts + sync_queue
├─ OUI, préférence légère (settings, badges vus)
│    → store Zustand + AsyncStorage
└─ OUI, donnée sensible (token, credential)
     → expo-secure-store (voir 05-SECURITY.md) — jamais AsyncStorage
```

## Le pattern d'écriture canonique

Toute action de mutation d'une donnée métier suit EXACTEMENT ce squelette (copié de `workoutStore.addWorkout`) :

```ts
addWorkout: async (workout) => {
  await saveWorkoutLocal(workout);        // 1. SQLite d'abord (+ enqueue sync)
  set((s) => ({ workouts: [workout, ...s.workouts] }));  // 2. store ensuite
  flushSyncQueue().catch(() => null);     // 3. sync arrière-plan, best-effort
},
```

Si l'étape 1 throw, les étapes 2-3 ne s'exécutent pas → le store ne diverge jamais de SQLite.

## Ajouter un nouveau morceau d'état (checklist)

Exemple : ajouter des « exercices favoris ».

1. **Type** dans `types/index.ts` : `export interface FavoriteExercise { ... }`.
2. **Persistance** :
   - Donnée métier → migration SQLite : `migrateV4` dans `lib/db.ts` + `SCHEMA_VERSION = 4` + fonctions `saveFavoriteLocal` / `loadFavoritesLocal` / `deleteFavoriteLocal` avec `enqueueSync(...)`.
   - Préférence → clé AsyncStorage dans le store concerné.
3. **Sync** (si métier) : ajouter la branche `favorites` dans `syncEntryToCloud` / `deleteEntryFromCloud` (`lib/sync.ts`) + table Supabase avec RLS.
4. **Store** : nouveau store seulement si c'est un nouveau domaine ; sinon étendre l'existant. Suivre le pattern canonique ci-dessus.
5. **Sélecteurs** : exposer des hooks fins si la valeur est lue par plusieurs composants (modèle : `useUnits`, `useLanguage` dans `settingsStore`).
6. **Ne pas** : dupliquer la donnée dans deux stores, lire SQLite directement depuis un composant, ou écrire le store avant SQLite.

## Communication inter-stores

- Lecture ponctuelle hors React : `useProfileStore.getState().profile` (pattern utilisé dans `_layout.tsx` et `workoutStore`). OK dans les actions et effects, jamais dans le corps d'un render.
- `workoutStore` importe `profileStore`/`settingsStore` **dynamiquement** (`await import(...)`) pour casser un cycle d'imports — conserver ce pattern si un nouveau cycle apparaît, mais préférer restructurer.
- Les valeurs dérivées croisées (XP = f(workouts)) vivent en sélecteurs de store qui délèguent aux fonctions pures de `lib/gamification.ts`. ⚠️ `getTotalXP()` reparcourt tous les workouts à chaque appel — voir [07-PERFORMANCE.md](07-PERFORMANCE.md) pour la mémoïsation à prévoir.

## Règles de re-render

- S'abonner avec un **sélecteur** : `useSessionStore((s) => s.activeSession?.restSecondsLeft)` — jamais `const store = useSessionStore()` entier dans un composant qui re-rend souvent.
- `_layout.tsx` déstructure des stores entiers — acceptable là (racine), pas ailleurs.

## ⚠️ Dette connue sur ce chapitre (détail en roadmap)

1. **`sessionStore` n'est pas persisté** alors que son en-tête prétend « Persiste sur MMKV ». Une séance en cours est perdue si l'OS tue l'app. Fix prévu : `zustand/middleware` `persist` sur `activeSession` (AsyncStorage suffit ; recalcul de `elapsedSeconds`/`restSecondsLeft` depuis `startedAt`/`restEndsAt` à la réhydratation). **Bloquant avant release.**
2. **Fuite du chrono global** : l'interval créé dans `startSession` (`sessionStore.ts:68`) n'est jamais nettoyé — `finishSession`/`discardSession` doivent le `clearInterval`. Le hack `(get() as ...)._sessionInterval` doit devenir un champ normal du store (comme `restInterval`).
3. `finishSession` hardcode `name: 'Séance'`, `type: 'strength'`, `feeling: 3` — le type/mode choisi par l'utilisateur doit être stocké dans `ActiveSession` au `startSession` et repris ici.
