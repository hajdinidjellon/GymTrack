# 09 — Roadmap technique

> Issue de l'audit du 2026-07-04. Trois niveaux : 🔴 **bloquant avant déploiement**, 🟠 **important** (premières semaines post-launch), 🟢 **nice-to-have**. Effort : S < ½ j, M = ½–2 j, L = 2–5 j.

## 🔴 Bloquant avant déploiement

| # | Tâche | Détail | Effort |
|---|---|---|---|
| B1 | ✅ **FAIT 2026-07-04** — Persister `activeSession` | Middleware `persist` Zustand sur AsyncStorage, `partialize` sur `activeSession` seul. À la réhydratation, `resumeSession()` recalcule le chrono depuis `startedAt`, relance les timers, gère un repos expiré pendant le kill, et jette les séances > 12 h (seuil `MAX_RESUMABLE_AGE_MS`). Reprise automatique (pas de prompt — choix assumé, l'indicateur BottomNav signale la séance active). | M |
| B2 | ✅ **FAIT 2026-07-04** — Fix fuite du chrono de séance | `sessionInterval` est un champ normal du store, `clearInterval` dans `finishSession`/`discardSession`. `elapsedSeconds` recalculé depuis `startedAt` à chaque tick (plus de dérive en background). | S |
| B3 | ✅ **FAIT 2026-07-04** — Fix `finishSession` hardcodé | `name`/`type` stockés dans `ActiveSession` au `startSession` et repris dans le workout final ; `finishSession(feeling)` reçoit le ressenti du modal de fin (l'écran le collectait déjà). | S |
| B4 | **Error Boundary global + écran session** | Voir [08-ERROR-HANDLING.md](08-ERROR-HANDLING.md) §1. Inclut : sortir du spinner infini si `getDb()` échoue au boot. | M |
| B5 | **RLS Supabase vérifié + testé** | Les 4 tables (`workouts`, `profiles`, `plans`, `goals`) — voir [05-SECURITY.md](05-SECURITY.md) §3. | S |
| B6 | **Tokens auth → SecureStore** | Session Supabase actuellement dans AsyncStorage en clair. | M |
| B7 | **Suppression de compte + export données** | Exigence Apple/Google + RGPD. Bouton profil → wipe Supabase + local. | M |
| B8 | **Politique de confidentialité** | Rédaction + hébergement (page statique suffit) + liens stores. | M |
| B9 | **Optimiser les assets** | 56 MB → < 15 MB : WebP, resize, purge des non-référencés. Voir [07-PERFORMANCE.md](07-PERFORMANCE.md). | M |
| B10 | **Nettoyage repo & app** | Supprimer `app/hud-test.tsx`, les ~25 PNG/HTML à la racine du repo, `IMG_*.png`. | S |
| B11 | **Permissions app.json** | Retirer HealthKit (aucune intégration dans le code) et caméra si le scan QR n'est pas shippé. | S |
| B12 | **`eas.json` + secrets + premier build preview** | Voir [06-DEPLOYMENT.md](06-DEPLOYMENT.md). | M |
| B13 | **Tests unitaires `lib/gamification` + `lib/aiPlanner`** | Le strict minimum de filet avant release — setup Jest inclus. Voir [04-TESTING.md](04-TESTING.md). | L |

**Total estimé : ~3 semaines à temps partiel.** Ordre conseillé : B2→B3→B1 (même fichier), puis B4, B13, puis sécurité (B5-B8), puis packaging (B9-B12).

## 🟠 Important — post-launch immédiat

| # | Tâche | Détail | Effort |
|---|---|---|---|
| I1 | **Découper `session.tsx` (1 828 l.)** | Extraire les ~20 composants locaux vers `components/session/`, la logique (`detectSessionType`, `homeWorkoutDuration`) vers `lib/`. Même traitement ensuite pour `planner.tsx` (1 054 l.) et `index.tsx` (905 l.). | L |
| I2 | **Fusionner les systèmes HUD** | `components/hud/` (3 fichiers) vs `components/ui/hud/` (14 fichiers) : garder `ui/hud/`, migrer/supprimer le reste. Trancher le doublon `XpRing` (2 implémentations différentes). | M |
| I3 | **Tokens couleur** | Résorber les 426 hex hardcodés — au minimum les 3 cyans concurrents (`#1DC4FF`, `#17B8FF`, `#5DD8FF`) vers `hud.cyan.*`. Faire au fil de I1. | M (diffus) |
| I4 | **Sentry** | Crash reporting — voir [08-ERROR-HANDLING.md](08-ERROR-HANDLING.md) §3. Idéalement AVANT release si le temps le permet. | S |
| I5 | **NetInfo pour la sync** | Remplacer la sonde `isOnline()` (requête Supabase par flush) par un listener `@react-native-community/netinfo`. | S |
| I6 | **Supprimer les deps mortes** | `@tanstack/react-query` (provider monté, zéro usage), `ansi-escapes` (?), auditer `expo-camera`/`expo-blur`/`lottie`. | S |
| I7 | **ESLint + Prettier** | `eslint-config-expo` + règle `no-restricted-syntax` sur les hex hardcodés et `no-explicit-any`. | S |
| I8 | **Éliminer les `as any`** | 12 occurrences : helper `tDyn()` i18n, `BottomTabBarProps` pour BottomNav, `ImageSourcePropType` pour RankCore. | S |
| I9 | **Mémoïser XP/streak/rank** | `getTotalXP()` reparcourt tout l'historique à chaque appel. | S |
| I10 | **Messages d'erreur auth i18n** | `login.tsx` affiche l'erreur Supabase brute. | S |
| I11 | **Catch muets → logs** | `flushSyncQueue`, `addWorkout`, etc. | S |

## 🟢 Nice-to-have / plus tard

| # | Tâche | Détail |
|---|---|---|
| N1 | Migration **Expo SDK 57** | Résout les 14 vulnérabilités modérées `@expo/cli`. Attendre d'avoir les tests (B13) comme filet. |
| N2 | `FlatList` sur l'historique | Nécessaire vers ~100+ séances (voir [07-PERFORMANCE.md](07-PERFORMANCE.md)). |
| N3 | Tests composants + E2E Maestro | Après B13. |
| N4 | Indicateur « sync en attente » | Badge quand `sync_queue` non vide. |
| N5 | MMKV | Remplacer AsyncStorage (perf) — nécessite un dev client, plus d'Expo Go. À coupler avec B6. |
| N6 | SQLCipher | Chiffrement DB locale si les données santé s'enrichissent. |
| N7 | Conflits de sync plus fins | Last-write-wins par entité (aujourd'hui : cloud écrase tout) si le multi-device devient réel. |
| N8 | **Préparer le freemium** | RevenueCat + gating de features : à concevoir AVANT d'implémenter le paywall (impacte stores, profil, types). |
| N9 | Haptics hors de `PRCelebration.tsx` | Respecter la convention « haptics dans sessionStore uniquement ». |
| N10 | Textes en dur restants → i18n | `'DÉMARRER LA SÉANCE'`, labels de fallback, etc. |

## Ce qui va bien — à préserver

- Pattern offline-first write-through (SQLite → store → sync) : **ne pas y toucher**, c'est le meilleur atout du projet.
- TypeScript strict complet, `type-check` vert.
- Migrations SQLite versionnées et idempotentes.
- Logique métier pure dans `lib/` (gamification, aiPlanner) — prête à tester.
- `types/index.ts` source unique.
- Garde `isSupabaseConfigured()` systématique.
