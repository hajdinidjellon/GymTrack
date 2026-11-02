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

"Tu charges. On calcule." — an autopilot logger. The app picks today's session from the program, computes every target with the progression engine, shows the plates to load per side, and the user mostly just taps "Valider". Voice cues (expo-speech) announce the next exercise, the plates and the end of rest. A bell (`services/sound.ts`, expo-audio, rings on silent) marks the end of rest in the app; in the background the rest notification plays the same `assets/sounds/rest-bell.wav`. `settings.restBell` turns both off.

## Architecture

### Routing — Expo Router (file-based, typed routes)

```
app/
  _layout.tsx              ← fonts, SQLite init, local data load (offline-first)
  (onboarding)/            ← welcome, setup (the 4 first-launch questions + recap), login; goal/program edit from Profile (?edit=1)
  (tabs)/                  ← index (Aujourd'hui), progress, profile; _layout gates on profile and resumes a running session
  session/preview.tsx      ← today's session, "Lancer la séance"
  session/index.tsx        ← the logger: set / rest / calibration views, driven by sessionStore state; the last set opens SessionDone (effort, undo, one more set, then save)
  session/summary.tsx      ← tonnage, next targets
  exercise/[name].tsx      ← next target, own sets/reps (RuleEditor), plate-loaded or stack, increment picker, history
  history/index.tsx        ← "Historique": every past session, newest first (home → Dernière séance → Historique)
  history/[id].tsx         ← one past session: each exercise, set by set (weight × reps, effort), records
  days/index.tsx           ← "Mes séances": every day of the program, "+ Nouvelle séance" adds one's own (Profil → Mes séances)
  days/[name].tsx          ← one day: add, remove, drag to reorder its exercises, "+ superset" chains one with the next
  data/index.tsx           ← "Tes données": backup, restore, import from Strong or Hevy, CSV export (Profil → Sauvegarde, import)
```

### Layers — enforced by ESLint (`import/no-restricted-paths`)

```
types/      shared types, no imports
i18n/       every text in French (source) and English, t() with typed keys; pure like domain/
domain/     pure TypeScript, no React / RN / Expo / I/O. Runs under Node in tests.
services/   side effects: SQLite, Supabase, notifications, speech, encrypted storage, logger
stores/     Zustand state; applies domain transitions, then triggers services
hooks/      React hooks over stores and domain
components/ UI, never imports app/
app/        routes only
```

A layer never imports a layer above it. Always import with `@/`.

### Domain (`domain/`)

- `progression.ts` — double progression engine (`nextTargets`), lighter comeback after 2+ weeks off. The last set's effort steers the reps: easy = +2, all-out = same target once.
- `effort.ts` — "Comment c'était ?" after a set: Facile / Juste bien / À fond, stored as RPE.
- `programs.ts` — exercise catalog (equipment, old-name aliases), splits, rules per goal.
- `sessionBuilder.ts` — next day of the program, per-lift plan, conversion to `ActiveExercise`.
- `session.ts` — pure transitions of the running session (complete set, rest, to workout).
- `schemas.ts` — zod schemas; everything read from disk or the cloud is validated here.
- `programSwitch.ts` — off-program sessions: `choosableDays` (programs.ts) adds the other programs' days (Haut, Bas, Full body) for a one-off; they keep each exercise's progression and do not move the rotation. Three in a row from the same other program: the home offers to switch (`settings.programSwitchDismissed` after a no).
- `ruleSync.ts` — sets/reps shared with similar exercises (same main muscle and kind of movement): the ones on the same rule follow a change.
- `rest.ts` — rest per exercise: the user's choice, else the rest they really take (measured between validations), else the kind of exercise.
- `insights.ts` — "Ce que l'app sait de toi": time of day, usual days, duration, rhythm, rests, strongest lift.
- `exportCsv.ts` — every set as CSV for the share sheet.
- `loading.ts` — what the weight counts: the whole bar, each side of a plate-loaded machine (chest press, leg press…), each dumbbell, or the stack; the plates for one side.
- `notes.ts` — the per-exercise note ("siège cran 4"), one clean line.
- `warmup.ts` — warm-up sets before the working sets: empty bar then ~40/60/80 % of the first working weight, rounded to the gym's plates; one closer set on a muscle already warm, none on timed or bodyweight work. `setNumber` numbers warm-ups, drop sets and working sets apart. Warm-ups never count (`workingSets`).
- `hold.ts` — the timer of a held set (plank…): 3 s countdown, then the hold. Timed exercises (`timed`) count seconds in `reps`, progress by `rule.repStep` (5 s).
- `strength.ts` — estimated 1RM (Epley, ≤ 12 reps) and records per number of reps, for the exercise page.
- `backup.ts` — the backup file (JSON, validated on restore), merging sessions by id.
- `importWorkouts.ts` — Strong and Hevy CSV exports to sessions; names matched to the catalog only when movement and equipment agree.
- `ownDays.ts` — days the user adds to a program (`settings.ownDays`): named, renamed, removed; an empty one is never the next session (`hasExercises`).
- `ownExercises.ts` — editing or deleting an own exercise; a rename moves every setting under the name and keeps the old name as an alias.
- `voiceCommands.ts` — what a few spoken words mean ("fait", "8", "plus tard"…); more than 4 words is never a command.
- Drop sets (`setType: 'drop'`) never steer progression (`mainSets`). Supersets: exercises with the same `superset` group take turns (`sessionCursor`), no rest inside a round (`supersetHandoff`).
- `profile.ts`, `week.ts`, `plates.ts`, `sessionCursor.ts`, `voiceLines.ts`, `format.ts`.

