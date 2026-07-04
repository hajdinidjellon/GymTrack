# 04 — Stratégie de tests

> État actuel : **zéro test, zéro linter**. Ce document définit la cible et l'ordre d'attaque. L'outillage à installer est une tâche bloquante de la [roadmap](09-ROADMAP-TECHNIQUE.md).

## Outillage recommandé

```bash
npx expo install jest-expo jest @types/jest
npm i -D @testing-library/react-native
```

- **Jest + jest-expo** (pas Vitest : jest-expo gère les mocks natifs Expo/RN out of the box).
- **@testing-library/react-native** pour les composants.
- **Maestro** pour l'E2E (pas Detox : Maestro est déclaratif en YAML, sans build custom complexe — bien plus adapté à un solo dev).

`package.json` :
```json
"scripts": { "test": "jest", "test:watch": "jest --watch" },
"jest": { "preset": "jest-expo", "moduleNameMapper": { "^@/(.*)$": "<rootDir>/$1" } }
```

## 1. Tests unitaires — priorité n°1

Cibler d'abord `lib/` : fonctions **pures, sans mock nécessaire**, et qui portent la logique la plus sensible (c'est là qu'un bug fâche vraiment l'utilisateur : XP faux, plan de progression faux).

### Ordre de priorité

| Fichier | Fonctions | Pourquoi critique |
|---|---|---|
| `lib/gamification.ts` | `calculateXPFromWorkouts`, `calculateStreakFromWorkouts`, `getRankByXP`, `getUnlockedBadges`, `getMuscleActivity`, `getRecoveredMuscles` | Cœur de la rétention. Un streak faux = utilisateur furieux. Cas limites nombreux (fuseaux horaires, séances le même jour, minuit). |
| `lib/aiPlanner.ts` | `calculate1RM`, `calculateWeight`, `generateWarmupSets`, `getSuggestedSession`, `generatePRProgression`, `analyzeMuscleGroupBalance` | Génère des charges d'entraînement — une erreur de calcul est un risque utilisateur réel. |
| `lib/onboardingFlow.ts` | ordre/branchements du flux | 21 écrans, régressions faciles. |
| `lib/db.ts` | migrations (`runMigrations` v0→v3, idempotence) | Une migration cassée = perte de données. Testable avec une DB en mémoire. |
| `stores/*` | actions des stores avec `lib/db` mocké | Vérifier le pattern « SQLite d'abord, store ensuite ». |

### Exemples concrets pour CE projet

```ts
// lib/__tests__/gamification.test.ts
import { calculateStreakFromWorkouts, getRankByXP, RANKS } from '@/lib/gamification';
import type { Workout } from '@/types';

const workout = (daysAgo: number): Workout => ({
  id: `w${daysAgo}`,
  date: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
  name: 'Push', type: 'strength', exercises: [], duration: 60,
  feeling: 3, completed: true,
});

describe('calculateStreakFromWorkouts', () => {
  it('retourne 0 sans séance', () => {
    expect(calculateStreakFromWorkouts([])).toBe(0);
  });
  it('ne casse pas le streak pour 2 séances le même jour', () => {
    expect(calculateStreakFromWorkouts([workout(0), workout(0), workout(1)]))
      .toBeGreaterThanOrEqual(2);
  });
  it('casse le streak après un trou de 2 jours', () => {
    const s = calculateStreakFromWorkouts([workout(0), workout(3)]);
    expect(s).toBe(1);
  });
});

describe('getRankByXP', () => {
  it('couvre les bornes exactes de chaque rang', () => {
    for (const rank of RANKS) {
      expect(getRankByXP(rank.minXP)).toEqual(rank);
    }
  });
  it('ne retourne jamais undefined même à XP négatif ou énorme', () => {
    expect(getRankByXP(-5)).toBeDefined();
    expect(getRankByXP(10_000_000)).toBeDefined();
  });
});
```

```ts
// lib/__tests__/aiPlanner.test.ts
import { calculate1RM, generateWarmupSets } from '@/lib/aiPlanner';

describe('calculate1RM (Epley)', () => {
  it('1 rep = le poids lui-même', () => expect(calculate1RM(100, 1)).toBe(100));
  it('100kg x 5 ≈ 116-117kg', () => {
    expect(calculate1RM(100, 5)).toBeGreaterThan(112);
    expect(calculate1RM(100, 5)).toBeLessThan(120);
  });
  it('reps=0 ne produit pas NaN/Infinity', () => {
    expect(Number.isFinite(calculate1RM(100, 0))).toBe(true);
  });
});

describe('generateWarmupSets', () => {
  it('les charges sont croissantes et < charge de travail', () => {
    const sets = generateWarmupSets(100);
    const weights = sets.map((s) => s.weight);
    expect([...weights].sort((a, b) => a - b)).toEqual(weights);
    expect(Math.max(...weights)).toBeLessThan(100);
  });
});
```

## 2. Tests de composants (React Native Testing Library)

Cibler les composants **avec logique**, pas les purement décoratifs (inutile de tester les cadres Skia).

Priorités : `session/SetRow` (édition poids/reps, complete), `session/RestTimer` (affichage compte à rebours, skip), `gamification/BadgeGrid` (fallback i18n), `ui/Input` + `ui/Button` (états disabled/loading), `onboarding/Stepper` (incrément/bornes).

