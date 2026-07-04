# 10 — Workflow avec Claude Code

> Guide pour travailler efficacement avec Claude Code sur GymTrack. Le `CLAUDE.md` racine est lu automatiquement à chaque session — ce document est le mode d'emploi côté humain.

## Donner du contexte efficacement

1. **Nommer les fichiers réels** : « le timer de repos dans `sessionStore.ts` » vaut mieux que « le timer ». Les chemins exacts évitent une phase d'exploration.
2. **Un objectif par demande.** « Fixe la persistance de la séance » puis « extrais le RestTimer » — pas les deux dans le même message. Les grosses demandes multi-sujets produisent des changements difficiles à vérifier.
3. **Pour l'UI : screenshot ou maquette d'abord.** Le design HUD (octogones Skia, scanlines, cyans) est trop spécifique pour être décrit en mots. Donner l'image + les dimensions/couleurs attendues.
4. **Référencer la doc** : « applique la checklist de 04-TESTING » ou « suis le pattern canonique de 03-STATE-MANAGEMENT » — Claude lira le fichier et suivra le contrat.
5. Pour un bug : donner le **symptôme observé + les étapes de reproduction**, pas un diagnostic supposé.

## Le workflow validé (à répéter pour chaque feature UI)

1. **Brancher** : une branche par sujet (`feat/…`, `fix/…`, `chore/…`) depuis `main`.
2. **Section par section** : demander UNE section d'écran à la fois (ex. « la barre de modes de session », pas « refais l'écran session »).
3. **Screenshot de validation** : après chaque section, lancer l'app et comparer visuellement avant de passer à la suivante.
4. **`npm run type-check`** avant chaque commit — c'est le seul filet automatique actuel.
5. **Valider explicitement** avant que Claude enchaîne sur la section suivante.

## Conventions que Claude doit TOUJOURS respecter (rappel)

Détail complet dans [02-CODING-STANDARDS.md](02-CODING-STANDARDS.md) — les non-négociables :

- SQLite d'abord, store ensuite, sync en arrière-plan — jamais l'inverse.
- Pas de `any`, pas de hex hardcodé, pas de string UI hors i18n.
- Nouveaux composants HUD dans `components/ui/hud/` uniquement.
- Nouveau champ de schéma DB = nouvelle migration versionnée.
- `npx expo install` pour toute nouvelle dépendance (compat SDK).
- Ne jamais lancer `npm audit fix --force`.

## Pièges déjà rencontrés — à ne pas répéter

| Piège | Leçon |
|---|---|
| Commentaire mensonger « Persiste sur MMKV » sur `sessionStore` alors que rien n'est persisté | Ne jamais écrire un commentaire décrivant une intention future comme un fait. Si Claude lit un commentaire, il doit le vérifier contre le code avant de s'y fier. |
| Timer stocké via un hack de cast (`(get() as ...)._sessionInterval`) jamais nettoyé | Les ressources (intervals, listeners, subscriptions) sont des champs d'état normaux avec un cleanup explicite et visible. |
| Deux `XpRing`, deux systèmes de cadres HUD développés en parallèle | **Toujours chercher un composant existant avant d'en créer un** (`Glob components/**/*.tsx`). En cas de refonte visuelle, migrer l'ancien, pas cohabiter. |
| 3 constantes cyan différentes recréées localement (`#17B8FF`, `#1DC4FF`, `#5DD8FF`) | Toute nouvelle couleur passe par `constants/theme.ts`, même « juste pour cet écran ». |
| Écrans devenus monolithiques par accumulation de sections (session.tsx : 1 828 l.) | Chaque nouvelle section d'écran naît comme composant dans `components/<domaine>/`, jamais inline dans le fichier de route. |
| `hud-test.tsx` « temporaire, à supprimer » toujours shippé des mois après | Les écrans de test sont supprimés dans la MÊME PR que la validation, ou pas créés du tout. |
| Maquettes PNG accumulées à la racine du repo | Les références visuelles vont dans un dossier `design/` gitignoré. |
| `expo.version` / permissions déclarées sans usage réel (HealthKit) | `app.json` ne déclare que ce qui est effectivement implémenté. |

## Ce que Claude doit faire en fin de tâche

1. `npm run type-check` (depuis `gym-tracker-mobile/`).
2. Lister les fichiers modifiés + résumer les choix non triviaux.
3. Signaler toute dette créée ou découverte → l'ajouter à [09-ROADMAP-TECHNIQUE.md](09-ROADMAP-TECHNIQUE.md) plutôt que la corriger hors-scope.
4. Ne pas committer sans demande explicite, sauf accord donné en début de session.

## Maintenance de cette documentation

- Toute décision d'architecture nouvelle → `00-ARCHITECTURE.md` (section décisions).
- Tout bug corrigé notable → registre de non-régression de `04-TESTING.md`.
- Toute tâche de dette terminée → cocher/retirer dans `09-ROADMAP-TECHNIQUE.md`.
- La doc qui ment est pire que pas de doc : si le code diverge, mettre à jour le `.md` dans la même PR.
