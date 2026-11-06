# Travailler sur Okilo

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

## La CI

| Workflow | Quand | Ce qu'il bloque |
|---|---|---|
| `ci.yml` | chaque push et chaque PR | lint et format, types, tests et seuils de couverture, `expo-doctor`, bundle iOS et Android |
| `security.yml` | chaque PR, `main`, chaque lundi | CodeQL (code et workflows), `npm audit` (high), dépendances vulnérables ou sous licence GPL, secrets (gitleaks) |
| `pr.yml` | chaque PR | titre au format Conventional Commits, workflows valides (actionlint) ; pose les labels |
| `release.yml` | tag `v*.*.*` | version du tag = `app.json` = `package.json` ; crée la release GitHub et lance le build EAS |

- Le seul check à exiger sur `main` : **CI ok**. Il est vert quand tous les jobs ont réussi, ou ont été
  sautés parce que la PR ne touche pas l'app.
- Sur une PR, le job **Native fingerprint** dit si le natif a changé : si oui, il faudra un nouveau build,
  une mise à jour OTA ne suffira pas.
- Le résumé de chaque run montre la couverture par couche et la taille du bundle.
- Les actions sont épinglées par SHA de commit ; Dependabot les monte une fois par mois.

## Publier une version

1. Une PR `chore: release 1.2.0` qui monte `version` dans `app.json` et `package.json`.
2. Une fois mergée : `git tag v1.2.0 && git push origin v1.2.0`.
3. `release.yml` écrit les notes de version à partir des titres de PR, groupées par type
   (`.github/release.yml`), et, si le secret `EXPO_TOKEN` existe, lance le build iOS et l'envoi à
   l'App Store après validation dans l'environnement `production`.

## Architecture

Les couches et leurs règles d'import sont décrites dans `CLAUDE.md` et vérifiées par ESLint :
`domain/` (pur) ← `services/` (I/O) ← `stores/` ← `hooks/`, `components/` ← `app/`.

## Sécurité

- Aucun secret dans le code : les variables publiques sont dans `.env.local` (ignoré par git).
- La clé « anon » Supabase est publique par conception : la vraie barrière, ce sont les policies RLS.
- Tout ce qui est relu du disque ou du cloud passe par les schémas zod de `domain/schemas.ts`.
