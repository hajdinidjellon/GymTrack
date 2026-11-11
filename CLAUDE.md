# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project structure

Monorepo root (the app was first called GymTrack, the folders kept that name). The app lives entirely in `gym-tracker-mobile/`.

All commands below must be run from inside `gym-tracker-mobile/`. `node_modules` is installed from Windows: from WSL, run npm through `cmd.exe /c "cd /d C:\...\gym-tracker-mobile && ..."`.

## Commands

```bash
npm run dev          # Metro on the LAN, cache cleared (same Wi-Fi as the phone, Expo Go SDK 57)
npm run tunnel       # Metro through an Expo tunnel, when the phone is not on the same network
npm run check        # everything CI runs: lint, format:check, type-check, test:coverage
npm run lint         # ESLint, including the layer rules below
npm run format       # Prettier
npm test             # Jest: "domain" project (Node) + "app" project (jest-expo)
npm run seed:personas  # (re)builds the test accounts on the Supabase project of .env.local; passwords in test-accounts.local.md (git-ignored). SEED_DRY=1: build only
```

CI: `.github/workflows/` — `ci.yml` (lint, types, tests, expo-doctor, iOS and Android bundles, native fingerprint on PRs; `CI ok` is the required check), `security.yml` (CodeQL, npm audit, dependency review, gitleaks), `pr.yml` (conventional title, labels, actionlint), `release.yml` (tag `v*` → GitHub release + EAS build). Actions pinned by SHA.
Branches, commits and PRs: see `CONTRIBUTING.md`.

## Product

"Tu charges. On calcule." — an autopilot logger. The app picks today's session from the program, computes every target with the progression engine, shows the plates to load per side, and the user mostly just taps "Valider". Voice cues (expo-speech) announce the next exercise, the plates and the end of rest. In the app, the end of rest is an alarm like a kitchen timer (`startRestAlarm` in `services/sound.ts`): it vibrates over and over and rings the bell in a loop (expo-audio, rings on silent) until a tap on `components/session/RestAlarm.tsx`, any touch to the session, or 30 s; the voice then says the next set. App left during a rest (another app, phone locked), an iPhone on iOS 26 gets a real alarm instead (`services/alarmKit.ts`, AlarmKit through the local module `modules/okilo-alarm`): full screen over any app, rings on silent, "Arrêter" and "Ouvrir Okilo"; an app cannot bring itself to the front on iOS, that button is the closest. Elsewhere (Expo Go, Android, older iOS) the rest notification plays the same `assets/sounds/rest-bell.wav`. `settings.restBell` turns the bell off (the vibrations stay).

## Architecture

### Routing — Expo Router (file-based, typed routes)

