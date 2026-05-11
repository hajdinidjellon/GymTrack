# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project structure

Monorepo root at `GymTrack/`. The app lives entirely in `gym-tracker-mobile/`. SVG body assets are in `public/`.

All commands below must be run from inside `gym-tracker-mobile/`.

## Commands

```bash
# Start dev server (Metro, 4 GB heap)
npm start

# Start targeting a specific platform
npm run android
npm run ios

# TypeScript check (no emit)
npm run type-check
```

There is no test suite and no linter configured yet.

## Architecture

### Routing — Expo Router v6 (file-based)

```
app/
  _layout.tsx          ← root: DB init, auth gate, redirect logic
  (auth)/              ← login, register, onboarding (3-step: goal → level → PRs)
  (tabs)/              ← bottom tabs: index (home), session, progress, planner, profile
  workout/[id].tsx     ← detail view for a past workout
  exercise/[id].tsx    ← progression chart for a single exercise
```

Auth gate in `app/_layout.tsx`: initialises SQLite, loads local data (offline-first), then checks Supabase session. Redirects to `/(auth)/login`, `/(auth)/onboarding/goal`, or `/(tabs)` depending on state.

`experiments.typedRoutes = true` is enabled — always use typed `href` values with `router` and `<Link>`.

### State — Zustand stores (`stores/`)

| Store | Responsibility |
|---|---|
| `workoutStore` | Past workouts (CRUD), computed selectors (by id, by exercise, this week) |
| `sessionStore` | Active in-progress session, rest timer (setInterval), haptics on set complete |
| `profileStore` | User profile, PRs, body stats, training goals |
| `settingsStore` | Units (kg/lbs), rest time defaults, theme, language |

Every write in a store calls the matching `lib/db.ts` function first (SQLite), then triggers `flushSyncQueue()` in the background.

### Data layer

**`lib/db.ts`** — expo-sqlite, offline-first. Data is stored as JSON blobs in columns. Schema versioned via `schema_version` table (currently v3). Tables: `workouts`, `profile`, `plans`, `goals`, `sync_queue`.

**`lib/sync.ts`** — Supabase sync. Strategy: write local immediately → enqueue op in `sync_queue` → `flushSyncQueue()` drains queue to Supabase when online. On login: `initialSync()` flushes queue then pulls cloud (cloud wins on conflicts).

**`lib/gamification.ts`** — Pure functions: XP calculation, streak, rank lookup (`RANKS` array), badge evaluation (`BADGES` array with `condition` predicates), muscle activity heatmap (`getMuscleActivity`), recovery detection (`getRecoveredMuscles`, >48h threshold).

**`lib/aiPlanner.ts`** — Local AI planner (no external API). Generates `SuggestedSession` based on recovered muscles + PPL split, or returns next session from active `TrainingPlan`. Implements linear, 5/3/1, and DUP periodisation algorithms.

### Types

Single source of truth: `types/index.ts`. All domain types defined there — `Workout`, `Exercise`, `WorkoutSet`, `ActiveSession`, `Badge`, `Rank`, `TrainingPlan`, etc.

### Design system

Two complementary systems — use whichever fits the context:

- **NativeWind v4** (Tailwind CSS): use `className` prop for layout and spacing. Custom tokens defined in `tailwind.config.js` (`bg-bg-primary`, `text-brand-primary`, `bg-rank-gold`, etc.)
- **`constants/theme.ts`**: use `colors`, `spacing`, `radius`, `typography`, `shadows` for inline `style` props, animations, and programmatic colour access (e.g. heatmap, rank colours).

The app is dark-only (`userInterfaceStyle: dark`, `bg.primary = #080810`).

### Components

Organised by domain under `components/`: `charts/`, `gamification/`, `muscle/`, `session/`, `ui/`. The `ui/` folder contains base primitives (`Button`, `Card`, `Input`, `Badge`, `StatCard`, `ProgressBar`).

## Key conventions

- Path alias `@/` maps to `gym-tracker-mobile/` (configured in `tsconfig.json` and Babel).
- TypeScript strict: `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` are all on. Array index access returns `T | undefined`.
- Supabase is optional at runtime — `isSupabaseConfigured()` guards all cloud calls. The app works fully offline.
- `expo-haptics` is used for feedback on set completion and rest timer end — keep haptic calls in `sessionStore`, not in components.
- Icons are referenced as string names (e.g. `'dumbbell'`, `'crown'`) — not Lucide imports, which are not available in React Native.
- Bundle identifier: `com.gymtrack.mobile` (iOS and Android).
