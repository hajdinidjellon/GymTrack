# 📋 Résultats d'audit — GymTrack vs AUDIT_APP_STORES.md

> Audit réalisé le **2026-07-10** sur la branche `fix/session-store-critical`, par analyse du code, de la config et des docs.
> Légende : ✅ conforme · ❌ non conforme · ⚠️ à vérifier manuellement / hors code · **N/A** sans objet aujourd'hui.
>
> **Verdict global : le cœur technique est sain (sécurité, offline, RLS, zéro tracking), la couche légale/store n'est pas prête.**

---

## Tableau de bord

| Section | État |
|---|---|
| 1. Légal & conformité | 🔴 **Le gros du travail restant** — privacy non publiée, pas de CGU, pas de disclaimer santé |
| 2. Validation Apple | 🟠 Un bloquant code (bouton Google mort), le reste = fiche à créer |
| 3. Validation Google Play | 🟠 Config technique OK, fiche + privacy URL manquantes |
| 4. Sécurité | 🟢 **Excellente** — aucune faille identifiée dans le code |
| 5. Qualité technique | 🟠 Offline/error boundaries OK ; Sentry et accessibilité absents |
| 6. ASO | ⚪ Pas commencé (normal à ce stade) |
| 7. Avis & notes | ⚪ Pas implémenté (rien d'interdit non plus) |
| 8. Monétisation | ⚪ Rien d'implémenté → aucune non-conformité possible |

---

## ✅ CE QUE TU AS (conforme)

### Légal / RGPD
| Quoi | Preuve |
|---|---|
| Politique de confidentialité **rédigée et complète** (données, base légale, sous-traitants, conservation 35 j, droits, CNIL, mineurs) | `docs/legal/privacy-policy.html` (fr + résumé en) |
| **Suppression de compte in-app** avec confirmation | `lib/account.ts:77` `deleteAccount()` ← `app/(tabs)/profile.tsx:157` |
| **Vraie suppression backend** : RPC `delete_user` SECURITY DEFINER + `ON DELETE CASCADE` sur les 4 tables | `supabase/setup.sql` |
| **Export des données** (portabilité RGPD) en JSON via expo-sharing | `lib/account.ts:33` `exportAllData()` ← `profile.tsx:148` |
| **Zéro SDK analytics/ads/tracking** → pas de bannière de consentement nécessaire | `package.json` (aucune dépendance), cohérent avec la politique |
| Sons **100 % synthétisés** (pas de licence tierce) | `lib/sfx.ts:2` + `assets/sounds/` |
| Polices via npm Google Fonts (licence OFL) | `@expo-google-fonts/inter`, `@expo-google-fonts/rajdhani` |
| Pas de gambling/récompense aléatoire (badges & XP déterministes) | `lib/gamification.ts` |

### Sécurité (section la plus solide)
| Quoi | Preuve |
|---|---|
| **Aucune clé secrète dans le code** — tout vient de `EXPO_PUBLIC_*`, seule la clé `anon` (publique par design) existe côté client | `lib/supabase.ts:6-7` |
| `.env` ignoré à 2 niveaux et **jamais commité dans l'historique git** | `.gitignore` racine + mobile, `git log --all --diff-filter=A -- '*.env*'` vide |
| **RLS activé sur les 4 tables** avec policy « own rows only » (`auth.uid() = user_id`) | `supabase/setup.sql:52-81` |
| **Session Supabase chiffrée** : clé AES-256 en Keychain/Keystore, blob AES-CTR — jamais de token en clair dans AsyncStorage | `lib/secureStorage.ts` + `lib/supabase.ts:19` (`storage: largeSecureStore`) |
| **0 `console.log`** dans l'app ; aucun log de token/email/mot de passe | grep sur `app/ lib/ stores/ components/` |
| **100 % HTTPS** — aucun `usesCleartextTraffic` / `NSAllowsArbitraryLoads` | `app.json`, code |
| Deep links à faible surface : scheme `gymtrack`, `detectSessionInUrl: false`, params onboarding avec fallbacks | `lib/supabase.ts:22`, `app/(auth)/onboarding/*` |
| `npm audit` : **0 critique, 0 high** (14 modérées transitives via Expo — correctif = Expo 57, breaking, non urgent) | `npm audit --omit=dev` |
| Aucune route debug/test accessible | `find app/` négatif |

### Apple / Google — points techniques
| Quoi | Preuve |
|---|---|
| Vraie valeur native (Guideline 4.2) : offline-first SQLite, Skia, notifications, haptique | architecture générale |
| **Aucun IAP** → règle 3.1.1 Apple / facturation Play sans objet | `package.json` (pas de react-native-iap/revenuecat/stripe) |
| **ATT sans objet** : aucun tracking cross-app | pas d'`expo-tracking-transparency` requis |
| Sign in with Apple **pas encore obligatoire** (auth = email/mdp uniquement) | `lib/supabase.ts:45`, écrans login/register |
| Target API level OK (Expo SDK 54) | `package.json` |
| **AAB + versioning auto** : profil production `autoIncrement: true`, `appVersionSource: remote`, track `internal` configuré | `eas.json` |
| Permissions Android **minimales** : `VIBRATE`, `RECEIVE_BOOT_COMPLETED` | `app.json:28-31` |
| Bundle id cohérent iOS/Android : `com.gymtrack.mobile` | `app.json` |
| Projet lié à EAS (projectId + owner `2late`) | `app.json:extra.eas` |

### Qualité
| Quoi | Preuve |
|---|---|
| **Mode hors-ligne complet** : guards `isSupabaseConfigured()` systématiques, NetInfo sans requête sonde | `lib/sync.ts:38,52` |
| **Error boundaries** : racine + session + composant partagé | `app/_layout.tsx:41`, `app/(tabs)/session.tsx:48`, `components/ui/ErrorFallback.tsx` |
| **i18n fr + en complet** avec fallback (parité des clés vérifiée par test unitaire) | `lib/i18n.ts`, `lib/__tests__/i18n.test.ts` |
| 184 tests unitaires verts (lib + stores) | `npm test` |
| Aucun mot interdit « beta » / « Android » dans les strings visibles | grep i18n + écrans |
| Pas de popup custom « notez-nous 5★ » (pratique interdite) | aucun code de ce type |

---

## ❌ CE QUE TU N'AS PAS (non conforme — à faire)

> ✅ **Mise à jour 2026-07-10** : les items 2, 3, 5, 8 et une partie des items 7 et 12 ont été corrigés dans le code (voir détail barré ci-dessous). Type-check + 184 tests verts.

### 🔴 Bloquants pour soumettre (les deux stores refuseront sinon)

| # | Quoi | Détail / où agir |
|---|---|---|
| 1 | **Politique de confidentialité NON hébergée** (pas d'URL publique) | Le HTML existe (`docs/legal/privacy-policy.html`) → héberger sur GitHub Pages/Netlify. Exigé par Apple ET Google |
| 2 | ~~Aucun lien privacy dans l'app~~ ✅ **FAIT** | Écran `app/legal/privacy.tsx` (politique complète embarquée fr/en, consultable hors ligne) + liens dans Profil → Réglages → section Légal |
| 3 | ~~Bouton « Continuer avec Google » mort~~ ✅ **FAIT** | Retiré de `register.tsx` et `onboarding/connect.tsx` (plus d'Alert « Bientôt disponible »). Le jour où Google est implémenté → Sign in with Apple obligatoire |
| 4 | **Aucune CGU / mentions légales** (LCEN) | `docs/legal/` ne contient que la privacy. À rédiger + héberger + lier (nécessite ton identité/statut juridique) |

### 🟠 Fortement recommandé avant v1

| # | Quoi | Détail / où agir |
|---|---|---|
| 5 | ~~Pas de disclaimer santé~~ ✅ **FAIT** | Clé i18n `legal.disclaimer` (fr+en), affichée en permanence dans Profil → Réglages + à la fin de la politique de confidentialité in-app |
| 6 | **Pas de crash reporting** (Sentry absent) | Seul un `// TODO Sentry` dans `ErrorFallback.tsx:32`. Nécessite un compte Sentry + DSN (pas automatisable) |
| 7 | **Accessibilité** — ✅ passe minimale faite, à étendre | `accessibilityRole`/`Label`/`State` ajoutés sur les primitives : `Button`, `BevelButton`, onglets `BottomNav` (+ IA Coach), steppers `NumericInput`, lignes légales. Reste : boutons icône-seule des écrans (session, profil) |
| 8 | ~~Pas d'écran « Licences open source »~~ ✅ **FAIT** | `app/legal/licenses.tsx` + `constants/licenses.ts` (43 dépendances, toutes MIT/OFL — **aucune GPL**, bon point audité) |
| 9 | **États vides/loading quasi absents** sur les tabs principaux | Risque d'écrans cassés/NaN pour un profil neuf (0 workout) — à tester et combler |
| 10 | **`supabase/setup.sql` pas confirmé appliqué en prod** | Sans lui : pas de RLS effective ni de suppression de compte fonctionnelle. Vérifier dans le dashboard Supabase |
| 11 | **Pas de demande d'avis native** (`expo-store-review`) | À brancher au bon moment (fin de séance réussie) |
| 12 | **Locales iOS** ✅ **FAIT** / NSUsageDescription toujours vide | `app.json` : `CFBundleLocalizations` fr+en, `CFBundleDevelopmentRegion`, `CFBundleAllowMixedLocalizations`. Aucune permission ne nécessite de texte d'usage aujourd'hui (pas de caméra/photos) |
| 13 | **Splash sans image** (couleur seule) | `app.json` — écran de démarrage nu (choix design à faire) |

### ⚠️ Hors code — à faire toi-même (impossible à vérifier d'ici)

| # | Quoi |
|---|---|
| 14 | **Vérifier que le repo GitHub est privé** (`github.com/hajdinidjellon/GymTrack`) |
| 15 | **Région UE du projet Supabase** (la politique l'affirme, le dashboard doit le confirmer) |
| 16 | **Registre des traitements RGPD** (document interne, obligatoire même solo) |
| 17 | **Statut juridique** (micro-entreprise/SIRET) dès que tu encaisses + **statut Trader DSA** sur les deux stores |
| 18 | Recherche de **marque** « GymTrack » (INPI/EUIPO) + disponibilité nom/domaine. ⚠️ le dossier `mascotteJarvis/` : « Jarvis » = Marvel/Disney, garder « NEXUS » partout en public |
| 19 | Comptes développeur **Apple (99 $/an)** et **Google (25 $)**, identité vérifiée |
| 20 | **Fiches stores** : screenshots, description, keywords, Privacy Nutrition Labels / Data Safety Form, questionnaire d'âge IARC |
| 21 | **Closed testing Google** : 12 testeurs / 14 jours (compte perso) |
| 22 | **Compte de test** dans les App Review Notes Apple |
| 23 | Campagne de **tests manuels sur vrais devices** (docs/lancement/04) : crashs, petits écrans, mode avion, profil neuf |
| 24 | Landing page + présence réseaux (ASO) |

### ⚪ Sans objet aujourd'hui (deviendra requis avec la monétisation)

- CGV + case de renonciation au droit de rétractation
- IAP via Apple/Google (biens numériques), restore purchases, conditions d'abonnement
- Vérification serveur des droits premium, webhooks signés
- Déclaration des revenus (micro-BNC/BIC, DAC7)

---

## 🎯 Ordre d'attaque recommandé (mis à jour 2026-07-10)

1. ~~Liens privacy in-app~~ ✅ / **Héberger la privacy policy** (GitHub Pages/Netlify) — il ne reste que l'URL publique pour les fiches stores
2. ~~Retirer le bouton Google + l'Alert « Bientôt disponible »~~ ✅
3. Rédiger CGU + mentions légales (courtes) et les héberger au même endroit — *nécessite ton statut juridique*
4. ~~Disclaimer santé (i18n fr/en)~~ ✅
5. Exécuter/confirmer `setup.sql` en prod + vérifier la région UE — *dashboard Supabase*
6. Installer Sentry — *nécessite un compte Sentry (DSN)*
7. ~~Passe d'accessibilité minimale~~ ✅ (primitives) / étendre aux boutons icône-seule + états vides des tabs
8. ~~Écran licences open source + locales iOS~~ ✅ / reste : image de splash (choix design)
