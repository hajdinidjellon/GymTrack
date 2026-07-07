# 01 — Setup & installation

## Prérequis

| Outil | Version | Vérifier |
|---|---|---|
| Node.js | ≥ 20 LTS | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Expo Go (téléphone) | compatible **SDK 54** | app store |
| Xcode (build iOS) | 16+ sur macOS | facultatif en dev |
| Android Studio (émulateur) | facultatif | |
| EAS CLI (builds) | `npm i -g eas-cli` | `eas -v` |

Pas d'installation globale d'`expo-cli` nécessaire (le CLI est packagé dans le projet).

## Installation

```bash
git clone <repo> GymTrack
cd GymTrack/gym-tracker-mobile   # ⚠️ tout se passe dans ce sous-dossier
npm install
```

## Variables d'environnement

Copier le template puis remplir :

```bash
cp .env.example .env.local
```

Contenu de `.env.local` (jamais commité — déjà dans `.gitignore`) :

```bash
# Supabase — OPTIONNEL. Sans ces valeurs, l'app tourne 100 % offline
# (isSupabaseConfigured() retourne false et tous les appels cloud sont ignorés).
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

⚠️ **Règles** :
- Seules des variables `EXPO_PUBLIC_*` sont autorisées côté client — elles sont **embarquées dans le bundle**, donc jamais de clé secrète (service_role, etc.) ici. L'anon key Supabase est publique par design (la sécurité repose sur les RLS policies côté Supabase).
- Après modification du `.env.local`, **redémarrer Metro avec cache clear** : `npx expo start -c`.

## Lancer en développement

```bash
npm start          # Metro avec 4 GB de heap (nécessaire, le projet est lourd)
npm run ios        # cible iOS directement
npm run android    # cible Android directement
npm run web        # web (support partiel — Skia/HUD non garantis)
```

Puis scanner le QR code avec Expo Go, ou presser `i` / `a` pour ouvrir un simulateur.

## Vérifier le code

```bash
npm run type-check   # tsc --noEmit — DOIT passer avant tout commit
```

Il n'y a pas encore de lint ni de tests (voir [04-TESTING.md](04-TESTING.md) et la [roadmap](09-ROADMAP-TECHNIQUE.md)).

## Builder (EAS)

> ⚠️ `eas.json` n'existe pas encore — voir [06-DEPLOYMENT.md](06-DEPLOYMENT.md) pour la configuration complète à créer avant le premier build.

```bash
eas login
eas build:configure                  # génère eas.json (une fois)
eas build --profile preview --platform android   # APK de test
eas build --profile production --platform all    # builds stores
```

## Troubleshooting

| Symptôme | Cause probable | Fix |
|---|---|---|
| `JavaScript heap out of memory` au démarrage | Metro manque de RAM (assets lourds + Skia) | Utiliser `npm start` (pas `npx expo start` directement) — le script passe `--max-old-space-size=4096` |
| Variables d'env ignorées | Cache Metro | `npx expo start -c` |
| `Unable to resolve module @/...` | Alias cassé après install | Vérifier `tsconfig.json` (`paths`) et redémarrer Metro avec `-c` |
| App bloquée sur le spinner de démarrage | Init SQLite ou fonts en échec | Regarder la console Metro ; supprimer l'app d'Expo Go pour reset la DB locale |
| Expo Go affiche "incompatible SDK" | Version Expo Go ≠ SDK 54 | Installer la version d'Expo Go correspondante ou builder un dev client |
| Erreurs `react-native-reanimated` après upgrade | Cache Babel | `npx expo start -c` ; vérifier que le plugin Reanimated est le **dernier** dans `babel.config.js` |
| Les données de dev semblent corrompues | Migration DB partielle | Supprimer/réinstaller l'app (la DB `gymtrack.db` est recréée, migrations rejouées) |
| `npm audit` signale 14 vulnérabilités modérées | Chaîne `@expo/cli` du SDK 54 | Connu ; résolu par la migration SDK 57 (roadmap) — **ne pas** lancer `npm audit fix --force` |

## Reset complet de l'environnement

```bash
rm -rf node_modules .expo
npm install
npx expo start -c
```
