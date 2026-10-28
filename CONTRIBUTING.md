# Travailler sur GymTrack

## Branches

`main` est toujours stable. Rien n'y arrive sans passer par une PR et une CI verte.

| Préfixe | Pour quoi | Exemple |
|---|---|---|
| `feat/` | une fonctionnalité visible | `feat/launch-animation` |
| `fix/` | une correction de bug | `fix/rest-timer-after-kill` |
| `refactor/` | du code réorganisé sans changement visible | `refactor/architecture` |
| `chore/` | outillage, dépendances, CI | `chore/bump-expo-58` |
| `redesign/` | une branche d'intégration pour un gros chantier | `redesign/disques` |

Une branche = un sujet. Si un sujet dépend d'un autre, la branche part de celle dont elle dépend
(branches empilées) et sa PR vise cette branche.

Une branche se fusionne avec un commit de merge (`git merge --no-ff`) : si elle casse quelque chose,
`git revert -m 1 <commit de merge>` l'annule d'un coup sans toucher au reste.

## Commits

Format [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```
feat(session): show the last session while logging
fix(sync): keep queue entries Supabase refused
refactor: split lib/ into domain/ and services/
test(stores): cover the rest timer
chore(ci): add the iOS bundle job
```

Un commit doit compiler et passer les tests : on peut alors retrouver un bug avec `git bisect`.

## Avant de pousser

Dans `gym-tracker-mobile/` :

```bash
npm run check   # lint (dont les règles d'architecture), format, types, tests et seuils de couverture
```

La CI (`.github/workflows/mobile-ci.yml`) relance la même chose sur chaque push et chaque PR,
construit le bundle iOS, audite les dépendances et cherche des secrets dans l'historique.

## Architecture

Les couches et leurs règles d'import sont décrites dans `CLAUDE.md` et vérifiées par ESLint :
`domain/` (pur) ← `services/` (I/O) ← `stores/` ← `hooks/`, `components/` ← `app/`.

## Sécurité

- Aucun secret dans le code : les variables publiques sont dans `.env.local` (ignoré par git).
- La clé « anon » Supabase est publique par conception : la vraie barrière, ce sont les policies RLS.
- Tout ce qui est relu du disque ou du cloud passe par les schémas zod de `domain/schemas.ts`.