```
app/
  _layout.tsx              ← fonts, SQLite init, local data load (offline-first)
  (onboarding)/            ← welcome, setup (the 7 first-launch questions + recap), login; goal/program edit from Profile (?edit=1)
  (tabs)/                  ← index (Aujourd'hui), progress, profile; _layout gates on profile and resumes a running session
  session/preview.tsx      ← today's session, "Lancer la séance"
  session/index.tsx        ← the logger: set / rest / calibration views, driven by sessionStore state; the last set opens SessionDone (what was done, effort, undo, one more set, then save); « Terminer » asks in the app's `ActionSheet` (discard in red, apart, confirmed again)
  session/summary.tsx      ← tonnage, next targets
  exercise/[name].tsx      ← next target, own sets/reps (RuleEditor), plate-loaded or stack, increment picker, history
  history/index.tsx        ← "Historique": every past session, newest first (home → Dernière séance → Historique)
  history/[id].tsx         ← one past session: each exercise, set by set (weight × reps, effort), records
  days/index.tsx           ← "Mes séances": every day of the program, "+ Nouvelle séance" adds one's own (Profil → Mes séances)
  days/[name].tsx          ← one day: add, remove, drag to reorder its exercises, "+ superset" chains one with the next
  settings/gym.tsx         ← "Ma salle": bar, collars, plates, machine steps, « Compter les 2 côtés » (Profil → Réglages)
  settings/app.tsx         ← "Application": language and appearance, applied at once (Profil → Réglages)
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

- `progression.ts` — double progression engine (`nextTargets`), lighter comeback after 2+ weeks off. The last set's effort steers the reps: easy = +2, all-out = same target once. Only the planned working sets decide (`readSession`): top sets/singles heavier for fewer reps are kept as is (`SetTarget.top`), bonus sets never block, a max test has no working weight. Deload/comeback never go under the empty bar (`minWeight`) nor to 0; when nothing lighter makes sense, `ease` lowers the reps to what was done. Assisted machines (`assisted`) progress by taking help away.
- `effort.ts` — "Comment c'était ?" after a set: Facile / Juste bien / À fond, stored as RPE.
- `catalog/` — the exercise catalog, one file per body part (`define.ts` helpers: `withPlates`, `onCable`, `onSmith`, `kettlebell`, `held`), `EXERCISES` and `POPULARITY` (the order every exercise list is offered in, most known first; the user's own exercises before). Names are stored and never renamed: add an alias.
- `catalog/regions.ts` — the part of the main muscle each exercise works (haut/milieu/bas des pecs, dorsaux, trapèzes…): the picker's second row of tabs. Every catalog exercise of a muscle with regions has one (a test checks); an own exercise keeps the one it was created in (`CustomExercise.region`). Arms and calves have none.
- `programs.ts` — catalog lookups (search by French, English and old names, `byPopularity`, `alternativesFor`), splits, rules per goal.
- `sessionBuilder.ts` — next day of the program, per-lift plan, conversion to `ActiveExercise`.
- `session.ts` — pure transitions of the running session (complete set, rest, to workout). `firstSetAfterStart`: a first weight chosen with no warm-up before it logs its first set in the same tap (« Série faite : 20 kg × 10 », `startAndLog`).
- `schemas.ts` — zod schemas; everything read from disk or the cloud is validated here.
- `programSwitch.ts` — off-program sessions: `choosableDays` (programs.ts) adds the other programs' days (Haut, Bas, one `EXTRA_FULL_BODY` instead of A and B) and « Ma séance » (`OWN_SESSION`), the one the user fills in, saved under their program and offered even empty (`isOffered`), for a one-off; they keep each exercise's progression and do not move the rotation. Three in a row from the same other program: the home offers to switch (`settings.programSwitchDismissed` after a no).
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
- `importWorkouts.ts` — Strong and Hevy CSV exports to sessions; names matched to the catalog from the Hevy and Strong names it knows (`catalog/importNames.ts`), else only when movement and equipment agree (the word in brackets: Barbell, Cable, Smith Machine…).
- `ownDays.ts` — days the user adds to a program (`settings.ownDays`): named, renamed, removed; an empty one is never the next session (`hasExercises`).
- `customProgram.ts` — « Mon programme » (split `custom`): the user names the program (`settings.programName`) and every session (`ownDays.custom`), from nothing or copied from another program with its exercises (`draftFrom`, `customProgramSettings`). Asked in the onboarding (« Autre ») and in Profil → Programme. `programTitle` shows its name. It keeps one session at least and never gets the switch suggestion.
- `nicknames.ts` — the user's own name for a catalog exercise (`settings.exerciseNicknames`): `exerciseName()` shows it everywhere (voice included) and the search finds it; `catalogName()` is the exercise's own name. History and progression are keyed by the stored name, unchanged.
- `ownExercises.ts` — editing or deleting an own exercise; a rename moves every setting under the name and keeps the old name as an alias.
- `voiceCommands.ts` — what a few spoken words mean ("fait", "8", "plus tard"…); more than 4 words is never a command.
- Drop sets (`setType: 'drop'`) never steer progression (`mainSets`). Supersets: exercises with the same `superset` group take turns (`sessionCursor`), no rest inside a round (`supersetHandoff`).
- `onboarding.ts` — the first-launch answers (a one-choice question goes on by itself, `ADVANCE_MS` in `OnboardingFlow`) (goal, about you, experience, rhythm, program, session time, gym), the plain-language programs (`PROGRAM_CHOICES`), and `calibrationPreset`: the first weight offered from experience, sex, age group and body weight, all optional.
- `gyms.ts` — the gym chains (Basic-Fit, Fitness Park, L'Orange Bleue, Keepcool first, then a search): bar, plates and the machines' steps (`settings.stackStep`, `settings.cableStep`, used by `defaultIncrementFor`), a correctable starting point.
- A program day that runs over the user's usual session time (`profile.sessionMinutes`) loses its last exercises, 3 at least (`fitToTime`); a day the user set up stays whole.
- `profile.ts`, `week.ts`, `plates.ts`, `sessionCursor.ts`, `voiceLines.ts`, `format.ts`.

### Services (`services/`)

- `db.ts` — SQLite, JSON blobs, parameterised queries, transactions, validated reads.
- `sync.ts` — Supabase queue; an entry is dropped only once Supabase confirmed it.
- `supabase.ts` + `secureStorage.ts` — auth session encrypted (AES key in the Keychain).
- `logger.ts` — dev-only logs. `console.*` is banned elsewhere.
- `files.ts` — write a file and open the share sheet, or pick one (expo-file-system, expo-sharing).
- `alarmKit.ts` — the end of the rest as an AlarmKit alarm when the app is off screen. Native code in `modules/okilo-alarm/` (Swift, iOS 26+, weakly linked); its config plugin adds the permission text and registers the "Ouvrir Okilo" App Intent in the app target. Only in a build: test it with EAS, not Expo Go.
- `lockScreenTaps.ts` — "Valider" on the lock screen (Live Activity, `hooks/useLiveActivity.ts`) with the app asleep or closed. The button's intent runs in the app's process but only JS heard it: `OkiloLockScreenTaps` (app delegate subscriber in `modules/okilo-alarm`) now queues the tap natively, swaps in the screen the app worked out ahead (`lockScreenState` in `domain/lockScreen.ts`: `set`, `next` two taps deep, the last one without a button) with the rest starting at the tap, and schedules the rest's AlarmKit alarm. The app replays the queue on launch, on the button event and back on screen (`completeSet(…, at)`: rest from the tap, quiet when late). Build only.
- `voiceInput.ts` — on-device speech recognition for the voice commands; the native module is loaded only when it exists (not in Expo Go). `speech.ts` tells when the app itself is talking, so its voice is never taken for a command.

### State — Zustand stores (`stores/`)

| Store | Responsibility |
|---|---|
| `sessionStore` | Running session, persisted in `expo-sqlite/kv-store`. Absolute timestamps, no per-second tick. All haptics, voice and rest notifications start here; the notification permission is asked at a session's first rest. |
| `workoutStore` | Past workouts (SQLite) |
| `profileStore` | Goal, program, PRs. Normalizes profiles from the old app version. |
| `settingsStore` | Rest time, voice, bar weight, gym plates, per-exercise increments, own exercises per day (`customDays`, key `"ppl/Legs"`) and own sets/reps per exercise (`ruleOverrides`), own rest per exercise (`restOverrides`), own exercises (`customExercises`), a note per exercise (`exerciseNotes`, read by the voice), plate-loaded or stack machine per exercise (`plateLoaded`, over the catalog's), warm-ups on/off globally and per exercise (`warmups`, `warmupOverrides`), supersets per day (`supersets`, key `"ppl/Push"`), voice commands (`voiceCommands`, off by default). Totals count both sides and both dumbbells when `countBothSides` is on. Validated on load. |

### Tests

- `domain/__tests__` — table tests of the pure logic. Coverage gate ≥ 95 %.
- `services/__tests__`, `stores/__tests__` — mocked native modules (`jest.setup.ts`).
- `components/__tests__` — React Native Testing Library v14 (`render` and `fireEvent` are async).

### Design system — "Autocollant" (clarté + style illustré)

`constants/theme.ts`: `paper` background, white `card`s, everything outlined and shadowed in `ink`. Light and dark palettes (`settings.theme`: auto / light / dark): `colors.x` reads the current one, so read it at render time, never in a module-level constant; routes re-render through `useLocale()`. Dark is « Bleu nuit » (night-blue background, blue-tinted cards, sky-blue action, green done marks, yellow trained days, a ledge under each sticker; every sticker outlined in black, like by day): never assume the light pairs, use the roles — `outline`/`outlineStrong` for borders of what can be tapped, `frame` for cards, panels and badges, `inset` for what sits inside a card (a step lighter at night), `drawn` for the ink line of drawings (plates, bar, logo, sparkles: dark in both modes), `dayDone`/`dayToday` for the week strip, `onCoral`, `onSun`, `onSuccess` for what sits on a fill, `sunPanel`/`onSunPanel` for explanation panels, `danger` for errors, `hardShadow()`/`pressOffset()` for relief. Plates keep their IWF colours in both modes. Fredoka for titles, numbers and buttons (`weight="black"` / `"titleMedium"`), Nunito for the rest. No capitals except the sets table column headers.

- `coral` = main action and "current" state: one coral button per screen. `coralSoft` = the hero card (one per screen) and the current set/selection.
- `sun` = explanations ("Pourquoi 80 kg ?"), the rest panel, badges. `success` / `successSoft` = sets done.
- Plate colours (`plateColor(kg)`, IWF: 25 red, 20 blue, 15 yellow, 10 green, 5 white) are for plates only.
- Sticker style: `border.strong` (3) on cards and big buttons, `border.base` (2.5) elsewhere; `hardShadow(5 | 4 | 2)` = offset ink shadow, no blur. A pressed button sinks onto its shadow. Empty or upcoming things are dashed `line`. `Sparkle`: 2 max per screen, hero card or celebration only.
- Clarity: the main action sits at the bottom, under the thumb. The logger never changes screen: the rest opens as a popup in the middle (it can be minimized to a bar at the bottom, or closed). Weight and reps can be typed; sets are added below the table and swiped left to delete. A validated set carries its weight and reps over to the next ones. Exercise pills at the top: tap a waiting one to do it now (machine freed up), "Plus tard" sends the current one to the end (machine taken). The "+" after the pills adds an exercise at the end. A catalog exercise shows its video top right, small and looping (`DemoThumb`); a tap opens it big from the bottom. Current set circled in the sets table. Everything the app computed is pre-filled.

Base components in `components/ui/` (`StickerButton`, `StickerCard`, `Chip`, `Choice`, `Sparkle`, `PressableScale` for tappable cards, `FadeIn` for screen entrance, `ScreenHeader back` for the round back arrow on the title's line, `Input` for one-line fields: it draws the placeholder centred, iOS draws its own too low), plates in `components/disc/`, charts in `components/stats/`, session views in `components/session/` (`SetView` + `SetRow`/`SetsTable`, `RestView`).

## Key conventions

- Path alias `@/` maps to `gym-tracker-mobile/`.
- No user-visible text in code: `t('ns.key', params)` from `@/i18n`, French in `i18n/fr/<ns>.ts`, English in `i18n/en/<ns>.ts` (same keys, a test checks). Exercise and program day names are stored in French: show them through `exerciseName()` / `dayName()`. Every route calls `useLocale()`. Language: `settings.language` (`auto` follows the phone).
- TypeScript strict with `noUncheckedIndexedAccess`.
- Code in English; comments short, in plain French or English, only where they help.
- Supabase is optional at runtime — `isSupabaseConfigured()` guards cloud calls. Data isolation relies on RLS.
- `jest-expo` needs `expo-modules-core` hoisted: `expo` brings it at the top of `node_modules`. Never add it to package.json (expo-doctor fails in CI); native peer dependencies (`expo-asset` for `expo-audio`) are installed directly.
- App name: Okilo. Bundle identifier and Android package: `app.okilo`, App Group `group.app.okilo`, URL scheme `okilo://`. The EAS slug and the storage names (`gymtrack.db`, `@gymtrack/settings`, `users.gymtrack.app`) keep the first name on purpose: changing them would unlink EAS or lose data. Backups saved as `gymtrack` still restore.
