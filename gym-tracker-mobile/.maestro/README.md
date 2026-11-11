# Maestro flows (Android emulator, Expo Go)

Real taps on a real Android screen, each step timed. Run in order on a fresh Expo Go:
`01-first-launch` → `02-finish-first-session` → `03-session-actions` → `04-program`.

Setup used (Windows, no admin): portable JDK 17, Android command-line tools, a Pixel 7
image (API 35, `C:\Users\Djell\okilo-tools`), Expo Go 58 installed with adb, the app opened
with `adb reverse tcp:8081 tcp:8081` then `exp://127.0.0.1:8081`, the emulator in French.

    maestro test .maestro/01-first-launch.yaml --debug-output .maestro/debug/01

Expo Go's floating gear sits over « Passer » at first: drag it down once.
A tap takes ~2.1 s under Maestro (its own wait included): compare steps with each other,
not with a human's seconds (those are in journeys/REPORT.md).
