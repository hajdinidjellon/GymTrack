# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project summary

GymTrack — offline-first fitness/workout tracker (React Native + Expo SDK 54, solo dev, freemium iOS/Android). SQLite is the local source of truth; Supabase is an **optional** sync/auth layer. Dark-only, sci-fi HUD design (Skia).

## Detailed docs — read the relevant one before working on that area

| Doc | Contenu |
|---|---|
| [docs/00-ARCHITECTURE.md](docs/00-ARCHITECTURE.md) | Vue d'ensemble, flux de données, conventions de nommage, décisions |
| [docs/01-SETUP.md](docs/01-SETUP.md) | Install, `.env`, lancement, troubleshooting |
| [docs/02-CODING-STANDARDS.md](docs/02-CODING-STANDARDS.md) | Règles TS/composants/styles, template, anti-patterns |
| [docs/03-STATE-MANAGEMENT.md](docs/03-STATE-MANAGEMENT.md) | Les 6 stores, pattern d'écriture canonique, ajout d'état |
| [docs/04-TESTING.md](docs/04-TESTING.md) | Stratégie de tests, exemples, checklist manuelle release |
| [docs/05-SECURITY.md](docs/05-SECURITY.md) | SecureStore, RLS, RGPD (données santé), checklist pré-déploiement |
| [docs/06-DEPLOYMENT.md](docs/06-DEPLOYMENT.md) | EAS build/submit, versioning, OTA, rollback |
| [docs/07-PERFORMANCE.md](docs/07-PERFORMANCE.md) | Assets (56 MB à réduire), re-renders, bundle, profiling |
| [docs/08-ERROR-HANDLING.md](docs/08-ERROR-HANDLING.md) | Error Boundaries, Sentry, règles de catch, offline |
| [docs/09-ROADMAP-TECHNIQUE.md](docs/09-ROADMAP-TECHNIQUE.md) | Dette priorisée : bloquants release / important / plus tard |
| [docs/10-CLAUDE-WORKFLOW.md](docs/10-CLAUDE-WORKFLOW.md) | Workflow de collaboration, pièges déjà rencontrés |

## Project structure

Monorepo root at `GymTrack/`. The app lives entirely in `gym-tracker-mobile/`. SVG body assets are in `public/`.

All commands below must be run from inside `gym-tracker-mobile/`.

## Commands

```bash
npm start            # dev server (Metro, 4 GB heap — required)
npm run android      # target a platform
npm run ios
npm run type-check   # tsc --noEmit — must pass before any commit
npm test             # Jest (jest-expo) — unit tests in lib/__tests__/
```

No linter configured yet (planned — see docs/09 I7). Unit tests cover `lib/gamification` and `lib/aiPlanner`; run them before committing changes to those files.

## Architecture

### Routing — Expo Router v6 (file-based)

```
app/
  _layout.tsx          ← root: DB init, auth gate, redirect, global celebration overlays
  (auth)/              ← welcome, login, register + onboarding (21 screens, flow in lib/onboardingFlow.ts)
  (tabs)/              ← bottom tabs: index (home), session, progress, planner, profile
  workout/[id].tsx     ← detail view for a past workout
  exercise/[id].tsx    ← progression chart for a single exercise
```

Auth gate in `app/_layout.tsx`: initialises SQLite, loads local data (offline-first), then checks Supabase session. Routing depends only on the **local profile** (`welcome` if none, `(tabs)` otherwise) — Supabase auth does not block.

`experiments.typedRoutes = true` is enabled — always use typed `href` values with `router` and `<Link>`.

### State — Zustand stores (`stores/`)

| Store | Responsibility |
|---|---|
| `workoutStore` | Past workouts (CRUD), computed selectors (by id, by exercise, this week) |
| `sessionStore` | Active in-progress session, rest timer (setInterval), haptics on set complete |
| `profileStore` | User profile, PRs, body stats, training goals + gamification selectors |
| `settingsStore` | Units (kg/lbs), rest time defaults, theme, language (AsyncStorage) |
| `badgeQueueStore` | Badge unlock queue + seen-ids dedup (AsyncStorage) |
| `celebrationStore` | Ephemeral overlays: PR, rank-up, weekly-goal toast |

