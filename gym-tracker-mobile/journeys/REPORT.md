# Okilo · combien de taps pour chaque parcours

Mesuré sur les vrais écrans et la vraie navigation (tests `journeys/`), pas sur un téléphone.
Temps estimé : 0,4 s par tap, 0,3 s par lettre, 1,35 s pour lire chaque écran ou fenêtre
(modèle KLM, utilisateur habitué ; un débutant hésite plus).

## Séance

| Parcours                                                        | Taps | Lettres | Écrans lus | Temps estimé |
| --------------------------------------------------------------- | ---: | ------: | ---------: | -----------: |
| Faire l’exercice plus tard (machine prise)                      |    2 |       0 |          2 |        3,5 s |
| Lancer la séance et valider la 1ʳᵉ série                        |    2 |       0 |          2 |        3,5 s |
| Une série faite 2,5 kg plus lourd que prévu                     |    3 |       0 |          2 |        3,9 s |
| Ajouter un exercice à la séance                                 |    3 |       0 |          3 |        5,3 s |
| Voir la démo de l’exercice et revenir                           |    3 |       0 |          3 |        5,3 s |
| Changer d’exercice (machine prise)                              |    3 |       0 |          3 |        5,3 s |
| Noter une série ratée (moins de reps)                           |    4 |       0 |          3 |        5,7 s |
| Corriger une série déjà validée                                 |    6 |       0 |          4 |        7,8 s |
| Première séance (débutant) : charge à choisir à chaque exercice |   21 |       0 |          7 |       17,9 s |
| Une séance habituelle entière, de l’accueil au bilan            |   17 |       0 |          9 |         19 s |

## Programme

| Parcours                                                                   | Taps | Lettres | Écrans lus | Temps estimé |
| -------------------------------------------------------------------------- | ---: | ------: | ---------: | -----------: |
| Revoir la dernière séance                                                  |    1 |       0 |          2 |        3,1 s |
| Changer de programme (Push · Pull · Legs → Haut · Bas)                     |    4 |       0 |          4 |          7 s |
| Renommer un exercice du catalogue                                          |    4 |      11 |          2 |        7,6 s |
| Ajouter un exercice à une séance du programme                              |    5 |       0 |          5 |        8,8 s |
| Créer « Mon programme » à partir d’un programme copié, 3 séances renommées |    9 |      30 |          4 |         18 s |

## Arrivée

| Parcours                                                  | Taps | Lettres | Écrans lus | Temps estimé |
| --------------------------------------------------------- | ---: | ------: | ---------: | -----------: |
| Premier lancement, questions passées → 1ʳᵉ séance         |    4 |       0 |          5 |        8,4 s |
| Créer un compte depuis l’accueil, puis l’onboarding passé |    5 |      19 |          4 |       13,1 s |
| Premier lancement, les 7 questions répondues → 1ʳᵉ séance |   18 |       0 |         11 |       22,1 s |

## Ce qu’on a vu en les mesurant

- **Premier lancement, les 7 questions répondues → 1ʳᵉ séance** : Chaque question demande 2 taps (choisir + Continuer) : passer à la suivante dès le choix fait économiserait 6 taps.
- **Première séance (débutant) : charge à choisir à chaque exercice** : 5 exercices : 1 tap « Commencer à … kg » chacun en plus des séries.
- **Une séance habituelle entière, de l’accueil au bilan** : 15 séries prévues : 1 tap « Valider » par série, le repos se ferme tout seul.
- **Créer un compte depuis l’accueil, puis l’onboarding passé** : Le bouton « Créer un compte » est caché derrière « J’ai déjà un compte » : 1 tap et une lecture de trop.

## Le détail, étape par étape

<details><summary>Ajouter un exercice à la séance</summary>

1. écran /
1. tap « Lancer la séance »
1. → écran /session
1. tap « Ajouter un exercice à la séance »
1. fenêtre « choix d’exercice »
1. tap « Choisir Leg extension »

</details>

<details><summary>Ajouter un exercice à une séance du programme</summary>

1. écran /
1. tap « Profil »
1. → écran /profile
1. tap « /^Mes séances :/ »
1. → écran /days
1. tap « /^Modifier la séance Push/ »
1. → écran /days/Push
1. tap « Ajouter un exercice »
1. fenêtre « choix d’exercice »
1. tap « Choisir Squat »

</details>

<details><summary>Voir la démo de l’exercice et revenir</summary>

1. écran /
1. tap « Lancer la séance »
1. → écran /session
1. tap « /^Voir la démo/ »
1. fenêtre « démo »
1. tap « J’ai compris »

</details>

<details><summary>Faire l’exercice plus tard (machine prise)</summary>

1. écran /
1. tap « Lancer la séance »
1. → écran /session
1. tap « /^Faire .* plus tard$/ »

</details>

<details><summary>Renommer un exercice du catalogue</summary>

1. écran /
1. tap « Squat, 3 × 8 · 62,5 kg »
1. → écran /exercise/Squat
1. tap « Renommer »
1. saisie « Squat lourd » dans Ton nom pour cet exercice
1. tap « Enregistrer »

</details>

<details><summary>Revoir la dernière séance</summary>

1. écran /
1. tap « Voir la séance Pull du Lun. 9 nov. »
1. → écran /history/seed-test-inter-1794247200000