```tsx
// components/session/__tests__/SetRow.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { SetRow } from '@/components/session/SetRow';

it('appelle onComplete quand on valide la série', () => {
  const onComplete = jest.fn();
  const { getByTestId } = render(
    <SetRow set={{ reps: 8, weight: 60, completed: false, type: 'normal' }}
            index={0} onComplete={onComplete} onUpdate={jest.fn()} />,
  );
  fireEvent.press(getByTestId('set-complete-btn'));
  expect(onComplete).toHaveBeenCalledWith(0);
});
```

(Ajouter des `testID` aux composants au fur et à mesure.)

## 3. Tests d'intégration — flux critiques

Avec stores réels + SQLite mockée (ou DB in-memory) :

1. **Créer → démarrer → compléter → sauvegarder une séance** : `sessionStore.startSession` → `addExercise` → `completeSet` × n → `finishSession` → `workoutStore.addWorkout` → la séance apparaît dans `getWorkoutsThisWeek()` et l'XP augmente.
2. **Persistance de la séance active** (dès que le fix persist est fait) : démarrer, simuler kill/réhydratation, vérifier la reprise.
3. **Sync queue** : write offline → 3 entrées en queue → `flushSyncQueue` avec Supabase mocké → queue vide, `synced=1`.
4. **Migrations** : DB v1 avec données → `runMigrations` → v3 sans perte.
5. **Onboarding complet** → profil sauvé → redirect `(tabs)`.

## 4. Tests E2E — Maestro

```yaml
# .maestro/create-session.yaml
appId: com.gymtrack.mobile
---
- launchApp
- tapOn: "Séance"
- tapOn: "DÉMARRER LA SÉANCE"
- tapOn: "Ajouter un exercice"
- tapOn: "Développé couché"
- inputText: "60"
- tapOn: "Valider la série"
- tapOn: "Terminer"
- assertVisible: "Séance enregistrée"
```

Scénarios à couvrir : onboarding complet (happy path), création de séance ci-dessus, consultation historique + détail workout, changement de langue fr↔en, mode avion (création séance offline).

## 5. Checklist de tests manuels avant CHAQUE release

### Navigation
- [ ] Les 5 tabs s'ouvrent sans crash ; back Android partout
- [ ] `workout/[id]` et `exercise/[id]` depuis chaque point d'entrée
- [ ] Deep link `gymtrack://` ouvre l'app
- [ ] La route `hud-test` n'est PAS accessible (une fois supprimée)

### Cycle séance (cœur du produit)
- [ ] Démarrer / ajouter exercices / compléter séries / timer de repos (haptique + notif OS en background)
- [ ] Terminer → visible dans l'historique avec durée correcte, XP mis à jour
- [ ] Abandonner → aucune trace
- [ ] **Tuer l'app en pleine séance → rouvrir → la séance reprend** (après fix persist)
- [ ] Séance > 1 h : chrono cohérent après passage en background

### Persistance & offline
- [ ] Fermer/rouvrir : workouts, profil, settings, badges vus conservés
- [ ] Mode avion : tout fonctionne, rien ne bloque, pas de spinner infini
- [ ] Retour réseau : la sync draine la queue (vérifier dans Supabase)
- [ ] Login sur un 2e appareil : pull cloud OK

### Cas limites
- [ ] Profil neuf : 0 workout → home, progress, heatmap n'affichent ni NaN ni crash
- [ ] Valeurs extrêmes : 999 kg, 0 rep, 100 séries — pas de crash ni de layout cassé
- [ ] Noms d'exercice longs / emojis / caractères spéciaux
- [ ] Changement d'unités kg↔lbs : conversions cohérentes partout
- [ ] Petit écran (iPhone SE) et grand (Pro Max) : rien de tronqué
- [ ] Notifications refusées au niveau OS : l'app ne re-demande pas en boucle

### Gamification
- [ ] Débloquer un badge → modal une seule fois (pas de répétition au restart)
- [ ] Rank-up → overlay ; PR → célébration
- [ ] Streak correct autour de minuit et après un jour raté

## 6. Non-régression

Tenir ce registre à jour à chaque bug corrigé (aujourd'hui : bugs connus non corrigés) :

| # | Scénario | Origine |
|---|---|---|
| NR-1 | Séance en cours perdue après kill de l'app | `sessionStore` non persisté (audit 2026-07) |
| NR-2 | Timers accumulés après plusieurs séances (batterie/perf) | fuite interval `startSession` (audit 2026-07) |
| NR-3 | Workout sauvé avec `name='Séance'`/`type='strength'` quel que soit le mode choisi | `finishSession` hardcodé (audit 2026-07) |
| NR-4 | Badge re-célébré au redémarrage | vérifier `badgeQueueStore.seenIds` à chaque évolution badges |

## Objectif de couverture

- `lib/gamification.ts` + `lib/aiPlanner.ts` : **≥ 90 %** (pures, faciles, critiques).
- `stores/` : ≥ 70 %. `lib/db.ts` + `lib/sync.ts` : ≥ 60 %.
- Composants UI/écrans : pas d'objectif chiffré — couvrir par E2E Maestro.
- **Global raisonnable : ~50-60 %.** Ne pas courir après le 100 % : la valeur est dans `lib/`.
