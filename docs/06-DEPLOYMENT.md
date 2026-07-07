# 06 — Déploiement

> État actuel : **aucune config de build** (`eas.json` absent, pas de compte EAS configuré, pas d'icônes finales vérifiées). Ce document est le chemin complet vers les stores.

## 1. Prérequis one-shot

- Compte [Expo/EAS](https://expo.dev) (plan gratuit OK pour commencer)
- Compte **Apple Developer** (99 $/an) + accès App Store Connect
- Compte **Google Play Console** (25 $ one-shot)
- `npm i -g eas-cli && eas login`

## 2. Configuration `eas.json` recommandée

À créer dans `gym-tracker-mobile/` :

```json
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "APP_ENV": "preview" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "APP_ENV": "production" }
    }
  },
  "submit": {
    "production": {
      "ios": { "ascAppId": "<ID App Store Connect>" },
      "android": { "track": "internal" }
    }
  }
}
```

- **development** : dev client (nécessaire dès qu'on sort d'Expo Go — ex. SecureStore avancé, MMKV).
- **preview** : APK installable direct pour tester sur appareil réel + TestFlight interne.
- **production** : AAB + IPA stores, `autoIncrement` gère les build numbers.

### Secrets par environnement

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://xxx.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ...
```

Si un jour il faut un projet Supabase de staging ≠ prod : dupliquer les secrets avec des noms suffixés et les mapper dans `env` par profil via `app.config.ts`.

## 3. Versioning

- **Version marketing** (`expo.version` dans `app.json`) : SemVer manuel — `1.0.0` au launch, patch pour les fix OTA-compatibles, minor pour les features.
- **Build numbers** (`buildNumber` iOS / `versionCode` Android) : gérés par EAS (`appVersionSource: "remote"` + `autoIncrement`) — ne jamais les toucher à la main.
- Tag git à chaque release store : `git tag v1.0.0 && git push --tags`.

## 4. Compléments `app.json` requis avant build

```jsonc
{
  "expo": {
    // à ajouter :
    "ios": { "buildNumber": "1" /* géré par EAS ensuite */ },
    "runtimeVersion": { "policy": "appVersion" },   // pour EAS Update
    "updates": { "url": "https://u.expo.dev/<project-id>" },
    "extra": { "eas": { "projectId": "<project-id>" } }  // généré par eas init
  }
}
```

⚠️ Avant le premier build, **nettoyer les permissions non utilisées** (`NSHealthShareUsageDescription`, caméra si le scan QR n'est pas shippé) — voir [05-SECURITY.md](05-SECURITY.md). C'est un motif de rejet Apple courant.

## 5. Assets requis

| Asset | Taille | Fichier |
|---|---|---|
| Icône app | 1024×1024 PNG, sans transparence (iOS) | `assets/icon.png` — vérifier |
| Adaptive icon Android (foreground) | 1024×1024 PNG, zone sûre au centre | `assets/adaptive-icon.png` |
| Splash | fond `#080810` déjà configuré ; ajouter une image centrée si voulu | `app.json > splash` |
| Notification icon Android | 96×96, blanc sur transparent | `assets/notification-icon.png` — vérifier qu'il est monochrome |
| Screenshots App Store | 6.9" (1320×2868) et 6.5" (1284×2778), min 3 | à produire |
| Screenshots Play Store | min 2, 16:9 ou 9:16, 1080p min | à produire |
| Feature graphic Play | 1024×500 | à produire |

## 6. Process de release — checklist complète

### Avant chaque build production
- [ ] `npm run type-check` passe
- [ ] Tests unitaires passent (quand ils existeront)
- [ ] Checklist de tests manuels de [04-TESTING.md](04-TESTING.md) déroulée sur un appareil réel iOS **et** Android
- [ ] Checklist sécurité de [05-SECURITY.md](05-SECURITY.md)
- [ ] `npm audit` vérifié
- [ ] Pas de route de debug accessible (`hud-test` supprimé)
- [ ] Assets optimisés (< 20 MB — voir [07-PERFORMANCE.md](07-PERFORMANCE.md))
- [ ] `expo.version` bumpée + changelog écrit
- [ ] Branche `main` propre, taguée

### Build & soumission

```bash
eas build --profile production --platform all
eas submit --platform ios      # → TestFlight
eas submit --platform android  # → track internal
```

### Avant de publier
- [ ] TestFlight : test complet du build **store** (pas du dev build) par au moins toi + 1 personne
- [ ] Play internal track : idem
- [ ] Fiches stores : description fr/en, mots-clés, catégorie Santé & Fitness, URL politique de confidentialité
- [ ] App Privacy (Apple) / Data Safety (Google) remplis
- [ ] Release **progressive** sur Play (10 % → 50 % → 100 %) ; phased release sur App Store

## 7. Rollback

- **Un binaire publié ne se retire pas** : on ne peut que pousser une version supérieure. D'où l'intérêt de la release progressive (stopper le rollout Play en cas de crash spike).
- **Bug JS pur** → correctif OTA immédiat via EAS Update (voir §8), pas besoin de re-review.
- **Bug natif/config** → nouveau build + soumission expédiée (demander une expedited review Apple si critique).
- Toujours garder le tag git du dernier build stable pour pouvoir builder un hotfix depuis cette base : `git checkout v1.0.0 -b hotfix/1.0.1`.

## 8. OTA updates — EAS Update

```bash
eas update --branch production --message "fix: streak calculation"
```

- **Utilisable pour** : tout changement JS/TS/assets (fix de bug, texte, styles).
- **PAS utilisable pour** : nouvelle lib native, changement de permissions, upgrade SDK, changement `app.json` natif → nouveau build store obligatoire.
- `runtimeVersion.policy: "appVersion"` garantit qu'un update OTA ne s'applique qu'aux binaires compatibles.
- Règle produit : OTA pour les patchs (`1.0.x`), build store pour les minor/major.
- ⚠️ Les stores tolèrent l'OTA tant qu'il ne change pas « l'objet de l'app » — pas de feature majeure sneakée en OTA.

## 9. Ordre des opérations pour le PREMIER déploiement

1. Corriger les bloquants roadmap (persist session, SecureStore, suppression de compte, RLS, assets) — [09-ROADMAP-TECHNIQUE.md](09-ROADMAP-TECHNIQUE.md)
2. `eas init` + créer `eas.json` (ce doc §2) + secrets EAS
3. Build `preview` Android → test sur appareil réel
4. Créer les fiches App Store Connect + Play Console (peut se faire en parallèle)
5. Build `production` + `eas submit`
6. TestFlight / internal testing ≥ 1 semaine
7. Publication progressive
