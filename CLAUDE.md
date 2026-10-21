# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project structure

Monorepo root at `GymTrack/`. The app lives entirely in `gym-tracker-mobile/`.

All commands below must be run from inside `gym-tracker-mobile/`. `node_modules` is installed from Windows: from WSL, run npm through `cmd.exe /c "cd /d C:\...\gym-tracker-mobile && ..."`.

## Commands

```bash
npm start            # Metro (4 GB heap), test with Expo Go SDK 57
npm run type-check   # tsc --noEmit
npm test             # Jest, node env, pure logic only (lib/__tests__)
```

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

### Domain logic (`lib/`, pure and tested)

- `progression.ts` — double progression engine (`nextTargets`).
- `programs.ts` — exercise catalog (with equipment and old-name aliases), splits (PPL / Haut-Bas / Full body), rules per goal.
- `sessionBuilder.ts` — next day of the program, per-lift plan, conversion to `ActiveExercise`.
- `plates.ts` — plates per side for a weight, French number formatting.
- `sessionCursor.ts` — current exercise/set of a running session.
- `voice.ts` — spoken lines.

### State — Zustand stores (`stores/`)

| Store | Responsibility |
|---|---|
| `sessionStore` | Running session, persisted in `expo-sqlite/kv-store` (survives app kills). Absolute timestamps, no per-second tick. All haptics, voice and rest notifications start here. |
| `workoutStore` | Past workouts (SQLite) |
| `profileStore` | Goal, program, PRs. Normalizes profiles from the old app version. |
| `settingsStore` | Rest time, voice, bar weight, gym plates, per-exercise increments |

`lib/db.ts` (SQLite, JSON blobs) and `lib/sync.ts` (Supabase queue, optional) are unchanged from the previous version.

### Design system — "Disques"

`constants/theme.ts`: one forest green, one cream, Bricolage Grotesque. No accent colours, no glow, no Skia. Styles are plain `style` props using the tokens. Base components in `components/ui/`, plate drawings in `components/disc/`, session views in `components/session/`. Mockups: claude.ai artifact "Maquette complète · G · Disques".

## Key conventions

- Path alias `@/` maps to `gym-tracker-mobile/`.
- TypeScript strict with `noUncheckedIndexedAccess`.
- Code in English; comments short, in plain French or English, only where they help.
- Supabase is optional at runtime — `isSupabaseConfigured()` guards cloud calls.
- Bundle identifier: `com.gymtrack.mobile`.