</details>

<details><summary>Premier lancement, les 7 questions répondues → 1ʳᵉ séance</summary>

1. écran /welcome
1. tap « C'est parti »
1. → écran /setup
1. tap « /^Prendre du muscle/ »
1. tap « Continuer »
1. vue « question 2 »
1. tap « Un homme »
1. tap « /^25/ »
1. tap « Continuer »
1. vue « question 3 »
1. tap « /^Quelques mois/ »
1. tap « Continuer »
1. vue « question 4 »
1. tap « /^Haut \/ Bas/ »
1. tap « Continuer »
1. vue « question 5 »
1. tap « 4 séances par semaine »
1. tap « Continuer »
1. vue « question 6 »
1. tap « 60 minutes »
1. tap « Continuer »
1. vue « question 7 »
1. tap « Basic-Fit »
1. tap « Voir mon programme »
1. vue « récapitulatif »
1. tap « Voir ma première séance »
1. → écran /session/preview
1. tap « Lancer la séance »
1. → écran /session

</details>

<details><summary>Premier lancement, questions passées → 1ʳᵉ séance</summary>

1. écran /welcome
1. tap « C'est parti »
1. → écran /setup
1. tap « Passer »
1. vue « récapitulatif »
1. tap « Voir ma première séance »
1. → écran /session/preview
1. tap « Lancer la séance »
1. → écran /session

</details>

<details><summary>Changer de programme (Push · Pull · Legs → Haut · Bas)</summary>

1. écran /
1. tap « Profil »
1. → écran /profile
1. tap « /^Programme :/ »
1. → écran /program
1. tap « /^Haut · Bas/ »
1. tap « Enregistrer »
1. → écran /

</details>

<details><summary>Créer « Mon programme » à partir d’un programme copié, 3 séances renommées</summary>

1. écran /
1. tap « Profil »
1. → écran /profile
1. tap « /^Programme :/ »
1. → écran /program
1. tap « /^Mon programme/ »
1. saisie « Ma prise de masse » dans Nom du programme (facultatif)
1. tap « Push · Pull · Legs »
1. saisie « Pecs » dans Nom de la séance 1
1. saisie « Dos » dans Nom de la séance 2
1. saisie « Jambes » dans Nom de la séance 3
1. tap « Enregistrer »
1. → écran /

</details>

<details><summary>Première séance (débutant) : charge à choisir à chaque exercice</summary>

1. écran /
1. tap « Lancer la séance »
1. → écran /session
1. vue « choix de la charge »
1. tap « Commencer à 20 kg »
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. vue « choix de la charge »
1. tap « Commencer à 20 kg »
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. vue « choix de la charge »
1. tap « Commencer à 20 kg »
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. vue « choix de la charge »
1. tap « Commencer à 20 kg »
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. vue « choix de la charge »
1. tap « Commencer à 4 kg »
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »

</details>

<details><summary>Une séance habituelle entière, de l’accueil au bilan</summary>

1. écran /
1. tap « Lancer la séance »
1. → écran /session
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. vue « Soulevé de terre roumain »
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. vue « Presse à cuisses »
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. vue « Leg curl »
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. vue « Mollets debout »
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Valider la série »
1. vue « Dernière série validée »
1. vue « séance finie »
1. tap « Terminer la séance »
1. → écran /session/summary

</details>

<details><summary>Corriger une série déjà validée</summary>

1. écran /
1. tap « Lancer la séance »
1. → écran /session
1. tap « Valider la série »
1. (repos écoulé)
1. tap « Options de la série »
1. fenêtre « menu de la série »
1. tap « Modifier le poids ou les reps »
1. fenêtre « modifier la série »
1. tap « Moins une rep »
1. tap « Enregistrer »

</details>

<details><summary>Noter une série ratée (moins de reps)</summary>

1. écran /
1. tap « Lancer la séance »
1. → écran /session
1. tap « /^Série ratée/ »
1. fenêtre « Combien de reps ? »
1. tap « /^7/ »
1. tap « /^Enregistrer 7 reps/ »

</details>

<details><summary>Une série faite 2,5 kg plus lourd que prévu</summary>

1. écran /
1. tap « Lancer la séance »
1. → écran /session
1. tap « /^Plus 2,5 kg/ »
1. tap « Valider la série »

</details>

<details><summary>Lancer la séance et valider la 1ʳᵉ série</summary>

1. écran /
1. tap « Lancer la séance »
1. → écran /session
1. tap « Valider la série »

</details>

<details><summary>Créer un compte depuis l’accueil, puis l’onboarding passé</summary>

1. écran /welcome
1. tap « J'ai déjà un compte »
1. → écran /login
1. tap « Pas de compte ? Créer un compte »
1. saisie « poseidon » dans Pseudo
1. saisie « motdepasse1 » dans Mot de passe
1. tap « Créer mon compte »
1. → écran /recovery-code
1. fenêtre « code de récupération »

</details>

<details><summary>Changer d’exercice (machine prise)</summary>

1. écran /
1. tap « Lancer la séance »
1. → écran /session
1. tap « /^Changer d'exercice/ »
1. fenêtre « choix d’exercice »
1. tap « Choisir Leg extension »

</details>
