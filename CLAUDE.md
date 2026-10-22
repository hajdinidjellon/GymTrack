# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project structure

Monorepo root at `GymTrack/`. The app lives entirely in `gym-tracker-mobile/`.

All commands below must be run from inside `gym-tracker-mobile/`. `node_modules` is installed from Windows: from WSL, run npm through `cmd.exe /c "cd /d C:\...\gym-tracker-mobile && ..."`.

## Commands

```bash
npm run dev          # Metro on the LAN, cache cleared (same Wi-Fi as the phone, Expo Go SDK 57)
npm run tunnel       # Metro through an Expo tunnel, when the phone is not on the same network
npm run check        # everything CI runs: lint, format:check, type-check, test:coverage
npm run lint         # ESLint, including the layer rules below
npm run format       # Prettier
npm test             # Jest: "domain" project (Node) + "app" project (jest-expo)
```

CI: `.github/workflows/mobile-ci.yml` (quality, iOS bundle export, npm audit + gitleaks).
Branches, commits and PRs: see `CONTRIBUTING.md`.

## Product

"Tu charges. On calcule." — an autopilot logger. The app picks today's session from the program, computes every target with the progression engine, shows the plates to load per side, and the user mostly just taps "Valider". Voice cues (expo-speech) announce the next exercise, the plates and the end of rest.

## Architecture

### Routing — Expo Router (file-based, typed routes)

```
app/
  _layout.tsx              ← fonts, SQLite init, local data load (offline-first)
  (onboarding)/            ← welcome, login, goal, program (goal/program also used from Profile with ?edit=1)
  (tabs)/                  ← index (Aujourd'hui), progress, profile; _layout gates on profile and resumes a running session
  session/preview.tsx      ← today's session, "Lancer la séance"
  session/index.tsx        ← the logger: set / rest / calibration views, driven by sessionStore state
  session/summary.tsx      ← tonnage, next targets
  exercise/[name].tsx      ← next target, rule, increment picker, history
```

### Layers — enforced by ESLint (`import/no-restricted-paths`)

```
types/      shared types, no imports
domain/     pure TypeScript, no React / RN / Expo / I/O. Runs under Node in tests.
services/   side effects: SQLite, Supabase, notifications, speech, encrypted storage, logger
stores/     Zustand state; applies domain transitions, then triggers services
hooks/      React hooks over stores and domain
components/ UI, never imports app/
app/        routes only
```

A layer never imports a layer above it. Always import with `@/`.

### Domain (`domain/`)

- `progression.ts` — double progression engine (`nextTargets`).
- `programs.ts` — exercise catalog (equipment, old-name aliases), splits, rules per goal.
- `sessionBuilder.ts` — next day of the program, per-lift plan, conversion to `ActiveExercise`.
- `session.ts` — pure transitions of the running session (complete set, rest, to workout).
- `schemas.ts` — zod schemas; everything read from disk or the cloud is validated here.
- `profile.ts`, `week.ts`, `plates.ts`, `sessionCursor.ts`, `voiceLines.ts`, `format.ts`.

### Services (`services/`)

- `db.ts` — SQLite, JSON blobs, parameterised queries, transactions, validated reads.
- `sync.ts` — Supabase queue; an entry is dropped only once Supabase confirmed it.
- `supabase.ts` + `secureStorage.ts` — auth session encrypted (AES key in the Keychain).
- `logger.ts` — dev-only logs. `console.*` is banned elsewhere.

### State — Zustand stores (`stores/`)

| Store | Responsibility |
|---|---|
| `sessionStore` | Running session, persisted in `expo-sqlite/kv-store`. Absolute timestamps, no per-second tick. All haptics, voice and rest notifications start here. |
| `workoutStore` | Past workouts (SQLite) |
| `profileStore` | Goal, program, PRs. Normalizes profiles from the old app version. |
| `settingsStore` | Rest time, voice, bar weight, gym plates, per-exercise increments. Validated on load. |

### Tests

- `domain/__tests__` — table tests of the pure logic. Coverage gate ≥ 95 %.
- `services/__tests__`, `stores/__tests__` — mocked native modules (`jest.setup.ts`).
- `components/__tests__` — React Native Testing Library v14 (`render` and `fireEvent` are async).

### Design system — "Disques"

`constants/theme.ts`: one forest green, one cream, Bricolage Grotesque. No accent colours, no glow, no Skia. Styles are plain `style` props using the tokens. Base components in `components/ui/`, plate drawings in `components/disc/`, session views in `components/session/`. Mockups: claude.ai artifact "Maquette complète · G · Disques".

## Key conventions

- Path alias `@/` maps to `gym-tracker-mobile/`.
- TypeScript strict with `noUncheckedIndexedAccess`.
- Code in English; comments short, in plain French or English, only where they help.
- Supabase is optional at runtime — `isSupabaseConfigured()` guards cloud calls. Data isolation relies on RLS.
- `jest-expo` needs `expo-modules-core` hoisted: it is a devDependency on purpose.
- Bundle identifier: `com.gymtrack.mobile`.
