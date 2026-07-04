# 08 — Gestion d'erreurs

> État au 2026-07-04 : Error Boundaries en place (global + écran session, via `components/ui/ErrorFallback.tsx`) et échec de boot géré avec retry. Reste à faire : **crash reporting (Sentry, §3)** et résorption des `catch` muets.

## 1. Error Boundaries

Expo Router supporte un export `ErrorBoundary` **par route** — c'est le mécanisme à utiliser.

### Global (bloquant avant release)

```tsx
// app/_layout.tsx — ajouter cet export
import { View, Text, Pressable } from 'react-native';
import { type ErrorBoundaryProps } from 'expo-router';
import { colors } from '@/constants/theme';
import { t } from '@/lib/i18n';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  // logError(error) — Sentry une fois installé
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.primary,
                   alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ color: colors.text.primary, fontSize: 18 }}>
        {t('error.generic.title')}   {/* « Oups, quelque chose a cassé » */}
      </Text>
      <Pressable onPress={retry}>
        <Text style={{ color: colors.brand.primary }}>{t('error.generic.retry')}</Text>
      </Pressable>
    </View>
  );
}
```

Ajouter aussi un `ErrorBoundary` dédié sur **`app/(tabs)/session.tsx`** : c'est l'écran le plus complexe (Skia + 20 composants locaux) ET celui où un crash coûte le plus (séance en cours). Le fallback doit proposer de reprendre la séance, pas de la jeter.

Style du fallback : mêmes tokens que l'app (fond `#080810`, ton HUD), **jamais de stack trace ni de `error.message` brut affiché à l'utilisateur**.

## 2. Hiérarchie des erreurs — qui gère quoi

| Couche | Stratégie | Exemple existant |
|---|---|---|
| Rendu React | Error Boundaries (§1) | ✅ `ErrorFallback` + boundaries root/session (2026-07-04) |
| Action UI (login, save) | `loading`/`error` en state local + message i18n | ✅ `login.tsx:66-69` — c'est le modèle |
| Data layer (`db.ts`) | **Laisser remonter** (throw) — l'appelant décide. Un échec d'écriture SQLite ne doit JAMAIS être avalé : l'utilisateur croirait sa séance sauvée | ✅ actuellement rien n'est catché dans db.ts, c'est correct |
| Sync (`sync.ts`) | Best-effort silencieux TOLÉRÉ (retry au prochain flush) mais **loggé** | ⚠️ `flushSyncQueue` catch muet — ajouter `console.warn`/breadcrumb Sentry |
| Init (`_layout.tsx`) | Best-effort pour le non-critique (notifications ✅) ; pour le critique (DB), écran d'erreur avec retry | ✅ `bootError` + `ErrorFallback` boot (2026-07-04) |

### Règles

1. **Interdit : `catch {}` sans log.** Minimum `console.warn('[module] action failed', err)` avec un préfixe `[sync]`, `[db]`, `[notif]` (pattern déjà présent dans `sync.ts:192` — le généraliser).
2. `xxx().catch(() => null)` réservé au fire-and-forget réellement non critique (haptics, notifications). Jamais sur une écriture de données.
3. Toute action store async qui peut échouer devant l'utilisateur expose l'échec (return `{ error }` ou throw) — pas d'échec invisible.

## 3. Crash reporting — Sentry (recommandation)

`@sentry/react-native` via `npx expo install @sentry/react-native` + plugin config. Justification vs alternatives : intégration Expo officielle, sourcemaps automatiques via EAS, gratuit à ce volume.

Configuration clé pour CETTE app (données santé) :

```ts
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  sendDefaultPii: false,
  beforeSend(event) {
    // jamais de poids, mensurations, email dans les events
    delete event.user?.email;
    return event;
  },
});
```

- Breadcrumbs utiles à poser : démarrage/fin de séance, flush sync (succès/échec), migrations DB.
- Mentionner Sentry dans la politique de confidentialité ([05-SECURITY.md](05-SECURITY.md)).

## 4. Logging

| Environnement | Canal |
|---|---|
| Dev | `console.warn`/`console.error` avec préfixe `[module]` |
| Prod | Sentry (erreurs + breadcrumbs) ; `console.*` retirés au build ([07-PERFORMANCE.md](07-PERFORMANCE.md)) |

Ne **jamais** logger : session/tokens Supabase, email, données corporelles.

## 5. Messages utilisateur

- Toujours via i18n — créer une section `error.*` dans `lib/i18n.ts` : `error.generic.title`, `error.network`, `error.auth.invalidCredentials`, `error.save.failed`…
- ⚠️ `login.tsx` affiche actuellement `authError` **brut de Supabase** (anglais technique, ex. "Invalid login credentials") → mapper vers des clés i18n.
- Ton : dire quoi faire (« Réessaie », « Vérifie ta connexion »), pas ce qui a cassé techniquement.

## 6. Offline / réseau

L'app est offline-first : **l'absence de réseau n'est pas une erreur**, ne jamais afficher de bandeau d'erreur pour ça.

- Remplacer la sonde réseau actuelle (`isOnline()` fait une vraie requête Supabase à chaque flush — coûteux) par **`@react-native-community/netinfo`** : listener de connectivité qui déclenche `flushSyncQueue()` au retour en ligne. Bénéfice double : moins de réseau, et la sync devient événementielle au lieu d'opportuniste.
- Indicateur discret « en attente de sync » (badge sur le profil quand `sync_queue` non vide) — nice-to-have.
- Timeout : les appels Supabase n'ont pas de timeout explicite ; le catch générique suffit pour v1.

## 7. Checklist par nouvelle feature

- [ ] Chaque `await` visible par l'utilisateur a loading + error state
- [ ] Aucun nouveau `catch` muet
- [ ] Messages d'erreur via `t('error.…')` fr + en
- [ ] Échec d'écriture locale = visible pour l'utilisateur
- [ ] Échec de sync = silencieux + loggé + re-tenté