Every write in a store calls the matching `lib/db.ts` function first (SQLite), then triggers `flushSyncQueue()` in the background. **Never invert this order.**

### Data layer

**`lib/db.ts`** — expo-sqlite, offline-first. Data stored as JSON blobs. Schema versioned via `schema_version` table (currently v3, migrations idempotent). Tables: `workouts`, `profile`, `plans`, `goals`, `sync_queue`. Any schema change = new `migrateVn` + bump `SCHEMA_VERSION`.

**`lib/sync.ts`** — Supabase sync. Write local immediately → enqueue op in `sync_queue` → `flushSyncQueue()` drains queue when online. On login: `initialSync()` flushes then pulls cloud (cloud wins on conflicts).

**`lib/gamification.ts`** — Pure functions: XP, streak, rank lookup (`RANKS`), badge evaluation (`BADGES`), muscle heatmap (`getMuscleActivity`), recovery detection (`getRecoveredMuscles`, >48h).

**`lib/aiPlanner.ts`** — Local AI planner (no external API): 1RM (Epley), warmup sets, `SuggestedSession` from recovered muscles + PPL split, linear / 5/3/1 / DUP periodisation.

### Types

Single source of truth: `types/index.ts`. All domain types defined there — `Workout`, `Exercise`, `WorkoutSet`, `ActiveSession`, `Badge`, `Rank`, `TrainingPlan`, etc. Never define domain types elsewhere.

### Design system

Two complementary systems — use whichever fits the context:

- **NativeWind v4** (Tailwind CSS): `className` for layout and spacing. Custom tokens in `tailwind.config.js` (`bg-bg-primary`, `text-brand-primary`, `bg-rank-gold`, etc.)
- **`constants/theme.ts`**: `colors`, `spacing`, `radius`, `typography`, `shadows`, `gradients`, `hud`, `rankPalette`, `rarityPalette`, `motion` for inline `style`, animations, and programmatic colour access.

The app is dark-only (`userInterfaceStyle: dark`, `bg.primary = #080810`).

### Components

Organised by domain under `components/`: `charts/`, `gamification/`, `muscle/`, `onboarding/`, `session/`, `ui/`, `workout/`. Base primitives in `ui/`. **HUD components live in `components/ui/hud/` only** — `components/hud/` is a legacy duplicate slated for merge (docs/09 I2); do not add to it.

## Key conventions

- Path alias `@/` maps to `gym-tracker-mobile/` (configured in `tsconfig.json` and Babel).
- TypeScript strict: `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` are all on. Array index access returns `T | undefined`.
- Supabase is optional at runtime — `isSupabaseConfigured()` guards all cloud calls. The app works fully offline.
- All user-visible strings go through `t()` from `lib/i18n.ts` (fr + en keys required).
- `expo-haptics` calls stay in `sessionStore`, not in components.
- Icons are referenced as string names (e.g. `'dumbbell'`) or `phosphor-react-native`/`Ionicons` — never Lucide.
- New dependencies via `npx expo install` (SDK compatibility), never plain `npm i` for RN libs.
- Bundle identifier: `com.gymtrack.mobile` (iOS and Android).

## Absolute rules — never do

1. Write to a store without writing to SQLite first (breaks offline-first + sync).
2. Call Supabase without the `isSupabaseConfigured()` guard.
3. Hardcode hex colours or UI strings — use `constants/theme.ts` tokens and i18n. Do not create local colour constants (three divergent cyans already exist as debt).
4. Add a timer/listener/subscription without an explicit cleanup path.
5. Change the SQLite schema outside a new versioned migration.
6. Use `any` / `as any` in new code.
7. Store secrets or sensitive data in AsyncStorage or in the repo (`.env.local` only, `EXPO_PUBLIC_*` only).
8. Run `npm audit fix --force` (breaks Expo).
9. Trust code comments describing behaviour (e.g. persistence claims) without verifying against the code — a false "persists to MMKV" comment already caused a critical bug.
