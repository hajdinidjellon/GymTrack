# 05 — Sécurité

> Contexte : app fitness = **données de santé potentiellement sensibles** (poids, mensurations, fréquence d'entraînement). Le niveau d'exigence est plus élevé qu'une app utilitaire.

## État des lieux (audit 2026-07)

| Point | État | Verdict |
|---|---|---|
| Secrets dans le code | Aucun — `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` via env | ✅ |
| `.env.local` gitignoré | Oui (+ `*.jks`, `*.p8`, `*.p12`, `*.key`) | ✅ |
| `.env.example` | Créé (audit) | ✅ |
| Tokens Supabase | Chiffrés — `lib/secureStorage.ts` (AES + Keychain/Keystore, 2026-07-05) | ✅ |
| RLS Supabase | Script prêt (`supabase/setup.sql`) — **à exécuter au dashboard puis tester** | 🟠 exécution requise |
| Données santé locales | SQLite non chiffrée | 🟡 acceptable, à documenter |
| Politique de confidentialité | Rédigée (`docs/legal/privacy-policy.html`) — **à héberger + lier aux stores** | 🟠 hébergement requis |
| Suppression de compte + export | In-app (Profil → Réglages, `lib/account.ts`, 2026-07-05) | ✅ |

## 1. Stockage sécurisé

### 🔴 Tokens d'auth → SecureStore (bloquant avant release)

Les tokens de session Supabase (access + refresh) sont persistés dans AsyncStorage, lisible en clair sur appareil compromis/backup non chiffré. Fix (à planifier, PAS pendant l'exercice de doc) :

```ts
// lib/supabase.ts — adapter le storage
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
// createClient(..., { auth: { storage: secureStorage, ... } })
```

⚠️ SecureStore plafonne à ~2 Ko par entrée ; la session Supabase peut dépasser. Solution standard : chiffrer la session avec une clé AES stockée dans SecureStore, données chiffrées dans AsyncStorage (pattern documenté par Supabase avec `aes-js`).

### Règle générale

| Donnée | Stockage |
|---|---|
| Tokens, credentials, clés de chiffrement | `expo-secure-store` (Keychain/Keystore) |
| Données métier (workouts, profil, body stats) | SQLite (voir note ci-dessous) |
| Préférences non sensibles (langue, unités) | AsyncStorage — OK |

**Note SQLite** : la DB locale n'est pas chiffrée. Acceptable pour v1 (les données restent dans la sandbox de l'app, iOS chiffre le filesystem par défaut). Si les body stats s'enrichissent (photos, données médicales), envisager SQLCipher — noté en roadmap post-launch.

## 2. Secrets

- **Jamais** de clé dans le code ou dans git. Seules les `EXPO_PUBLIC_*` (publiques par design) vont dans `.env.local`.
- La **service_role key** Supabase ne doit exister NULLE PART côté client — uniquement dans des edge functions/backoffice.
- Pour les builds : **EAS Secrets** (`eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value ...`), pas de `.env` commité par profil.
- Si une clé fuite : la révoquer dans Supabase (rotation anon key) et purger l'historique git si commitée.

## 3. Supabase — RLS (le vrai périmètre de sécurité)

L'anon key étant publique, **toute la sécurité des données cloud repose sur les Row Level Security policies**. À vérifier/mettre en place sur les 4 tables (`workouts`, `profiles`, `plans`, `goals`) :

```sql
alter table workouts enable row level security;

create policy "own rows only" on workouts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**Test obligatoire avant release** : avec l'anon key seule (sans session), tenter un `select` sur chaque table → doit retourner 0 ligne. Avec la session d'un user A, tenter de lire/écrire un `user_id` de B → doit échouer.

## 4. Validation des entrées

- Inputs numériques (poids, reps, mensurations) : borner et valider (`0 < weight < 1000`, entier pour reps) **avant** d'écrire dans le store — actuellement les Steppers bornent visuellement mais pas systématiquement à l'écriture.
- Strings (nom de séance, notes) : limiter la longueur (ex. 100 caractères). Pas de risque d'injection SQL (requêtes paramétrées partout dans `db.ts` ✅) mais les blobs JSON partent tels quels vers Supabase.
- Email/password : la validation est déléguée à Supabase Auth ✅. Ajouter un minimum côté client (format email, mdp ≥ 8) pour l'UX.

## 5. Permissions

État actuel (`app.json`) — chacune doit rester justifiée :

| Permission | Usage | Verdict |
|---|---|---|
| `CAMERA` / `NSCameraUsageDescription` | Scan QR | ⚠️ vérifier que la feature existe vraiment ; sinon **retirer** (motif de rejet store) |
| `VIBRATE` | Haptics | ✅ |
| `RECEIVE_BOOT_COMPLETED` | Notifications programmées | ✅ |
| `NSHealthShare/UpdateUsageDescription` | Apple Santé | ⚠️ déclaré mais aucune intégration HealthKit dans le code → **retirer jusqu'à implémentation** (Apple rejette les usage descriptions sans usage réel) |

Règle : demander la permission **au moment de l'usage** (déjà le cas pour les notifications), jamais au premier lancement en rafale.

## 6. RGPD / données personnelles

Données collectées : email (si compte), prénom, objectifs, poids/mensurations (**données de santé** au sens RGPD art. 9), historique d'entraînement.

Obligations avant mise sur les stores :
- [ ] **Politique de confidentialité** publiée (URL exigée par App Store ET Play Store) : quelles données, où (Supabase — préciser la région du projet, choisir UE), durée, droits.
- [ ] **Suppression de compte in-app** (exigence Apple 5.1.1(v) et Google) : bouton dans profil → delete rows Supabase + wipe local. N'existe pas → **bloquant**.
- [ ] **Export des données** (droit à la portabilité) : un export JSON suffit.
- [ ] Consentement explicite avant tout futur ajout d'analytics/crash reporting (Sentry : activer `beforeSend` pour scrubber les données personnelles).
- [ ] Formulaires "Data Safety" (Play) et "App Privacy" (App Store) cohérents avec la réalité.

## 7. Réseau

- Supabase = HTTPS ✅. iOS ATS et Android `cleartextTrafficPermitted=false` par défaut — **ne jamais les désactiver**.
- Certificate pinning : non nécessaire pour v1 (complexité > bénéfice avec un BaaS ; les certs Supabase tournent). À reconsidérer si backend propre un jour.
- Tokens : `autoRefreshToken: true` ✅ ; ne jamais logger la session (`console.log(session)` interdit).

## 8. Dépendances

- `npm audit` à chaque ajout de dépendance + avant chaque release. État actuel : 14 modérées, toutes dans `@expo/cli` (outillage dev, pas le runtime) — résolues par la migration SDK 57.
- **Ne pas** lancer `npm audit fix --force` (casserait Expo).
- Préférer `npx expo install` à `npm i` pour les libs RN (versions compatibles SDK).
- Éviter les libs non maintenues (> 1 an sans release) pour tout ce qui touche données/auth.

## 9. Protection du code au build

- Builds production EAS : JS minifié par Metro ✅ (pas d'obfuscation forte — inutile, la logique sensible doit vivre côté Supabase/RLS de toute façon).
- Android : activer R8/ProGuard via `eas.json` (`"android": { "buildType": "app-bundle" }` + proguard par défaut).
- Vérifier qu'aucun `console.log` de données perso ne part en prod (babel plugin `transform-remove-console` en production — voir [07-PERFORMANCE.md](07-PERFORMANCE.md)).

## Checklist sécurité pré-déploiement

- [ ] RLS activé + testé sur les 4 tables Supabase
- [ ] Tokens migrés vers SecureStore (ou chiffrement AES + SecureStore)
- [ ] Permissions HealthKit/Camera retirées si non utilisées
- [ ] Politique de confidentialité en ligne + liée dans les fiches stores
- [ ] Suppression de compte + export de données in-app
- [ ] `npm audit` propre (hors chaîne @expo/cli connue)
- [ ] Aucun `console.log` de session/profil dans le code
- [ ] `.env.local` absent de l'historique git (vérifié : ✅)
- [ ] Formulaires Data Safety / App Privacy remplis honnêtement
