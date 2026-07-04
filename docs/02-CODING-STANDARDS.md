# 02 — Standards de code

> Règles à respecter sur tout nouveau code. Le code existant qui les viole est listé dans la [roadmap](09-ROADMAP-TECHNIQUE.md) — on le corrige au fil de l'eau, pas en big-bang.

## TypeScript

Le `tsconfig.json` est en strict complet : `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`. **`npm run type-check` doit passer avant tout commit.**

- **Interdit : `any` et `as any`.** Les 12 occurrences actuelles (`BottomNav.tsx:283`, casts i18n, `RankCore.tsx:24`…) sont de la dette, pas un précédent.
  - Props de navigation → utiliser `BottomTabBarProps` de `@react-navigation/bottom-tabs`.
  - Clés i18n dynamiques → un seul helper `tDyn(key: string)` dans `lib/i18n.ts` qui encapsule le cast, jamais `as any` inline dans un composant.
  - Source d'image → `ImageSourcePropType` de react-native, pas `any`.
- **`noUncheckedIndexedAccess` est activé** : `array[i]` retourne `T | undefined`. Gérer le cas (`?.`, garde, `.at()`) — ne pas forcer avec `!` sauf invariant prouvé sur la ligne au-dessus (ex. `sets[setIndex]!` juste après avoir construit `sets` est acceptable).
- Types domaine **uniquement** dans `types/index.ts`. Les types de props restent locaux au composant.
- Préférer les types dérivés : `Partial<WorkoutSet>`, `Omit<Badge, 'condition'>`, `keyof typeof T.fr` (déjà utilisés — continuer).

## Composants

- **Function components + hooks uniquement.** Pas de classes (exception à venir : l'ErrorBoundary, qui doit être une classe).
- Export **nommé** (`export function RestTimer`), sauf les écrans `app/` qui exigent un `export default` (contrainte Expo Router).
- Props typées inline ou via `interface Props` locale ; toujours destructurées dans la signature.
- **Taille max indicative : ~150 lignes par composant, ~400 par fichier écran.** Au-delà, extraire vers `components/<domaine>/`. C'est la règle la plus violée du projet (`session.tsx` : 1 828 l.) — tout nouveau composant d'écran doit naître dans `components/`, pas dans le fichier de l'écran.
- Un composant utilisé par 2+ écrans vit dans `components/`. Vérifier l'existant avant d'en créer un : le doublon `ui/XpRing` / `hud/XpRing` ne doit pas se reproduire. **Nouveaux composants HUD → `components/ui/hud/` uniquement.**

### Template d'un composant type

```tsx
// components/session/RestBanner.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { useSessionStore } from '@/stores/sessionStore';
import { t } from '@/lib/i18n';
import type { WorkoutSet } from '@/types';

interface RestBannerProps {
  set: WorkoutSet;
  onSkip: () => void;
}

export function RestBanner({ set, onSkip }: RestBannerProps) {
  const restSecondsLeft = useSessionStore(
    (s) => s.activeSession?.restSecondsLeft,
  );
  if (restSecondsLeft == null) return null;

  return (
    <View className="flex-row items-center px-4" style={{ gap: spacing.sm }}>
      <Text style={{ color: colors.text.primary }}>{restSecondsLeft}s</Text>
      <Pressable onPress={onSkip}>
        <Text style={{ color: colors.brand.primary }}>{t('common.continue')}</Text>
      </Pressable>
    </View>
  );
}
```

## Styles

Deux systèmes complémentaires — règle de choix :

| Besoin | Outil |
|---|---|
| Layout, spacing, flex | NativeWind `className` (`flex-row`, `px-4`, `bg-bg-primary`) |
| Couleur/valeur programmatique (Skia, Reanimated, interpolation, heatmap) | `constants/theme.ts` en `style` inline |

- **Interdit : hex hardcodé** (`'#1DC4FF'`) dans un écran ou composant. Il y en a 426 aujourd'hui — dette. Tout cyan HUD passe par `hud.cyan.*`, les couleurs de rang par `rankPalette`, les rarités par `rarityPalette`. Si une couleur manque, **l'ajouter à `theme.ts`**, pas la poser en local.
- Interdit : redéfinir des constantes locales type `const CYAN = '#17B8FF'` (3 variantes de cyan coexistent déjà dans le code — c'est exactement le bug visuel qu'on veut éviter).
- Espacements et radius : tokens `spacing` / `radius`, pas de nombres magiques.

## Textes

- **Aucune string visible par l'utilisateur en dur.** Tout passe par `t('cle')` de `lib/i18n.ts` (fr + en obligatoires pour chaque nouvelle clé).
- Dette connue : `'DÉMARRER LA SÉANCE'` (session.tsx), `name: 'Séance'` (sessionStore) — à migrer.

## Imports

Ordre (séparés par une ligne vide, style déjà majoritaire dans le code) :

1. React / react-native
2. Libs externes (expo-*, zustand, date-fns, skia…)
3. Internes via alias `@/` (constants → stores → lib → components)
4. `import type { ... } from '@/types'` en dernier

- **Toujours l'alias `@/`** pour les imports internes inter-dossiers. Relatif (`./`) autorisé uniquement dans le même dossier.
- Imports de types avec `import type`.

## Gestion des erreurs (résumé — détail dans [08-ERROR-HANDLING.md](08-ERROR-HANDLING.md))

- **Interdit : `catch {}` muet.** Minimum : `catch (err) { console.warn('[contexte]', err); }`. Best-effort assumé → commentaire l'expliquant (pattern `flushSyncQueue().catch(() => null)` toléré uniquement pour la sync arrière-plan, avec log dans la fonction appelée).
- Tout appel async déclenché par l'UI gère `loading` + `error` (modèle : `login.tsx`).

## Anti-patterns spécifiques à CE projet — ne JAMAIS faire

1. **Écrire dans un store sans passer par `lib/db.ts` d'abord** (casse l'offline-first et la sync).
2. **Appeler Supabase sans garde `isSupabaseConfigured()`**.
3. Ajouter un `setInterval`/`setTimeout`/listener **sans son cleanup** (return de `useEffect`, ou clear explicite dans le store). Dette connue : le chrono de séance de `sessionStore.startSession` fuit — ne pas reproduire.
4. Déclencher des **haptics dans un composant** — ils vivent dans `sessionStore` (convention CLAUDE.md).
5. Importer **Lucide** — les icônes sont des noms string ou `phosphor-react-native`/`Ionicons`.
6. Créer un composant HUD dans `components/hud/` (dossier legacy) ou redessiner un octogone from scratch — réutiliser `components/ui/hud/`.
7. Stocker un secret ou une donnée sensible dans AsyncStorage ou dans le code (voir [05-SECURITY.md](05-SECURITY.md)).
8. Utiliser `router.push` avec une string non typée — typedRoutes est activé, laisser TS valider les href.
9. Ajouter une dépendance sans vérifier qu'elle est compatible Expo SDK 54 (`npx expo install <pkg>` plutôt que `npm i`).
10. Modifier le schéma SQLite sans passer par une **nouvelle migration versionnée** (`migrateV4` + bump `SCHEMA_VERSION`).