### Services (`services/`)

- `db.ts` — SQLite, JSON blobs, parameterised queries, transactions, validated reads.
- `sync.ts` — Supabase queue; an entry is dropped only once Supabase confirmed it.
- `supabase.ts` + `secureStorage.ts` — auth session encrypted (AES key in the Keychain).
- `logger.ts` — dev-only logs. `console.*` is banned elsewhere.
- `files.ts` — write a file and open the share sheet, or pick one (expo-file-system, expo-sharing).
- `voiceInput.ts` — on-device speech recognition for the voice commands; the native module is loaded only when it exists (not in Expo Go). `speech.ts` tells when the app itself is talking, so its voice is never taken for a command.

### State — Zustand stores (`stores/`)

| Store | Responsibility |
|---|---|
| `sessionStore` | Running session, persisted in `expo-sqlite/kv-store`. Absolute timestamps, no per-second tick. All haptics, voice and rest notifications start here. |
| `workoutStore` | Past workouts (SQLite) |
| `profileStore` | Goal, program, PRs. Normalizes profiles from the old app version. |
| `settingsStore` | Rest time, voice, bar weight, gym plates, per-exercise increments, own exercises per day (`customDays`, key `"ppl/Legs"`) and own sets/reps per exercise (`ruleOverrides`), own rest per exercise (`restOverrides`), own exercises (`customExercises`), a note per exercise (`exerciseNotes`, read by the voice), plate-loaded or stack machine per exercise (`plateLoaded`, over the catalog's), warm-ups on/off globally and per exercise (`warmups`, `warmupOverrides`), supersets per day (`supersets`, key `"ppl/Push"`), voice commands (`voiceCommands`, off by default). Totals count both sides and both dumbbells when `countBothSides` is on. Validated on load. |

### Tests

- `domain/__tests__` — table tests of the pure logic. Coverage gate ≥ 95 %.
- `services/__tests__`, `stores/__tests__` — mocked native modules (`jest.setup.ts`).
- `components/__tests__` — React Native Testing Library v14 (`render` and `fireEvent` are async).

### Design system — "Autocollant" (clarté + style illustré)

`constants/theme.ts`: `paper` background, white `card`s, everything outlined and shadowed in `ink`. Fredoka for titles, numbers and buttons (`weight="black"` / `"titleMedium"`), Nunito for the rest. No capitals except the sets table column headers.

- `coral` = main action and "current" state: one coral button per screen. `coralSoft` = the hero card (one per screen) and the current set/selection.
- `sun` = explanations ("Pourquoi 80 kg ?"), the rest panel, badges. `success` / `successSoft` = sets done.
- Plate colours (`plateColor(kg)`, IWF: 25 red, 20 blue, 15 yellow, 10 green, 5 white) are for plates only.
- Sticker style: `border.strong` (3) on cards and big buttons, `border.base` (2.5) elsewhere; `hardShadow(5 | 4 | 2)` = offset ink shadow, no blur. A pressed button sinks onto its shadow. Empty or upcoming things are dashed `line`. `Sparkle`: 2 max per screen, hero card or celebration only.
- Clarity: the main action sits at the bottom, under the thumb. The logger never changes screen: the rest opens as a popup in the middle (it can be minimized to a bar at the bottom, or closed). Weight and reps can be typed; sets are added below the table and swiped left to delete. A validated set carries its weight and reps over to the next ones. Exercise pills at the top: tap a waiting one to do it now (machine freed up), "Plus tard" sends the current one to the end (machine taken). The "+" after the pills adds an exercise at the end. Current set circled in the sets table. Everything the app computed is pre-filled.

Base components in `components/ui/` (`StickerButton`, `StickerCard`, `Chip`, `Choice`, `Sparkle`, `PressableScale` for tappable cards, `FadeIn` for screen entrance), plates in `components/disc/`, charts in `components/stats/`, session views in `components/session/` (`SetView` + `SetRow`/`SetsTable`, `RestView`).

## Key conventions

- Path alias `@/` maps to `gym-tracker-mobile/`.
- No user-visible text in code: `t('ns.key', params)` from `@/i18n`, French in `i18n/fr/<ns>.ts`, English in `i18n/en/<ns>.ts` (same keys, a test checks). Exercise and program day names are stored in French: show them through `exerciseName()` / `dayName()`. Every route calls `useLocale()`. Language: `settings.language` (`auto` follows the phone).
- TypeScript strict with `noUncheckedIndexedAccess`.
- Code in English; comments short, in plain French or English, only where they help.
- Supabase is optional at runtime — `isSupabaseConfigured()` guards cloud calls. Data isolation relies on RLS.
- `jest-expo` needs `expo-modules-core` hoisted: it is a devDependency on purpose.
- Bundle identifier: `com.gymtrack.mobile`.
