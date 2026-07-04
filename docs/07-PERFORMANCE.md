# 07 — Performance

## Le problème n°1 : les assets (56 MB)

`assets/` pèse **56 MB** dont 33 MB d'images. Pires offenders mesurés :

| Fichier | Poids |
|---|---|
| `assets/mascot/mascotte-mimi-mouvement1.png` | **6,1 MB** |
| `assets/images/body-holo.png` | 2,5 MB |
| `assets/images/sunny-background.png` | 2,3 MB |
| `assets/images/seance-frame*.png` (×4) | ~2,2 MB chacun |
| `assets/images/man_gris_front/back.png` | 2,3 MB chacun |
| `assets/images/rankup.png`, `session-free.png`… | ~2 MB chacun |

### Plan d'action (avant release, fort impact / faible effort)

1. **Convertir en WebP** (supporté nativement iOS 14+/Android) : `npx sharp-cli --input assets/images/*.png --output ... --format webp --quality 80`. Gain attendu : **−70 à −85 %**.
2. **Redimensionner à l'usage réel** : une image de fond n'a pas besoin de dépasser ~1290 px de large (écran le plus large ×1). Les PNG actuels sont visiblement des exports 3-4×.
3. Supprimer les assets non référencés : vérifier chaque fichier de `assets/images/` avec `grep -r "nom-fichier" app components` — plusieurs maquettes semblent embarquées.
4. Nettoyer la **racine du repo** : ~25 PNG de maquettes + `bottom-bar.html` + SVG traînent hors de `gym-tracker-mobile/` — les déplacer dans un dossier `design/` gitignoré ou les supprimer.
5. Cible : **assets < 15 MB**, binaire Android < 40 MB.

## Images à l'exécution

- Utiliser **`expo-image`** (déjà installé) partout au lieu de `Image` de RN : cache disque automatique, décodage async, placeholder blurhash. Auditer les usages restants de `react-native` `Image`.
- Les gros fonds plein écran : `contentFit="cover"` + `cachePolicy="memory-disk"`.
- La mascotte : si l'animation vient de plusieurs PNG de 6 MB, remplacer par un **Lottie** (lib déjà installée) ou un sprite sheet — ordre de grandeur de gain : ×20.

## Listes

Aucune `FlatList` dans le projet : tous les tabs rendent des `ScrollView` + `.map()`. Risque réel dès ~100 séances (l'historique complet est monté d'un coup).

- `progress.tsx` (historique), la liste des séances récentes de `session.tsx`, et tout futur écran « toutes mes séances » → **`FlatList`** avec `keyExtractor={(w) => w.id}`, `getItemLayout` si hauteur fixe.
- Home/profil (contenus bornés à ~10 éléments) : `ScrollView` OK, ne pas sur-optimiser.

## Re-renders

1. **`getTotalXP()` / `getStreak()` recalculent sur tout l'historique à chaque appel** (`profileStore` → `calculateXPFromWorkouts` reparcourt tous les workouts, appelé par le watcher de `_layout.tsx` + plusieurs écrans). Fix : mémoïser dans le store — recalculer uniquement quand `workouts` change (subscribe) et stocker `totalXP`/`streak` comme état.
2. Le **chrono de séance tick chaque seconde dans le store** : tout composant abonné à `activeSession` entier re-rend 1×/s. Règle : s'abonner à des champs fins (`(s) => s.activeSession?.elapsedSeconds` uniquement dans le composant chrono ; les autres sélectionnent exercices/sets).
3. Overlays globaux de `_layout.tsx` : vérifier qu'ils retournent `null` tôt (pas de subscription large) — c'est le cas aujourd'hui, à préserver.
4. `React.memo` : uniquement sur les items de liste (`SetRow`, `RecentRow`, `ExerciseCard`) avec props stables — pas de memo systématique ailleurs.

## Skia / animations

- Les paths Skia constants sont déjà créés **hors composant** (`SK_OCTAGON_PATH` module-level dans session.tsx) ✅ — conserver ce pattern lors de l'extraction des composants.
- Reanimated : les worklets tournent sur l'UI thread ✅. Éviter `runOnJS` dans les boucles d'animation.
- `ScanLines`, glows animés en continu (`legend`, `legendary`) : vérifier qu'ils se **pausent quand l'écran n'est pas focus** (`useIsFocused`) — un glow 60fps en arrière-plan draine la batterie.

## Bundle JS

- **Supprimer `@tanstack/react-query`** (installée, provider monté, zéro query) et auditer `expo-camera`, `expo-blur`, `lottie-react-native`, `ansi-escapes` (?!) — chaque lib native non utilisée gonfle le binaire.
- Mesurer : `npx expo export --dump-sourcemap` puis `npx react-native-bundle-visualizer` (ou source-map-explorer sur le bundle exporté).
- Production : retirer les `console.*` avec `babel-plugin-transform-remove-console` (préserver `error`/`warn` si Sentry les capte).

## Métriques à surveiller

| Métrique | Cible | Mesure |
|---|---|---|
| Cold start → écran interactif | < 2,5 s (mid-range Android) | chrono manuel + Perf Monitor |
| Fin d'init `_layout` (DB + fonts + stores) | < 800 ms | `console.time` en dev |
| FPS écran session (tick chrono + Skia) | 60 stable, 0 drop pendant saisie | Perf Monitor (secouer l'appareil → Show Perf Monitor) |
| Mémoire après 10 min de session | stable (pas de croissance continue = fuite) | Xcode Instruments / Android Profiler |
| Taille binaire Android | < 40 MB | sortie EAS build |

## Méthode de profiling

1. **Toujours profiler en mode release-like** (`expo start --no-dev --minify` minimum, idéalement build preview) — le mode dev ment sur les perfs.
2. JS : React DevTools Profiler (flamegraph des re-renders) — cibler l'écran session pendant le tick du chrono.
3. Natif : Xcode Instruments (Time Profiler, Allocations) / Android Studio Profiler.
4. Après le fix de la fuite de timer (roadmap) : vérifier avec le profiler qu'aucun interval ne survit à `finishSession`.
